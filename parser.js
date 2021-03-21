const {parse} = require('svg-parser')
let beautify = require('js-beautify').js
const pathfit = require('pathfit')


const parsed = parse(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -7 24 24" width="24" height="24" preserveAspectRatio="xMinYMin"
     class="jam jam-menu">
  <path
    d='M1 0h5a1 1 0 1 1 0 2H1a1 1 0 1 1 0-2zm7 8h5a1 1 0 0 1 0 2H8a1 1 0 1 1 0-2zM1 4h12a1 1 0 0 1 0 2H1a1 1 0 1 1 0-2z'/>
</svg>
`)

function shrinkPath(path, base) {
    const pathfiter = new pathfit(base, undefined, path)
    return pathfiter.scale_with_aspect_ratio(base.width, base.height)
}

let base = parsed.children[0].properties
base.preserveAspectRatio += ' meet'
let path = parsed.children[0].children[0].properties.d

console.log(JSON.stringify(base))
console.log(JSON.stringify(path))

let shrinked = shrinkPath(path, base)
console.log(shrinked)


// console.log(beautify(JSON.stringify(parsed)))
