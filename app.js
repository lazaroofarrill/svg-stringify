let path = require('path')
let fs = require('fs')
let camelcase = require('camelcase')
let beautify = require('js-beautify').js

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
const staticPath = executionPath + `/static-${executionPath.substr(executionPath.lastIndexOf("/") + 1)}.js`

if (fs.existsSync(loaderPath)) {
    fs.unlinkSync(loaderPath)
}
if (fs.existsSync(staticPath)) {
    fs.unlinkSync(staticPath)
}

walk(executionPath, (err, results) => {
    if (err) console.log(err.message)
    else {
        let shorten = results.map(x => x.replace(path.resolve(executionPath), "."))

        if (ext.length !== 0) {
            shorten = shorten.filter(x => x.endsWith(ext))
        }


        let imports = ""
        let importNames = []
        shorten.forEach(x => {
            let start = x.indexOf("./") + 2
            let end = x.substring(start).indexOf("/") + 2
            let prefix = x.substring(start, end)
            prefix = camelcase(prefix)
            let name = x.substring(x.lastIndexOf("/") + 1, x.lastIndexOf("."))
            let sanitasize = `${prefix}_${name}`.split("-").join("_")
            sanitasize = sanitasize.split(" ").join("_")
            importNames.push(sanitasize)
        })

        for (let i = 0; i < shorten.length; i++) {
            imports += `const ${importNames[i]} = require('${shorten[i]}')\n`
        }
        imports += "\nconst icons = {\n"
        importNames.forEach(x => {
            imports += `"${x}": ${x},\n`
        })
        imports += "}\n" +
            "export { icons }\n"

        imports += `export { `
        importNames.forEach(x => {
            imports += `${x}, `
        })
        imports += "}"

        let statics = "export const staticIcons = {\n"
        for (let i = 0; i < shorten.length; i++) {
            statics += `'${importNames[i]}': '${root !== undefined ? root + "/" : ""}${shorten[i].substr(2)}', `
        }

        statics += "}"


        fs.writeFile(loaderPath, beautify(imports), (myError) => {
            if (myError) {
                console.log(myError.message)
            } else {
                console.log("assets exported")
            }
        })

        fs.writeFile(staticPath, beautify(statics), (myError) => {
            if (myError) {
                console.log(myError.message)
            } else {
                console.log("statics exported")
            }
        })
    }
})
