import * as THREE from 'three';
import { camera } from '../scene.js';
import { Entity } from './entity.js';
import { updateChunksShaderUniforms } from '../chunk.js';


export class Player extends Entity {
    get position() {
        return super.position;
    }

    set position(new_position) {
        super.position = new_position;
        camera.position.set(new_position.x, new_position.y, new_position.z);
        updateChunksShaderUniforms({'uLightPos': new_position}); // Update light position
    }

    update(deltaTime) {
        // console.log('Player update, deltaTime:', deltaTime);
    }
}