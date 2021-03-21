const pathfit = require('pathfit')

path = 'M1 0h5a1 1 0 1 1 0 2H1a1 1 0 1 1 0-2zm7 8h5a1 1 0 0 1 0 2H8a1 1 0 1 1 0-2zM1 4h12a1 1 0 0 1 0 2H1a1 1 0 1 1 0-2z'

base = {
    viewBox: "-5 -7 24 24"
}

function shrinkPath(path, viewBox, targetWidth, targetHeight) {
    const pathfiter = new pathfit({viewBox}, undefined, path)
    return pathfiter.scale_with_aspect_ratio(targetWidth, targetHeight)
}

let newPath = shrinkPath(path, base.viewBox, 24, 24)

console.log(newPath)
