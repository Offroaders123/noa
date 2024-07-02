
import vec3 from 'gl-vec3'


/**
 * @param {import('../index.js').Engine} noa
 */
export default function (noa) {
    return {

        name: 'mesh',

        order: 100,

        state: {
            mesh: null,
            offset: null
        },


        /**
         * @param {number} eid
         * @param state
         * @returns {void}
         */
        onAdd: function (eid, state) {
            // implicitly assume there's already a position component
            var posDat = noa.ents.getPositionData(eid)
            if (state.mesh) {
                noa.rendering.addMeshToScene(state.mesh, false, posDat.position)
            } else {
                throw new Error('Mesh component added without a mesh - probably a bug!')
            }
            if (!state.offset) state.offset = vec3.create()

            // set mesh to correct position
            var rpos = posDat._renderPosition
            state.mesh.position.copyFromFloats(
                rpos[0] + state.offset[0],
                rpos[1] + state.offset[1],
                rpos[2] + state.offset[2])
        },


        /**
         * @param eid
         * @param state
         * @returns {void}
         */
        onRemove: function (eid, state) {
            state.mesh.dispose()
        },



        /**
         * @param dt
         * @param states
         * @returns {void}
         */
        renderSystem: function (dt, states) {
            // before render move each mesh to its render position, 
            // set by the physics engine or driving logic
            for (var i = 0; i < states.length; i++) {
                var state = states[i]
                var id = state.__id

                var rpos = noa.ents.getPositionData(id)._renderPosition
                state.mesh.position.copyFromFloats(
                    rpos[0] + state.offset[0],
                    rpos[1] + state.offset[1],
                    rpos[2] + state.offset[2])
            }
        }


    }
}
