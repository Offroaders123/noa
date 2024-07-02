
import vec3 from 'gl-vec3'


/*
 * Indicates that an entity should be moved to another entity's position each tick,
 * possibly by a fixed offset, and the same for renderPositions each render
 */

/**
 * @param {import('../index.js').Engine} noa
 */
export default function (noa) {

    return {

        name: 'followsEntity',

        order: 50,

        state: {
            entity: 0 | 0,
            offset: null,
            onTargetMissing: null,
        },

        /**
         * @param eid
         * @param state
         * @returns {void}
         */
        onAdd: function (eid, state) {
            var off = vec3.create()
            state.offset = (state.offset) ? vec3.copy(off, state.offset) : off
            updatePosition(state)
            updateRenderPosition(state)
        },

        onRemove: null,


        /**
         * @param dt
         * @param states
         * @returns {void}
         */
        // on tick, copy over regular positions
        system: function followEntity(dt, states) {
            for (var i = 0; i < states.length; i++) {
                updatePosition(states[i])
            }
        },


        /**
         * @param dt
         * @param states
         * @returns {void}
         */
        // on render, copy over render positions
        renderSystem: function followEntityMesh(dt, states) {
            for (var i = 0; i < states.length; i++) {
                updateRenderPosition(states[i])
            }
        }
    }



    /**
     * @param state
     * @returns {void}
     */
    function updatePosition(state) {
        var id = state.__id
        var self = noa.ents.getPositionData(id)
        var other = noa.ents.getPositionData(state.entity)
        if (!other) {
            if (state.onTargetMissing) state.onTargetMissing(id)
            noa.ents.removeComponent(id, noa.ents.names.followsEntity)
        } else {
            vec3.add(self._localPosition, other._localPosition, state.offset)
        }
    }

    /**
     * @param state
     * @returns {void}
     */
    function updateRenderPosition(state) {
        var id = state.__id
        var self = noa.ents.getPositionData(id)
        var other = noa.ents.getPositionData(state.entity)
        if (other) {
            vec3.add(self._renderPosition, other._renderPosition, state.offset)
        }
    }

}
