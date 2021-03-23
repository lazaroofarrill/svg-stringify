#!/usr/bin/env node

const path = require('path')
const fs = require('fs');
const beautify = require('js-beautify').js;
const {parse} = require('svg-parser')
const pathfit = require('pathfit')
const util = require('util')
const {ESLint} = require('eslint')
const toPath = require('element-to-path')

if (process.argv.length < 3) {
    console.log("no arguments supplied. quitting")
    process.exit(0);
}
let executionPath = process.argv[2]
let root = process.argv[3]
let ext = ""

let idx = process.argv.findIndex(x => x === '-e')
if (idx !== -1 && process.argv[idx + 1]) {
    ext = process.argv[idx + 1]
}

let loadStyles = false
idx = process.argv.findIndex(x => x === '--styles')
if (idx !== -1) {
    loadStyles = true
}

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err)
        let pending = list.length
        if (!pending) return done(null, results)
        list.forEach(file => {
            file = path.resolve(dir, file)
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    walk(file, (err, res) => {
                        results = results.concat(res)
                        if (!--pending) done(null, results)
                    })
                } else {
                    results.push(file)
                    if (!--pending) done(null, results)
                }
            })
        })
    })
}


if (executionPath.endsWith("/")) {
    executionPath = executionPath.substr(0, executionPath.length - 1)
}
const loaderPath = executionPath + `/import-${executionPath.substr(executionPath.lastIndexOf("/") + 1)}.js`
const loaderPathDTS = executionPath + `/import-${executionPath.substr(executionPath.lastIndexOf("/") + 1)}.d.ts`

if (fs.existsSync(loaderPath)) {
    fs.unlinkSync(loaderPath)
}

walk(executionPath, (err, results) => {
        if (err) console.log(err.message)
        else {


            let strings = []
            results = results.filter(x => x.endsWith('.svg'))
            results = results.filter(x => x.indexOf("node_modules") === -1)
            loadStrings(results)
                .then(data => createExportObject(data))
                .catch(err => {
                    console.log(err.message)
                })
        }
    }
)

const readFile = util.promisify(fs.readFile)

async function loadStrings(results) {
    return Promise.all(results.map(async (file) => {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf-8', (err, data) => {
                if (err) reject(err)
                else {
                    resolve({
                        file: file,
                        data: data
                    })
                }
            })
        })
    }))
}

function createExportObject(objects) {
    let shorten = objects.map(x => x.file.replace(path.resolve(executionPath), ""))
    let keys = shorten.map(x => x.substring(x.lastIndexOf("/") + 1))
    keys = keys.map(x => x.substring(0, x.lastIndexOf(".")))
    let prefix = shorten.map(x => x.substring(0, x.indexOf("/", 1)))
    prefix = prefix.map(x => x.replace("/", ""))

    for (let i = 0; i < keys.length; i++) {
        keys[i] = prefix[i] + (prefix[i] ? "_" : "") + keys[i]
    }
    // console.log(keys)

    let paths = objects.map(x => stringify(x.data))
    let stringifiedIcons = {}
    for (let i = 0; i < keys.length; i++) {
        stringifiedIcons[keys[i]] = paths[i]
    }

    // console.debug(stringifiedIcons)
    writeFiles(stringifiedIcons)
}

function stringify(svg) {
    const parsed = parse(svg)
    // console.log(beautify(JSON.stringify(parsed)))
    let base = parsed.children[0].properties
    delete base.preserveAspectRatio
    let path = searchPath(parsed)
    // return shrinkPath(path, base)
    let pathString = path.join('&&')
    let pathCapitalized = pathString.charAt(0).toUpperCase() + pathString.slice(1)
    if (base.viewBox) {
        pathCapitalized += `|${base.viewBox}`
    }
    // console.log(pathString)
    return pathCapitalized
}

function shrinkPath(path, base) {
    const pathfiter = new pathfit(base, undefined, path)
    return pathfiter.scale_with_aspect_ratio(24, 24)
    // console.log(result)
}

function writeFiles(imports) {
    let myModule = "export const icons = " + JSON.stringify(imports)
    myModule = beautify(myModule)
    // console.log(myModule)

    let types = "// type Declaration for module\n" +
        "export const icons: { [index: string]: string };"

    fs.writeFile(loaderPath, myModule, "utf-8", err => {
        if (err) {
            console.log(err.message)
        } else {
            console.log("imports created")

            const linter = new ESLint({fix: true})
            linter.lintFiles([loaderPath]).then(result => {
                ESLint.outputFixes(result).then().catch(err => console.log(err.message))
            }).catch(err => console.log(err.message))
        }
    })
    fs.writeFile(loaderPathDTS, types, "utf-8", err => {
        if (err) console.log(err.message)
        else console.log("type declarations created")
    })
}

function searchPath(object) {
    // console.log(object)
    let result = []
    if ("tagName" in object) {
        if (object.tagName === 'path') {
            let path = object.properties.d
            if (loadStyles && object.properties.style) {
                path += `@@${object.properties.style}`
            }
            if (object.properties.transform) {
                path += `@@${object.properties.transform}`
            }
            result.push(path)
        } else if (
            object.tagName === 'rect' ||
            object.tagName === 'circle' ||
            object.tagName === 'ellipse' ||
            object.tagName === 'line' ||
            object.tagName === 'polyline' ||
            object.tagName === 'polygon') {
            result.push(toPath(object, {nodeName: 'tagName', nodeAttrs: 'properties'}))
        }
    }

    if ("children" in object) {
        for (let i = 0; i < object.children.length; i++) {
            result = result.concat(searchPath(object.children[i]))
        }
    }
    return result
}
