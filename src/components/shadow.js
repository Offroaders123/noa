'use strict'

var vec3 = require('gl-vec3')
var shadowDist

module.exports = function (noa, dist) {

	shadowDist = dist

	// create a mesh to re-use for shadows
	var scene = noa.rendering.getScene()
	var disc = BABYLON.Mesh.CreateDisc('shadow', 0.75, 30, scene)
	disc.rotation.x = Math.PI / 2
	disc.material = noa.rendering.makeStandardMaterial('shadowMat')
	disc.material.diffuseColor = BABYLON.Color3.Black()
	disc.material.specularColor = BABYLON.Color3.Black()
	disc.material.alpha = 0.5
	disc.setEnabled(false)

	// source mesh needn't be in the scene graph
	scene.removeMesh(disc)


	return {

		name: 'shadow',

		state: {
			mesh: null,
			size: 0.5
		},






	}
}

var down = vec3.fromValues(0, -1, 0)
var camPos = vec3.fromValues(0, 0, 0)
var shadowPos = vec3.fromValues(0, 0, 0)



