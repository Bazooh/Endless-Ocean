import * as THREE from 'three';
import { camera, scene } from '../scene.js';
import { Entity } from './entity.js';
import {Input} from './input.js';


const direction = new THREE.Vector3(0,0,-1);
const cameraOffset = new THREE.Vector3(0,5,5);

const up = new THREE.Vector3(0,1,0);
const down = new THREE.Vector3(0,-1,0);
const forward = new THREE.Vector3(0,0,-1);

export const player_param = {
    updateCamera: true,
    moveSpeed: 10,
    rotationSpeed: 2,
};

export function updatePlayerGUI(gui, controls, player) {
    const folder = gui.addFolder('Player');
    folder.add(player_param, 'updateCamera', 0.1, 2, 0.1).name("Player Camera").onChange(() => {controls.target.set(player.position.x, player.position.y, player.position.z); controls.update();});
    folder.add(player_param, 'moveSpeed', 1, 50, 1).name("Move Speed");
    folder.add(player_param, 'rotationSpeed', 1, 10, 1).name("Rotation Speed");
}


/*
TODO
- Toggle back to orbit controls
- Player Model
- Acceleration / Inertia
- Collisions
- Lighting
*/

export class Player extends Entity {

    loadModel() {
        this.model = new THREE.Object3D();
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), new THREE.MeshBasicMaterial({color: 0xaaaaff}));
        this.mesh.rotation.set(Math.PI / 2, 0, 0);
        
        this.model.add(this.mesh);
    
        this.input = new Input();
    }

    get position() {
        return super.position;
    }

    set position(new_position) {
        super.position = new_position;
        if (player_param.updateCamera) this.updateCameraPosition();
        // * TODO : update the light
    }

    updateCameraPosition() {
        var offset = cameraOffset.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, direction))

        var cameraPosition = this.position.clone().add(offset);
    
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        camera.lookAt(super.position.x, super.position.y, super.position.z);

    }

    update(deltaTime) {

        var targetPosition = new THREE.Vector3(this.position.x, this.position.y, this.position.z);

        if (this.input.forward) {
            targetPosition.add(direction.clone().multiplyScalar(player_param.moveSpeed * deltaTime));
        }

        if (this.input.backward) {
            targetPosition.add(direction.clone().multiplyScalar(-player_param.moveSpeed * deltaTime));
        }

        if (this.input.up) {
            targetPosition.add(up.clone().multiplyScalar(player_param.moveSpeed * deltaTime));
        }
        
        if (this.input.down) {
            targetPosition.add(down.clone().multiplyScalar(player_param.moveSpeed * deltaTime));
        }

        if (this.input.left) {
            direction.applyAxisAngle(up, player_param.rotationSpeed * deltaTime);
            this.model.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(forward, direction));
        }

        if (this.input.right) {
            direction.applyAxisAngle(up, -player_param.rotationSpeed * deltaTime);
            this.model.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(forward, direction));
        }

        this.position = targetPosition;
    }
}