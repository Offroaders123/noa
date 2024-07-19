'use strict'


var extend = require('extend')
var glvec3 = require('gl-vec3')
var aabb = require('aabb-3d')
var sweep = require('voxel-aabb-sweep')
var removeUnorderedListItem = require('./util').removeUnorderedListItem


// For now, assume Babylon.js has been imported into the global space already
if (!BABYLON) {
    throw new Error('Babylon.js reference not found! Abort! Abort!')
}

module.exports = function (noa, opts, canvas) {
    return new Rendering(noa, opts, canvas)
}

var vec3 = BABYLON.Vector3 // not a gl-vec3, in this module only!!
var col3 = BABYLON.Color3
window.BABYLON = BABYLON


// profiling flags
var PROFILE = 0



var defaults = {
    showFPS: false,
    antiAlias: true,
    clearColor: [0.588, 0.835, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [0.5, 0.5, 0.5],
    initialCameraZoom: 0,
    cameraZoomSpeed: .2,
    cameraMaxAngle: (Math.PI / 2) - 0.01,
    useAO: true,
    AOmultipliers: [0.93, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
}





function Rendering(noa, _opts, canvas) {
    this.noa = noa
    var opts = extend({}, defaults, _opts)
    this.zoomDistance = opts.initialCameraZoom      // zoom setting
    this._currentZoom = this.zoomDistance       // current actual zoom level
    this._cameraZoomSpeed = opts.cameraZoomSpeed
    this._maxCamAngle = opts.cameraMaxAngle

    // set up babylon scene
    initScene(this, canvas, opts)

    // internals
    this._meshedChunks = {}
    this._numMeshedChunks = 0
    this.useAO = !!opts.useAO
    this.aoVals = opts.AOmultipliers
    this.revAoVal = opts.reverseAOmultiplier
    this.meshingCutoffTime = 6 // ms

    // for debugging
    window.scene = this._scene
    if (opts.showFPS) setUpFPS()
}


// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {
    if (!BABYLON) throw new Error('BABYLON.js engine not found!')

    // init internal properties
    self._engine = new BABYLON.Engine(canvas, opts.antiAlias, undefined, true)
    self._scene = new BABYLON.Scene(self._engine)
    var scene = self._scene
    // remove built-in listeners
    scene.detachControl()

    // octree setup
    self._octree = new BABYLON.Octree()
    self._octree.blocks = []
    scene._selectionOctree = self._octree

    // camera, and empty mesh to hold it, and one to accumulate rotations
    self._rotationHolder = new BABYLON.Mesh('rotHolder', scene)
    self._cameraHolder = new BABYLON.Mesh('camHolder', scene)
    self._camera = new BABYLON.FreeCamera('camera', new vec3(0, 0, 0), scene)
    self._camera.parent = self._cameraHolder
    self._camera.minZ = .01
    self._cameraHolder.visibility = false
    self._rotationHolder.visibility = false

    // plane obscuring the camera - for overlaying an effect on the whole view
    self._camScreen = BABYLON.Mesh.CreatePlane('camScreen', 10, scene)
    self.addDynamicMesh(self._camScreen)
    self._camScreen.position.z = .11
    self._camScreen.parent = self._camera
    self._camScreenMat = self.makeStandardMaterial('camscreenmat')
    self._camScreenMat.specularColor = new col3(0, 0, 0)
    self._camScreen.material = self._camScreenMat
    self._camScreen.setEnabled(false)
    self._camLocBlock = 0

    // apply some defaults
    self._light = new BABYLON.HemisphericLight('light', new vec3(0.1, 1, 0.3), scene)
    function arrToColor(a) { return new col3(a[0], a[1], a[2]) }
    scene.clearColor = arrToColor(opts.clearColor)
    scene.ambientColor = arrToColor(opts.ambientColor)
    self._light.diffuse = arrToColor(opts.lightDiffuse)
    self._light.specular = arrToColor(opts.lightSpecular)
    self._light.groundColor = arrToColor(opts.groundLightColor)

    // create a flat, non-specular material to be used globally
    // for any mesh that has colored vertices and no texture
    self.flatMaterial = self.makeStandardMaterial('flatmat')
    self.flatMaterial.specularColor = BABYLON.Color3.Black()

    // // same for emissive elements
    // removing this until I find I need it...
    // self.emissiveMat = self.makeStandardMaterial('emissivemat')
    // self.emissiveMat.specularColor = BABYLON.Color3.Black()
    // self.emissiveMat.emissiveColor = BABYLON.Color3.White()
}



/*
 *   PUBLIC API 
*/

// Init anything about scene that needs to wait for engine internals
Rendering.prototype.initScene = function () {
    // engine entity to follow the player and act as camera target
    this.cameraTarget = this.noa.ents.createEntity(['position'])
    this.noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
        entity: this.noa.playerEntity,
        offset: [0, this.noa.playerEyeOffset, 0],
    })
}

// accessor for client app to build meshes and register materials
Rendering.prototype.getScene = function () {
    return this._scene
}

// tick function is empty at the moment..
Rendering.prototype.tick = function (dt) {

}





Rendering.prototype.render = function (dt) {
    PROFILE += dt
    updateCamera(this)
    this._engine.beginFrame()
    this._scene.render()
    if (!this.noa.addMode) y(this, PROFILE)
    if (this.noa.addMode) b(this, PROFILE)
    fps_hook()
    this._engine.endFrame()
    if (this.noa.version) {
        this.noa.version.fps = Math.round(1000 / this._scene.getEngine().getDeltaTime())
        this.noa.version.chunkUpdates += this.noa.world._blockChanges
        this.noa.version.redraw()
        this.noa.world._blockChanges = 0
    }
    this.noa.inputs.tick()
}

Rendering.prototype.resize = function (e) {
    this._engine.resize()
}

Rendering.prototype.highlightBlockFace = function (show, posArr, normArr, mmm) {
    var m = getHighlightMesh(this)
    if (show && !mmm) {
        // bigger slop when zoomed out
        this._currentZoom
        glvec3.distance(this.noa.getPlayerEyePosition(), posArr)
        var slop = 0
        var pos = _highlightPos
        for (var i = 0; i < 3; ++i) {
            pos[i] = posArr[i] + .5
        }
        m.position.copyFromFloats(pos[0], pos[1], pos[2])
        m.setEnabled(true)
    } else {
        m.setEnabled(false)
    }
    m = drawBlockHiglight(this)
    if (show && mmm) {
        this._currentZoom
        glvec3.distance(this.noa.getPlayerEyePosition(), posArr)
        slop = 0
        pos = _highlightPos
        i = 0
        for (; i < 3; ++i) {
            pos[i] = posArr[i] + 0.5 + (1 + slop) * normArr[i]
        }
        m.position.copyFromFloats(pos[0], pos[1], pos[2] - 0.5)
        m.setEnabled(true)
    } else {
        m.setEnabled(false)
    }
}
var _highlightPos = glvec3.create()


Rendering.prototype.getCameraVector = function () {
    return vec3.TransformCoordinates(BABYLON.Axis.Z, this._rotationHolder.getWorldMatrix())
}
var zero = vec3.Zero()
Rendering.prototype.getCameraPosition = function () {
    return vec3.TransformCoordinates(zero, this._camera.getWorldMatrix())
}
Rendering.prototype.getCameraRotation = function () {
    var rot = this._rotationHolder.rotation
    return [rot.x, rot.y]
}
Rendering.prototype.setCameraRotation = function (x, y) {
    var rot = this._rotationHolder.rotation
    rot.x = Math.max(-this._maxCamAngle, Math.min(this._maxCamAngle, x))
    rot.y = y
}


// add a dynamic (mobile, non-terrain) mesh to the scene
Rendering.prototype.addDynamicMesh = function (mesh) {
    var i = this._octree.dynamicContent.indexOf(mesh)
    if (i >= 0) return
    this._octree.dynamicContent.push(mesh)
    for (var i = 0; i < mesh.getChildren().length; i++) {
        this._octree.dynamicContent.push(mesh.getChildren()[i])
        mesh.getChildren()[i].useOctreeForCollisions = true
    }
    var remover = removeUnorderedListItem.bind(null, this._octree.dynamicContent, mesh)
    if (mesh.onDisposeObservable) {
        // the babylon 2.4+ way:
        mesh.onDisposeObservable.add(remover)
    } else {
        // the babylon 2.3- way, which no longer works in 2.4+
        var prev = mesh.onDispose || function () { }
        mesh.onDispose = function () { prev(); remover() }
    }
}

// remove a dynamic (mobile, non-terrain) mesh to the scene
Rendering.prototype.removeDynamicMesh = function (mesh) {
    removeUnorderedListItem(this._octree.dynamicContent, mesh)
}




Rendering.prototype.makeMeshInstance = function (mesh, isTerrain) {
    var m = mesh.createInstance(mesh.name + ' instance' || false)
    if (mesh.billboardMode) m.billboardMode = mesh.billboardMode
    if (!isTerrain) {
        // non-terrain stuff should be dynamic w.r.t. selection octrees
        this.addDynamicMesh(m)
    }

    // testing performance tweaks

    // make instance meshes skip over getLOD checks, since there may be lots of them
    mesh.getLOD = m.getLOD = function () { return mesh }
    m._currentLOD = mesh

    // make terrain instance meshes skip frustum checks 
    // (they'll still get culled by octree checks)
    if (isTerrain) m.isInFrustum = function () { return true }

    return m
}



// create a new standardMaterial, with any settings needed
Rendering.prototype.makeStandardMaterial = function (name) {
    var mat = new BABYLON.StandardMaterial(name, this._scene)
    setTimeout(function () { mat.freeze() }, 10)
    return mat
}



Rendering.prototype.makeDynamicStandardMaterial = function (name) {
    return new BABYLON.StandardMaterial(name, this._scene)
}




/*
 *
 * 
 *   ACCESSORS FOR CHUNK ADD/REMOVAL/MESHING
 *
 * 
*/

Rendering.prototype.prepareChunkForRendering = function (chunk) {
    var cs = chunk.size
    var min = new vec3(chunk.x, chunk.y, chunk.z)
    var max = new vec3(chunk.x + cs, chunk.y + cs, chunk.z + cs)
    chunk.octreeBlock = new BABYLON.OctreeBlock(min, max)
    this._octree.blocks.push(chunk.octreeBlock)
    window.chunk = chunk
}

Rendering.prototype.disposeChunkForRendering = function (chunk) {
    this.removeTerrainMesh(chunk)
    removeUnorderedListItem(this._octree.blocks, chunk.octreeBlock)
    chunk.octreeBlock.entries.length = 0
    chunk.octreeBlock = null
}

Rendering.prototype.addTerrainMesh = function (chunk, mesh) {
    this._meshedChunks[chunk.id] = mesh
    this._numMeshedChunks++
    if (mesh.getIndices().length) chunk.octreeBlock.entries.push(mesh)
    mesh.getChildren().map(function (m) {
        chunk.octreeBlock.entries.push(m)
    })
}

Rendering.prototype.removeTerrainMesh = function (chunk) {
    var mesh = this._meshedChunks[chunk.id]
    if (mesh) {
        removeUnorderedListItem(chunk.octreeBlock.entries, mesh)
        mesh.getChildren().map(function (m) {
            removeUnorderedListItem(chunk.octreeBlock.entries, m)
        })
        mesh.dispose()
        delete this._meshedChunks[chunk.id]
        this._numMeshedChunks--
    }
}










/*
 *
 *   INTERNALS
 *
*/




/*
 *
 *  zoom/camera related internals
 *
*/


// check if obstructions are behind camera by sweeping back an AABB
// along the negative camera vector

function cameraObstructionDistance(self) {
    var size = 0.2
    if (!_camBox) {
        _camBox = new aabb([0, 0, 0], [size * 2, size * 2, size * 2])
        _getVoxel = function (x, y, z) {
            return self.noa.world.getBlockSolidity(x, y, z)
        }
    }

    var pos = self._cameraHolder.position
    glvec3.set(_posVec, pos.x - size, pos.y - size, pos.z - size)
    _camBox.setPosition(_posVec)

    var dist = -self.zoomDistance
    var cam = self.getCameraVector()
    glvec3.set(_camVec, dist * cam.x, dist * cam.y, dist * cam.z)

    return sweep(_getVoxel, _camBox, _camVec, function (dist, axis, dir, vec) {
        return true
    }, true)
}

var _posVec = glvec3.create()
var _camVec = glvec3.create()
var _camBox
var _getVoxel

function y(e, t) {
    var i = e._highlightMesh
    if (i) {
        i.material.alpha = 0.05 + Math.abs(Math.sin(t * 0.005)) * 0.25
    }
}




// Various updates to camera position/zoom, called every render

function updateCamera(self) {
    // update cameraHolder pos/rot from rotation holder and target entity
    self._cameraHolder.rotation.copyFrom(self._rotationHolder.rotation)
    var cpos = self.noa.ents.getPositionData(self.cameraTarget).renderPosition
    self._cameraHolder.position.copyFromFloats(cpos[0], cpos[1], cpos[2])

    // check obstructions and tween camera towards clipped position
    var dist = self.zoomDistance
    var speed = self._cameraZoomSpeed
    if (dist > 0) {
        dist = cameraObstructionDistance(self)
        if (dist < self._currentZoom) self._currentZoom = dist
    }
    self._currentZoom += speed * (dist - self._currentZoom)
    self._camera.position.z = -self._currentZoom

    // check id of block camera is in for overlay effects (e.g. being in water) 
    var cam = self.getCameraPosition()
    var id = self.noa.world.getBlockID(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z))
    checkCameraEffect(self, id)
}



//  If camera's current location block id has alpha color (e.g. water), apply/remove an effect

function checkCameraEffect(self, id) {
    if (id === self._camLocBlock) return
    if (id === 0 || id === 40) {
        self._camScreen.setEnabled(false)
        self._scene.fogColor = new BABYLON.Color3(0.9, 0.95, 1)
        self._scene.fogDensity = self.fogWorld
        self._scene.clearColor = self._scene.fogColor
    } else {
        var matAccessor = self.noa.registry.getBlockFaceMaterialAccessor()
        var matId = matAccessor(id, 1)
        var matData = self.noa.registry.getMaterialData(matId)
        var col = matData.color
        var alpha = matData.alpha
        if (col && alpha && alpha < 1) {
            if (id == 17) {
                self._camScreenMat.diffuseColor = new col3(0.8, 0, 0)
                self._camScreenMat.alpha = 0.8
                self._camScreen.setEnabled(true)
                self._scene.fogColor = new BABYLON.Color3(0.1, 0, 0)
                self._scene.fogDensity = self.fogLava
                self._scene.clearColor = self._scene.fogColor
            }
            if (id == 7 || id == 41) {
                self._camScreenMat.diffuseColor = new col3(0, 0, 0.8)
                self._camScreenMat.alpha = 0.5
                self._camScreen.setEnabled(true)
                self._scene.fogColor = new BABYLON.Color3(0, 0, 0.1)
                self._scene.fogDensity = self.fogWater
                self._scene.clearColor = self._scene.fogColor
            }
        }
    }
    self._camLocBlock = id
}



function b(e, t) {
    var i = e._previewMesh
    if (i) {
        var n = 0.35 + Math.abs(Math.sin(t * 0.003)) * 0.35
        i.material.alpha = n
        i._children[0].material.alpha = n
        i._children[1].material.alpha = n
        i._children[2].material.alpha = n
        i._children[3].material.alpha = n
        i._children[4].material.alpha = n
        i._children[6].material.alpha = n
    }
}



// make or get a mesh for highlighting active voxel
function getHighlightMesh(rendering) {
    var m = rendering._highlightMesh
    if (!m) {
        var mesh = BABYLON.Mesh.CreateBox("highlight", 0.001, rendering._scene)
        var hlm = rendering.makeDynamicStandardMaterial('highlightMat')
        hlm.disableLighting = true
        hlm.backFaceCulling = false
        hlm.emissiveColor = new col3(1, 1, 1)
        hlm.alpha = 0.2
        mesh.material = hlm
        m = rendering._highlightMesh = mesh
        // outline
        var s = 0.5
        var lines = BABYLON.Mesh.CreateLines("hightlightLines", [
            new vec3(s, s, s),
            new vec3(s, -s, s),
            new vec3(-s, -s, s),
            new vec3(-s, s, s),
            new vec3(s, s, s),
            new vec3(s, s, -s),
            new vec3(s, -s, -s),
            new vec3(-s, -s, -s),
            new vec3(-s, s, -s),
            new vec3(s, s, -s),
            new vec3(s, s, s),
            new vec3(s, -s, s),
            new vec3(s, -s, -s),
            new vec3(s, s, -s),
            new vec3(s, s, s),
            new vec3(-s, s, s),
            new vec3(-s, -s, s),
            new vec3(-s, -s, -s),
            new vec3(-s, s, -s),
            new vec3(-s, s, s)
        ], rendering._scene)
        lines.color = new col3(0, 0, 0)
        lines.parent = mesh
        // this line up might be what I modified way early on in Minefork ^^^

        rendering.addDynamicMesh(m)
        rendering.addDynamicMesh(lines)
    }
    return m
}

function drawBlockHiglight(e) {
    function t() {
        var e = noa.rendering.getScene()
        var t = Math.PI * 0.25
        var i = BABYLON.Mesh.CreatePlane('plane1', 1, e)
        var n = BABYLON.Mesh.CreatePlane('plane2', 1, e)
        i.rotation.y = t
        n.rotation.y = Math.PI + t
        var r = BABYLON.Mesh.CreatePlane('plane3', 1, e)
        var o = BABYLON.Mesh.CreatePlane('plane4', 1, e)
        r.rotation.y = -Math.PI * 0.5 + t
        o.rotation.y = Math.PI * 0.5 + t
        i.position = new BABYLON.Vector3(0, 0, 0.5)
        n.position = new BABYLON.Vector3(0, 0, 0.5)
        r.position = new BABYLON.Vector3(0, 0, 0.5)
        o.position = new BABYLON.Vector3(0, 0, 0.5)
        var a = BABYLON.Mesh.MergeMeshes([i, n, r, o])
        return a
    }
    var i = e._previewMesh
    if (!i) {
        var n = BABYLON.Mesh.CreatePlane('preview0', 1, e._scene)
        var r = e.makeDynamicStandardMaterial('previewMat0')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        n.material = r
        var o = BABYLON.Mesh.CreatePlane('preview1', 1, e._scene)
        var r = e.makeDynamicStandardMaterial('previewMat1')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        o.material = r
        o.parent = n
        o.rotation.y = Math.PI
        o.position = new BABYLON.Vector3(0, 0, 1)
        var a = BABYLON.Mesh.CreatePlane('preview2', 1, e._scene)
        var r = e.makeDynamicStandardMaterial('previewMat2')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        a.material = r
        a.parent = n
        a.rotation.y = Math.PI * 0.5
        a.position = new BABYLON.Vector3(-0.5, 0, 0.5)
        var s = BABYLON.Mesh.CreatePlane('preview3', 1, e._scene)
        var r = e.makeDynamicStandardMaterial('previewMat3')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        s.material = r
        s.parent = n
        s.rotation.y = Math.PI * -0.5
        s.position = new BABYLON.Vector3(0.5, 0, 0.5)
        var l = BABYLON.Mesh.CreatePlane('preview4', 1, e._scene)
        var r = e.makeDynamicStandardMaterial('previewMat4')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        l.material = r
        l.parent = n
        l.rotation.x = Math.PI * -0.5
        l.rotation.y = Math.PI
        l.position = new BABYLON.Vector3(0, -0.5, 0.5)
        var h = BABYLON.Mesh.CreatePlane('preview5', 1, e._scene)
        var r = e.makeDynamicStandardMaterial('previewMat5')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        h.material = r
        h.parent = n
        h.rotation.x = Math.PI * 0.5
        h.position = new BABYLON.Vector3(0, 0.5, 0.5)
        var f = 0.5
        var d = BABYLON.Mesh.CreateLines('previewLines', [new vec3(f, f, f), new vec3(f, -f, f), new vec3(-f, -f, f), new vec3(-f, f, f), new vec3(f, f, f), new vec3(f, f, -f), new vec3(f, -f, -f), new vec3(-f, -f, -f), new vec3(-f, f, -f), new vec3(f, f, -f), new vec3(f, f, f), new vec3(f, -f, f), new vec3(f, -f, -f), new vec3(f, f, -f), new vec3(f, f, f), new vec3(-f, f, f), new vec3(-f, -f, f), new vec3(-f, -f, -f), new vec3(-f, f, -f), new vec3(-f, f, f)], e._scene)
        d.color = new col3(0, 0, 0)
        d.position = new BABYLON.Vector3(0, 0, 0.5)
        d.parent = n
        var t = t()
        t.parent = n
        var r = e.makeStandardMaterial('crossMat')
        r.diffuseTexture = new BABYLON.Texture(null, e._scene)
        t.material = r
        i = e._previewMesh = n
        e.addDynamicMesh(i)
        e.addDynamicMesh(o)
        e.addDynamicMesh(a)
        e.addDynamicMesh(s)
        e.addDynamicMesh(l)
        e.addDynamicMesh(h)
        e.addDynamicMesh(d)
        e.addDynamicMesh(t)
    }
    return i
}



















/*
 * 
 *      sanity checks:
 * 
*/

Rendering.prototype.debug_SceneCheck = function () {
    var meshes = this._scene.meshes
    var dyns = this._octree.dynamicContent
    var octs = []
    var mats = this._scene.materials
    var allmats = []
    mats.forEach(mat => {
        if (mat.subMaterials) mat.subMaterials.forEach(mat => allmats.push(mat))
        else allmats.push(mat)
    })
    this._octree.blocks.forEach(function (block) {
        for (var m in block.entries) octs.push(block.entries[m])
    })
    meshes.forEach(function (m) {
        if (m._isDisposed) warn(m, 'disposed mesh in scene')
        if (empty(m)) return
        if (missing(m, dyns, octs)) warn(m, 'non-empty mesh missing from octree')
        if (!m.material) { warn(m, 'non-empty scene mesh with no material'); return }
        (m.material.subMaterials || [m.material]).forEach(function (mat) {
            if (missing(mat, mats)) warn(mat, 'mesh material not in scene')
        })
    })
    var unusedMats = []
    allmats.forEach(mat => {
        var used = false
        meshes.forEach(mesh => {
            if (mesh.material === mat) used = true
            if (!mesh.material || !mesh.material.subMaterials) return
            if (mesh.material.subMaterials.includes(mat)) used = true
        })
        if (!used) unusedMats.push(mat.name)
    })
    if (unusedMats.length) {
        console.warn('Materials unused by any mesh: ', unusedMats.join(', '))
    }
    dyns.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree/dynamic mesh not in scene')
    })
    octs.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree block mesh not in scene')
    })
    function warn(obj, msg) { console.warn(obj.name + ' --- ' + msg) }
    function empty(mesh) { return (mesh.getIndices().length === 0) }
    function missing(obj, list1, list2) {
        if (!obj) return false
        if (list1.includes(obj)) return false
        if (list2 && list2.includes(obj)) return false
        return true
    }
    return 'done.'
}

Rendering.prototype.debug_MeshCount = function () {
    var ct = {}
    this._scene.meshes.forEach(m => {
        var n = m.name || ''
        n = n.replace(/-\d+.*/, '#')
        n = n.replace(/\d+.*/, '#')
        n = n.replace(/(rotHolder|camHolder|camScreen)/, 'rendering use')
        n = n.replace(/atlas sprite .*/, 'atlas sprites')
        ct[n] = ct[n] || 0
        ct[n]++
    })
    for (var s in ct) console.log('   ' + (ct[s] + '       ').substr(0, 7) + s)
}







var profile_hook = (function () {
    if (!PROFILE) return function () { }
    var every = 200
    var timer = new (require('./util').Timer)(every, 'render internals')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()



var fps_hook = function () { }
function setUpFPS() {
    var div = document.createElement('div')
    div.id = 'noa_fps'
    var style = 'position:absolute; top:0; right:0; z-index:0;'
    style += 'color:white; background-color:rgba(0,0,0,0.5);'
    style += 'font:14px monospace; text-align:center;'
    style += 'min-width:2em; margin:4px;'
    div.style = style
    document.body.appendChild(div)
    var every = 1000
    var ct = 0
    var longest = 0
    var start = performance.now()
    var last = start
    fps_hook = function () {
        ct++
        var nt = performance.now()
        if (nt - last > longest) longest = nt - last
        last = nt
        if (nt - start < every) return
        var fps = Math.round(ct / (nt - start) * 1000)
        var min = Math.round(1 / longest * 1000)
        div.innerHTML = fps + '<br>' + min
        ct = 0
        longest = 0
        start = nt
    }
}


