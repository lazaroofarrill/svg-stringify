const parse = require('parse-svg-path')
const abs = require('abs-svg-path');
const normalize = require('normalize-svg-path');
const fs = require('fs')

let data = fs.readFileSync("001-sun.svg", "utf-8")

let segments = normalize(abs(parse('M0 0L10 10A10 10 0 0 0 20 20Z')))

console.log(segments)
