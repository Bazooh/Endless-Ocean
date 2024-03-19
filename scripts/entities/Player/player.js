import * as THREE from 'three';
import { camera, scene } from '../../scene.js';
import { Entity, forward } from '../entity.js';
import {Input} from './input.js';
import { FollowCamera } from './followCamera.js';
import { canMoveTo, updateChunksShaderUniforms, getChunkLineByWorldPos, createChunksFromTopToBottom, chunk_lines } from '../../chunk.js';
import { light_param } from '../../light.js';


const up = new THREE.Vector3(0, 1, 0);
const zero = new THREE.Vector3(0, 0, 0);

export const player_param = {
    enableCollisions: true,
    horizontalAcceleration: 20,
    verticalAcceleration: 20,
    friction: 2,
    rotationSpeed: 1,
};

export function updatePlayerGUI(gui, player) {
    const folder = gui.addFolder('Player');
   
    folder.add(player_param, 'enableCollisions').name("Enable Collisions");
    folder.add(player_param, 'horizontalAcceleration', 1, 50, 1).name("H Acceleration");
    folder.add(player_param, 'verticalAcceleration', 1, 50, 1).name("V Acceleration");
    folder.add(player_param, 'friction', 0, 5, 0.1).name("Friction");
    folder.add(player_param, 'rotationSpeed', 0.5, 5, 0.5).name("Rotation Speed");
    
}


/*
TODO
- Mouse Control Camera?
- Collisions
- Player Model
- Lighting
*/

export class Player extends Entity {

    constructor(starting_position, starting_direction, view_distance) {
        super(starting_position, starting_direction);
        this.view_distance = view_distance;
    }


    loadModel() {
        this.model = new THREE.Object3D();
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), new THREE.MeshBasicMaterial({color: 0xaaaaff}));
        this.mesh.rotation.set(Math.PI / 2, 0, 0);

        this.model.add(this.mesh);
    
        this.input = new Input();

        this.followCamera = new FollowCamera(camera, this);
    }


    get position() {
        return super.position;
    }

    set position(new_position) {
        const old_chunk_line = this.current_chunk_line;
        super.position = new_position;
        const new_chunk_line = this.current_chunk_line;

        if (old_chunk_line !== new_chunk_line) {
            this.loadSurroundingChunks();
            this.unloadFarChunks();
        }

        updateChunksShaderUniforms({'uLightPos': new_position});
    }


    get direction() {
        return super.direction;
    }

    set direction(new_direction) {
        super.direction = new_direction;
        this.updateLightDirection();
    }


    get current_chunk_line() {
        if (this.position === undefined) return undefined;

        return getChunkLineByWorldPos(this.position.x, this.position.z);
    }


    loadSurroundingChunks() {
        const chunk_line = this.current_chunk_line;
        
        createChunksFromTopToBottom(
            new THREE.Vector2(chunk_line.x, chunk_line.z),
            new THREE.Vector2(this.view_distance, this.view_distance)
        )
    }


    unloadFarChunks() {
        const current_chunk_line = this.current_chunk_line;

        Object.values(chunk_lines).forEach((chunk_line) => {
            if (Math.abs(chunk_line.x - current_chunk_line.x) > this.view_distance || Math.abs(chunk_line.z - current_chunk_line.z) > this.view_distance) {
                chunk_line.unload();
            }
        });
    }


    updateLightDirection() {
        if (this.model === undefined) return;

        const theta = light_param.direction_theta;
        const phi = light_param.direction_phi - Math.acos(forward.dot(this.direction))*Math.sign(this.direction.x);
    
        const direction = new THREE.Vector3(
            Math.sin(phi) * Math.sin(theta),
            Math.cos(theta),
            Math.cos(phi) * Math.sin(theta)
        );
        updateChunksShaderUniforms({'uLightDir': direction});
    }


    checkInWall(position) {
        return player_param.enableCollisions && this.inWall(position);
    }


    inWall(position) {
        return !canMoveTo(...position);
    }


    _getAxis(positive, negative) {
        return (positive ? 1 : 0) + (negative ? -1 : 0);
    }


    update(delta_time) {

        //Acceleration based on input
        this.acceleration = this.direction.clone().multiplyScalar(this._getAxis(this.input.forward, this.input.backward) * player_param.horizontalAcceleration);
        this.acceleration.add(up.clone().multiplyScalar(this._getAxis(this.input.up, this.input.down) * player_param.verticalAcceleration));

        //Friction (Water Resistance)
        this.acceleration.add(this.velocity.clone().multiplyScalar(-player_param.friction))

        //Velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(delta_time));

        var targetPosition = this.position.clone().add(this.velocity.clone().multiplyScalar(delta_time));

        //Position
        if (this.checkInWall(targetPosition)) {
            this.velocity.copy(zero);
        }
        else this.position = targetPosition;
        
        //Rotations
        this.direction = this.direction.applyAxisAngle(up, this._getAxis(this.input.left, this.input.right) * player_param.rotationSpeed * delta_time);

        //Camera
        this.followCamera.update(delta_time);
        
    }
}