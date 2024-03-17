import * as THREE from 'three';
import { camera, scene } from '../scene.js';
import { Entity } from './entity.js';
import {Input} from './input.js';


const cameraOffset = new THREE.Vector3(0,5,5);

const up = new THREE.Vector3(0,1,0);
const forward = new THREE.Vector3(0,0,-1);
const zero = new THREE.Vector3(0,0,0);

export const player_param = {
    updateCamera: true,
    horizontalAcceleration: 20,
    verticalAcceleration: 20,
    friction: 2,
    rotationSpeed: 1,
};

export function updatePlayerGUI(gui, controls, player) {
    const folder = gui.addFolder('Player');
    folder.add(player_param, 'updateCamera', 0.1, 2, 0.1).name("Player Camera").onChange(() => {controls.target.set(player.position.x, player.position.y, player.position.z); controls.update();});
    folder.add(player_param, 'horizontalAcceleration', 1, 50, 1).name("H Acceleration");
    folder.add(player_param, 'verticalAcceleration', 1, 50, 1).name("V Acceleration");
    folder.add(player_param, 'friction', 0, 5, 0.1).name("Friction");
    folder.add(player_param, 'rotationSpeed', 0.5, 5, 0.5).name("Rotation Speed");
}


/*
TODO
- Mouse Camera
- Collisions
- Player Model
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
        
        var offset = cameraOffset.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, this.direction))

        var cameraPosition = this.position.clone().add(offset);
    
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        camera.lookAt(super.position.x, super.position.y, super.position.z);

    }

    update(deltaTime) {

        

        this.acceleration = this.direction.clone().multiplyScalar(((this.input.forward ? 1 : 0) + (this.input.backward ? -1 : 0)) * player_param.horizontalAcceleration);
        this.acceleration.add(up.clone().multiplyScalar(((this.input.up ? 1 : 0) + (this.input.down ? -1 : 0)) * player_param.verticalAcceleration));

        this.acceleration.add(this.velocity.clone().multiplyScalar(-1 * player_param.friction))

        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        this.position = this.position.clone().add(this.velocity.clone().multiplyScalar(deltaTime));
        
        if (this.input.left) {
            this.direction.applyAxisAngle(up, player_param.rotationSpeed * deltaTime);
            this.model.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(forward, this.direction));
        }

        if (this.input.right) {
            this.direction.applyAxisAngle(up, -player_param.rotationSpeed * deltaTime);
            this.model.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(forward, this.direction));
        }
        
        
    }
}