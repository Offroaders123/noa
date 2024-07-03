



// helper to swap item to end and pop(), instead of splice()ing
/**
 * @template T
 * @param {T[]} list
 * @param {T} item
 * @returns {void}
 */
export function removeUnorderedListItem(list, item) {
    var i = list.indexOf(item)
    if (i < 0) return
    if (i === list.length - 1) {
        list.pop()
    } else {
        list[i] = list.pop()
    }
}







// ....
/**
 * @param {number} rad
 * @returns {number}
 */
export function numberOfVoxelsInSphere(rad) {
    if (rad === prevRad) return prevAnswer
    var ext = Math.ceil(rad), ct = 0, rsq = rad * rad
    for (var i = -ext; i <= ext; ++i) {
        for (var j = -ext; j <= ext; ++j) {
            for (var k = -ext; k <= ext; ++k) {
                var dsq = i * i + j * j + k * k
                if (dsq < rsq) ct++
            }
        }
    }
    prevRad = rad
    prevAnswer = ct
    return ct
}
var prevRad = 0, prevAnswer = 0





// partly "unrolled" loops to copy contents of ndarrays
// when there's no source, zeroes out the array instead
/**
 * @param {number | import("ndarray").NdArray<number[]>} src
 * @param {import("ndarray").NdArray<number[]>} tgt
 * @param {import("gl-vec3")} pos
 * @param {number[]} size
 * @param {import("gl-vec3")} tgtPos
 * @returns {void}
 */
export function copyNdarrayContents(src, tgt, pos, size, tgtPos) {
    if (typeof src === 'number') {
        doNdarrayFill(src, tgt, tgtPos[0], tgtPos[1], tgtPos[2],
            size[0], size[1], size[2])
    } else {
        doNdarrayCopy(src, tgt, pos[0], pos[1], pos[2],
            size[0], size[1], size[2], tgtPos[0], tgtPos[1], tgtPos[2])
    }
}
/**
 * @param {import("ndarray").NdArray<number[]>} src
 * @param {import("ndarray").NdArray<number[]>} tgt
 * @param {number} i0
 * @param {number} j0
 * @param {number} k0
 * @param {number} si
 * @param {number} sj
 * @param {number} sk
 * @param {number} ti
 * @param {number} tj
 * @param {number} tk
 * @returns {void}
 */
function doNdarrayCopy(src, tgt, i0, j0, k0, si, sj, sk, ti, tj, tk) {
    var sdx = src.stride[2]
    var tdx = tgt.stride[2]
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var six = src.index(i0 + i, j0 + j, k0)
            var tix = tgt.index(ti + i, tj + j, tk)
            for (var k = 0; k < sk; k++) {
                tgt.data[tix] = src.data[six]
                six += sdx
                tix += tdx
            }
        }
    }
}

/**
 * @param {number} value
 * @param {import("ndarray").NdArray<number[]>} tgt
 * @param {number} i0
 * @param {number} j0
 * @param {number} k0
 * @param {number} si
 * @param {number} sj
 * @param {number} sk
 * @returns {void}
 */
function doNdarrayFill(value, tgt, i0, j0, k0, si, sj, sk) {
    var dx = tgt.stride[2]
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var ix = tgt.index(i0 + i, j0 + j, k0)
            for (var k = 0; k < sk; k++) {
                tgt.data[ix] = value
                ix += dx
            }
        }
    }
}




// iterates over 3D positions a given manhattan distance from (0,0,0)
// and exit early if the callback returns true
// skips locations beyond a horiz or vertical max distance
/**
 * @param {number} d
 * @param {number} xmax
 * @param {number} ymax
 * @param {(x: number, d: number, z: number) => boolean} cb
 * @returns {boolean}
 */
export function iterateOverShellAtDistance(d, xmax, ymax, cb) {
    if (d === 0) return cb(0, 0, 0)
    // larger top/bottom planes of current shell
    var dx = Math.min(d, xmax)
    var dy = Math.min(d, ymax)
    if (d <= ymax) {
        for (var x = -dx; x <= dx; x++) {
            for (var z = -dx; z <= dx; z++) {
                if (cb(x, d, z)) return true
                if (cb(x, -d, z)) return true
            }
        }
    }
    // smaller side planes of shell
    if (d <= xmax) {
        for (var i = -d; i < d; i++) {
            for (var y = -dy + 1; y < dy; y++) {
                if (cb(i, y, d)) return true
                if (cb(-i, y, -d)) return true
                if (cb(d, y, -i)) return true
                if (cb(-d, y, i)) return true
            }
        }
    }
    return false
}






// function to hash three indexes (i,j,k) into one integer
// note that hash wraps around every 1024 indexes.
//      i.e.:   hash(1, 1, 1) === hash(1025, 1, -1023)
/**
 * @param {number} i
 * @param {number} j
 * @param {number} k
 * @returns {number}
 */
export function locationHasher(i, j, k) {
    return (i & 1023)
        | ((j & 1023) << 10)
        | ((k & 1023) << 20)
}



/*
 * 
 *      chunkStorage - a Map-backed abstraction for storing/
 *      retrieving chunk objects by their location indexes
 * 
*/

/** @internal */
export class ChunkStorage {
    constructor() {
        /** @type {Record<string, import('./chunk.js').Chunk>} */
        this.hash = {}
    }

    /**
     * @returns {import('./chunk').Chunk | null}
     */
    getChunkByIndexes(i = 0, j = 0, k = 0) {
        return this.hash[locationHasher(i, j, k)] || null
    }
    /**
     * @param {import('./chunk').Chunk} chunk
     * @returns {void}
     */
    storeChunkByIndexes(i = 0, j = 0, k = 0, chunk) {
        this.hash[locationHasher(i, j, k)] = chunk
    }
    /**
     * @returns {void}
     */
    removeChunkByIndexes(i = 0, j = 0, k = 0) {
        delete this.hash[locationHasher(i, j, k)]
    }
}






/*
 * 
 *      LocationQueue - simple array of [i,j,k] locations, 
 *      backed by a hash for O(1) existence checks.
 *      removals by value are O(n).
 * 
*/

/** @internal */
export class LocationQueue {
    constructor() {
        /** @type {[number, number, number, number][]} */
        this.arr = []
        /** @type {Record<string, boolean>} */
        this.hash = {}
    }
    /**
     * @param {(value: [number, number, number, number], index: number, array: [number, number, number, number][]) => void} cb
     * @param {any} [thisArg]
     * @returns {void}
     */
    forEach(cb, thisArg) {
        this.arr.forEach(cb, thisArg)
    }
    /**
     * @param {number} i
     * @param {number} j
     * @param {number} k
     * @returns {boolean}
     */
    includes(i, j, k) {
        var id = locationHasher(i, j, k)
        return !!this.hash[id]
    }
    /**
     * @param {number} i
     * @param {number} j
     * @param {number} k
     * @returns {void}
     */
    add(i, j, k, toFront = false) {
        var id = locationHasher(i, j, k)
        if (this.hash[id]) return
        if (toFront) {
            this.arr.unshift([i, j, k, id])
        } else {
            this.arr.push([i, j, k, id])
        }
        this.hash[id] = true
    }
    /**
     * @param {number} ix
     * @returns {void}
     */
    removeByIndex(ix) {
        var el = this.arr[ix]
        delete this.hash[el[3]]
        this.arr.splice(ix, 1)
    }
    /**
     * @param {number} i
     * @param {number} j
     * @param {number} k
     * @returns {void}
     */
    remove(i, j, k) {
        var id = locationHasher(i, j, k)
        if (!this.hash[id]) return
        delete this.hash[id]
        for (var ix = 0; ix < this.arr.length; ix++) {
            if (id === this.arr[ix][3]) {
                this.arr.splice(ix, 1)
                return
            }
        }
        throw 'internal bug with location queue - hash value overlapped'
    }
    /**
     * @returns {number}
     */
    count() { return this.arr.length }
    /**
     * @returns {boolean}
     */
    isEmpty() { return (this.arr.length === 0) }
    /**
     * @returns {void}
     */
    empty() {
        this.arr = []
        this.hash = {}
    }
    /**
     * @returns {typeof this.arr[number]}
     */
    pop() {
        var el = this.arr.pop()
        delete this.hash[el[3]]
        return el
    }
    /**
     * @param {LocationQueue} queue
     * @returns {void}
     */
    copyFrom(queue) {
        this.arr = queue.arr.slice()
        this.hash = {}
        for (var key in queue.hash) this.hash[key] = true
    }
    /**
     * @param {(i: number, j: number, k: number) => number} locToDist
     * @returns {void}
     */
    sortByDistance(locToDist, reverse = false) {
        sortLocationArrByDistance(this.arr, locToDist, reverse)
    }
}

// internal helper for preceding class
/**
 * @param {[number, number, number, number][]} arr
 * @param {(i: number, j: number, k: number) => number} distFn
 * @param {boolean} reverse
 * @returns {void}
 */
function sortLocationArrByDistance(arr, distFn, reverse) {
    /** @type {Record<string, number>} */
    var hash = {}
    for (var loc of arr) {
        hash[loc[3]] = distFn(loc[0], loc[1], loc[2])
    }
    if (reverse) {
        arr.sort((a, b) => hash[a[3]] - hash[b[3]]) // ascending
    } else {
        arr.sort((a, b) => hash[b[3]] - hash[a[3]]) // descending
    }
    hash = null
}











// simple thing for reporting time split up between several activities
/**
 * @param {number} every
 * @param {number} [filter]
 * @returns {(state: string) => void}
 */
export function makeProfileHook(every, title = '', filter) {
    if (!(every > 0)) return () => { }
    /** @type {Record<string, number>} */
    var times = {}
    var started = 0, last = 0, iter = 0, total = 0

    var start = () => {
        started = last = performance.now()
        iter++
    }
    var add = (/** @type {string} */ name) => {
        var t = performance.now()
        times[name] = (times[name] || 0) + (t - last)
        last = t
    }
    var report = () => {
        total += performance.now() - started
        if (iter < every) return
        var out = `${title}: ${(total / every).toFixed(2)}ms  --  `
        out += Object.keys(times).map(name => {
            if (filter && (times[name] / total) < 0.05) return ''
            return `${name}: ${(times[name] / iter).toFixed(2)}ms`
        }).join('  ')
        console.log(out + `    (avg over ${every} runs)`)
        times = {}
        iter = total = 0
    }
    return (/** @type {string} */ state) => {
        if (state === 'start') start()
        else if (state === 'end') report()
        else add(state)
    }
}




// simple thing for reporting time actions/sec
/**
 * @param {number} _every
 * @param {string} _title
 * @param {number} filter
 * @returns {(state: string) => void}
 */
export function makeThroughputHook(_every, _title, filter) {
    var title = _title || ''
    var every = _every || 1
    /** @type {Record<string, number>} */
    var counts = {}
    var started = performance.now()
    var iter = 0
    return function profile_hook(/** @type {string} */ state) {
        if (state === 'start') return
        if (state === 'end') {
            if (++iter < every) return
            var t = performance.now()
            console.log(title + '   ' + Object.keys(counts).map(k => {
                var through = counts[k] / (t - started) * 1000
                counts[k] = 0
                return k + ':' + through.toFixed(2) + '   '
            }).join(''))
            started = t
            iter = 0
        } else {
            if (!counts[state]) counts[state] = 0
            counts[state]++
        }
    }
}
