'use strict'

var createInputs = require('./467.js')
var extend = require('extend')


module.exports = function (noa, opts, element) {
    return makeInputs(noa, opts, element)
}


var defaultBindings = {
    bindings: {
        "forward": "W",
        "left": "A",
        "backward": "S",
        "right": "D",
        "fire": "<mouse 1>",
        "mid-fire": "<mouse 2>",
        "alt-fire": "<mouse 3>",
        "jump": "<space>",
        "build": "E",
        "chat": "T",
        "fog": "F",
        "saveLoc": "<enter>",
        "loadLoc": "R",
        "spawnSteve": "G"
    }
}


function makeInputs(noa, opts, element) {
    opts = extend({}, defaultBindings, opts)
    var inputs = createInputs(element, opts)
    var b = opts.bindings
    for (var name in b) {
        var arr = (Array.isArray(b[name])) ? b[name] : [b[name]]
        arr.unshift(name)
        inputs.bind.apply(inputs, arr)
    }
    return inputs
}





