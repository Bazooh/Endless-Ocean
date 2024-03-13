import * as THREE from 'three';
import { camera } from '../scene.js';
import { Entity } from './entity.js';


export class Player extends Entity {
    get position() {
        return super.position;
    }

    set position(new_position) {
        super.position = new_position;
        camera.position.set(new_position.x, new_position.y, new_position.z);
        // * TODO : update the light
    }

    update(deltaTime) {
        // console.log('Player update, deltaTime:', deltaTime);
    }
}