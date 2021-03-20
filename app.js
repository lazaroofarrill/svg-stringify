let path = require('path')
let fs = require('fs')
let camelcase = require('camelcase')

let icons = []
if (process.argv.length < 3) {
    process.exit(1);
}
let executionPath = process.argv[2]
let prefix = process.argv[3]

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

if (fs.existsSync(loaderPath)) {
    fs.unlinkSync(loaderPath)
}

walk(executionPath, (err, results) => {
    if (err) console.log(err.message)
    else {
        let shorten = results.map(x => x.replace(path.resolve(executionPath), "."))

        let imports = ""
        let importNames = []
        shorten.forEach(x => {
            let start = x.indexOf("./") + 2
            let end = x.substring(start).indexOf("/") + 2
            let prefix = x.substring(start, end)
            prefix = camelcase(prefix)
            let name = x.substring(x.lastIndexOf("/") + 1, x.lastIndexOf("."))
            importNames.push(`${prefix}_${name}`.split("-").join("_"))
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
        importNames.forEach( x => {
            imports += `${x}, `
        })
        imports += "}"


        fs.writeFile(loaderPath, imports, (myError) => {
            if (myError) {
                console.log(myError.message)
            } else {
                console.log("done")
            }
        })
    }
})
