'use strict'

var vec3 = require('gl-vec3')

/**
 * 
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body. 
 * 
 */

module.exports = function (noa) {
	return {

		name: 'movement',

		state: {
			// current state
			heading: 0, 			// radians
			running: false,
			jumping: false,

			// options:
			maxSpeed: 6,
			moveForce: 30,
			responsiveness: 15,
			runningFriction: 0,
			standingFriction: 50,

			airMoveMult: 0.5,
			jumpImpulse: 11,
			jumpForce: 6.5,
			jumpTime: 500,
			airJumps: 1,

			// internal state
			_jumpCount: 0,
			_isJumping: 0,
			_currjumptime: 0,
		},

		onAdd: null,

		onRemove: null,


		system: function movementProcessor(dt, states) {
			var ents = noa.entities

			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				var body = ents.getPhysicsBody(state.__id)
				applyMovementPhysics(dt, state, body)
			}

		}


	}
}


var tempvec = vec3.create()
var tempvec2 = vec3.create()
var zeroVec = vec3.create()


function applyMovementPhysics(dt, state, body) {
	// move implementation originally written as external module
	//   see https://github.com/andyhall/voxel-fps-controller
	//   for original code

	var s = noa.world.getBlockID(Math.floor(body.aabb.base[0]), Math.floor(body.aabb.base[1]), Math.floor(body.aabb.base[2]))
	var c = noa.world.getBlockID(Math.floor(body.aabb.base[0]), Math.floor(body.aabb.base[1] + 0.5), Math.floor(body.aabb.base[2]))
	var sprint = false
	var crouch = false
	if (s == 7 || s == 41 || c == 7 || c == 41) {
		sprint = true
	}
	if (s == 17) {
		crouch = true
	}
	body.autoStep = false
	if ((sprint || crouch) && c == 0) {
		body.autoStep = true
	}
	body.gravityMultiplier = 4.2
	if (sprint) {
		body.gravityMultiplier = 2.1
	}
	if (crouch) {
		body.gravityMultiplier = 1.05
	}

	// jumping
	var onGround = (body.atRestY() < 0)
	var canjump = (onGround || state._jumpCount < state.airJumps)
	if (onGround) {
		state._isJumping = false
		state._jumpCount = 0
	}

	// process jump input
	if (!state.jumping || sprint || crouch) {
			state._isJumping = false
		} else if (state._isJumping) { // continue previous jump
			if (state._currjumptime > 0) {
				var jf = state.jumpForce
				if (state._currjumptime < dt) jf *= state._currjumptime / dt
				body.applyForce([0, jf, 0])
				state._currjumptime -= dt
			}
		} else if (canjump) { // start new jump
			state._isJumping = true
			if (!onGround) state._jumpCount++
			state._currjumptime = state.jumpTime
			body.applyImpulse([0, state.jumpImpulse, 0])
			// clear downward velocity on airjump
			if (!onGround && body.velocity[1] < 0) body.velocity[1] = 0
	}
	if (state.jumpWasPressed && sprint) {
		body.applyForce([0, state.maxSpeed * 3, 0])
	}
	if (state.jumpWasPressed && crouch) {
		body.applyForce([0, state.maxSpeed * 1.5, 0])
	}

	// apply movement forces if entity is moving, otherwise just friction
	var m = tempvec
	var push = tempvec2
	if (state.running) {

		var speed = state.maxSpeed
		// todo: add crouch/sprint modifiers if needed
		// if (state.sprint) speed *= state.sprintMoveMult
		// if (state.crouch) speed *= state.crouchMoveMult

		if (sprint) {
			speed *= 0.5
		}
		if (crouch) {
			speed *= 0.25
		}

		vec3.set(m, 0, 0, speed)

		// rotate move vector to entity's heading
		vec3.rotateY(m, m, zeroVec, state.heading)

		// push vector to achieve desired speed & dir
		// following code to adjust 2D velocity to desired amount is patterned on Quake: 
		// https://github.com/id-Software/Quake-III-Arena/blob/master/code/game/bg_pmove.c#L275
		vec3.subtract(push, m, body.velocity)
		push[1] = 0
		var pushLen = vec3.length(push)
		vec3.normalize(push, push)

		if (pushLen > 0) {
			// pushing force vector
			var canPush = state.moveForce
			if (!onGround) canPush *= state.airMoveMult

			// apply final force
			var pushAmt = state.responsiveness * pushLen
			if (canPush > pushAmt) canPush = pushAmt

			vec3.scale(push, push, canPush)
			body.applyForce(push)
		}

		// different friction when not moving
		// idea from Sonic: http://info.sonicretro.org/SPG:Running
		body.friction = state.runningFriction
	} else {
		body.friction = state.standingFriction
	}

	var pos = body.getPosition()
	if (pos[0] <= 0.2) {
		body.setPosition([0.2, pos[1], pos[2]])
		body.velocity[0] = 0
	}
	if (pos[0] >= noa.worldSize - 1 - 0.8) {
		body.setPosition([noa.worldSize - 1 - 0.8, pos[1], pos[2]])
		body.velocity[0] = 0
	}
	if ((pos = body.getPosition())[2] <= 0.2) {
		body.setPosition([pos[0], pos[1], 0.2])
		body.velocity[2] = 0
	}
	if (pos[2] >= noa.worldSize - 1 - 0.8) {
		body.setPosition([pos[0], pos[1], noa.worldSize - 1 - 0.8])
		body.velocity[2] = 0
	}
	if (pos[1] <= 0) {
		body.setPosition([pos[0], 0, pos[2]])
		body.velocity[1] = 0
	}



}



