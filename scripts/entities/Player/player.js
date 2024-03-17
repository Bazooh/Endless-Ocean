import * as THREE from 'three';
import { camera, scene } from '../../scene.js';
import { Entity } from '../entity.js';
import {Input} from './input.js';
import { FollowCamera } from './followCamera.js';
import { canMoveTo } from '../../chunk.js';


const up = new THREE.Vector3(0,1,0);
const forward = new THREE.Vector3(0,0,-1);
const zero = new THREE.Vector3(0,0,0);

export const player_param = {
    collisionTest: false,
    horizontalAcceleration: 20,
    verticalAcceleration: 20,
    friction: 2,
    rotationSpeed: 1,
};

export function updatePlayerGUI(gui, player) {
    const folder = gui.addFolder('Player');
   
    folder.add(player_param, 'horizontalAcceleration', 1, 50, 1).name("H Acceleration");
    folder.add(player_param, 'verticalAcceleration', 1, 50, 1).name("V Acceleration");
    folder.add(player_param, 'friction', 0, 5, 0.1).name("Friction");
    folder.add(player_param, 'rotationSpeed', 0.5, 5, 0.5).name("Rotation Speed");
    folder.add(player_param, 'collisionTest').name("Collision Test").onChange(() => {player.cube.material.transparent = !player_param.collisionTest});
}


/*
TODO
- Mouse Control Camera?
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

        this.followCamera = new FollowCamera(camera, this);

        this.makeTestCube();
    }

    get position() {
        return super.position;
    }

    set position(new_position) {
        super.position = new_position;
        // * TODO : update the light
    }

    updateCameraPosition() {
        
        var offset = cameraOffset.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, this.direction))

        var cameraPosition = this.position.clone().add(offset);
    
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        camera.lookAt(super.position.x, super.position.y, super.position.z);
    }

    makeTestCube() {
        this.cube = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), new THREE.MeshBasicMaterial({color: 0xffaaaa}));
        this.cube.position.set(0, 0, -10);
        scene.add(this.cube);
        this.cube.material.transparent = true;
        this.cube.material.opacity = 0;

    }

    checkInWall(position) {
        return player_param.collisionTest && this.inWall(position);
    }

    inWall(position) {
        return (position.z > -13 && position.z < -7 && position.x > -3 && position.x < 3 && position.y > -3 && position.y < 3);
    }

    update(deltaTime) {

        //Acceleration based on input
        this.acceleration = this.direction.clone().multiplyScalar(((this.input.forward ? 1 : 0) + (this.input.backward ? -1 : 0)) * player_param.horizontalAcceleration);
        this.acceleration.add(up.clone().multiplyScalar(((this.input.up ? 1 : 0) + (this.input.down ? -1 : 0)) * player_param.verticalAcceleration));

        //Friction (Water Resistance)
        this.acceleration.add(this.velocity.clone().multiplyScalar(-1 * player_param.friction))

        //Velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        var targetPosition = this.position.clone().add(this.velocity.clone().multiplyScalar(deltaTime));

        //Position
        if (this.checkInWall(targetPosition)) {
            this.velocity.copy(zero);
        }
        else this.position = targetPosition;
        
        //Rotations
        this.direction.applyAxisAngle(up, ((this.input.left ? 1 : 0) + (this.input.right ? -1 : 0)) * player_param.rotationSpeed * deltaTime);
        this.model.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(forward, this.direction));

        //Camera
        this.followCamera.update(deltaTime);
        
    }
}