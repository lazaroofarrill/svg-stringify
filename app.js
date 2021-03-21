const path = require('path')
const fs = require('fs');
const camelcase = require('camelcase');
const beautify = require('js-beautify').js;
const {parse} = require('svg-parser')
const pathfit = require('pathfit')
const util = require('util')


if (process.argv.length < 3) {
    process.exit(1);
}
let executionPath = process.argv[2]
let root = process.argv[3]
let ext = ""

let idx = process.argv.findIndex(x => x === '-e')
if (idx !== -1 && process.argv[idx + 1]) {
    ext = process.argv[idx + 1]
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
            // let shorten = results.map(x => x.replace(path.resolve(executionPath), "."))


            let strings = []
            results = results.filter(x => x.endsWith('.svg'))
            loadStrings(results).then((data) => {

            }).catch(err => {
                console.log(err.message)
            })

            // fs.writeFile(loaderPath, beautify(imports), (myError) => {
            //     if (myError) {
            //         console.log(myError.message)
            //     } else {
            //         console.log("assets exported")
            //     }
            // })
            //
            // fs.writeFile(loaderPathDTS, "// type Declaration for module\n" +
            //     "export const icons: { [index: string]: string };", (myError) => {
            //     if (myError) {
            //         console.log(myError.message)
            //     } else {
            //         console.log("module typescript support added")
            //     }
            // })
        }
    }
)

const readFile = util.promisify(fs.readFile)

async function loadStrings(results) {
    return Promise.all(results.map(async (file) => {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf-8', (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
    }))
}
