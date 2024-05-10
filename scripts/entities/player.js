import * as THREE from 'three';
import { camera } from '../scene.js';
import { Entity } from './entity.js';
import {Input} from './input.js';
import { FollowCamera } from './followCamera.js';
import { canMoveTo, updateChunksShaderUniforms, getChunkLineByWorldPos, getChunkLinePosByWorldPos, createChunksFromTopToBottom, chunk_lines } from '../chunk.js';
import { getLightDirection } from '../light.js';
import {FBXLoader} from 'FBXLoader';


const up = new THREE.Vector3(0, 1, 0);
const zero = new THREE.Vector3(0, 0, 0);

const maxHeight = -0.5;
var modelOffset = new THREE.Vector3(0, -1, 0);

const collisionOffsets = [
    new THREE.Vector3(0.4, 0.6, -1.5), new THREE.Vector3(0.4, -0.25, -1.5), new THREE.Vector3(-0.4, 0.6, -1.5), new THREE.Vector3(-0.4, -0.25, -1.5),
    new THREE.Vector3(0.5, 0.7, 1.5), new THREE.Vector3(0.5, -0.25, 1.5), new THREE.Vector3(-0.5, 0.7, 1.5), new THREE.Vector3(-0.5, -0.25, 1.5),
    new THREE.Vector3(1, 0.6, 0), new THREE.Vector3(1, -0.3, 0), new THREE.Vector3(-1, 0.7, 0), new THREE.Vector3(-1, -0.3, 0),
];


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


export class Player extends Entity {

    constructor(starting_position, starting_direction, view_distance) {
        super(starting_position, starting_direction, {view_distance: view_distance});
    }

    onModelLoaded(object) {

        const texture = new THREE.TextureLoader().load('./../../models/submarine-low-poly/textures/Submarine__BaseColor.png'); 
        const normal = new THREE.TextureLoader().load('./../../models/submarine-low-poly/textures/Submarine__Normal.png'); 
        const metallic = new THREE.TextureLoader().load('./../../models/submarine-low-poly/textures/Submarine__Metallic.png'); 
        const roughness = new THREE.TextureLoader().load('./../../models/submarine-low-poly/textures/Submarine__Roughness.png'); 
        const ao = new THREE.TextureLoader().load('./../../models/submarine-low-poly/textures/Submarine__AO.png'); 

        const material = new THREE.MeshStandardMaterial( { map:texture, normalMap: normal, aoMap: ao, roughnessMap: roughness } );

        object.rotation.y = Math.PI;
        object.position.add(modelOffset);
        
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.material =  material;
            }

        } );

        this.object = object;

        this.model.add(object);

        this.modelLoaded = true;

        //Test light
        var light = new THREE.AmbientLight( 0xffffff );
        light.position.set( 0, 1, 0 ).normalize();
        scene.add(light);
        
    }


    loadModel() {

        this.model = new THREE.Object3D();
        const fbxLoader = new FBXLoader()
        fbxLoader.load('./../../models/submarine-low-poly/source/Submarine Low-poly.fbx', 
        (object) => this.onModelLoaded(object),
        (xhr) => {},
        (error) => {console.log(error)});

        this.input = new Input();
         this.followCamera = new FollowCamera(camera, this);
    }

    setTransparent(transparent) {
        if (!this.modelLoaded) return;

        this.object.visible = !transparent;

    }


    get position() {
        return super.position;
    }

    set position(new_position) {
        const old_chunk_line = this.current_chunk_line;
        super.position = new_position;
        const new_chunk_line = this.current_chunk_line;

        if (old_chunk_line !== new_chunk_line || new_chunk_line === undefined) {
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


    get current_chunk_line_coords() {
        return getChunkLinePosByWorldPos(this.position.x, this.position.z);
    }


    loadSurroundingChunks() {
        createChunksFromTopToBottom(
            new THREE.Vector2(...this.current_chunk_line_coords),
            new THREE.Vector2(this.view_distance, this.view_distance)
        )
    }


    unloadFarChunks() {
        const [x, z] = this.current_chunk_line_coords;

        Object.values(chunk_lines).forEach((chunk_line) => {
            if (Math.abs(chunk_line.x - x) > this.view_distance || Math.abs(chunk_line.z - z) > this.view_distance) {
                chunk_line.unload();
            }
        });
    }


    updateLightDirection() {
        if (this.model === undefined) return;
        
        updateChunksShaderUniforms({'uLightDir': getLightDirection(this.direction)});
    }

    checkInWall(position, rotation) {

        for (var i = 0; i < collisionOffsets.length; i++) {

            //get collision offset
            var pos = collisionOffsets[i].clone();

            //set rotation
            pos.applyAxisAngle(up, rotation);

            //set position
            pos.add(position);

            //update test cube to show point
            if (this.showCollisionPoints) this.collisionObjects[i].position.set(...pos);

            //check if point is in wall
            if (this.inWall(pos)) return true;
        }

        return false;
    }

    inWall(position) {
        return !canMoveTo(...position);
    }


    _getAxis(positive, negative) {
        return (positive ? 1 : 0) + (negative ? -1 : 0);
    }


    update(delta_time) {

        if (!this.modelLoaded) return false;

        //Acceleration based on input
        this.acceleration = this.direction.clone().multiplyScalar(this._getAxis(this.input.forward, this.input.backward) * player_param.horizontalAcceleration);
        this.acceleration.add(up.clone().multiplyScalar(this._getAxis(this.input.up, this.input.down) * player_param.verticalAcceleration));

        //Friction (Water Resistance)
        this.acceleration.add(this.velocity.clone().multiplyScalar(-player_param.friction))

        //Velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(delta_time));

        var targetPosition = this.position.clone().add(this.velocity.clone().multiplyScalar(delta_time));
        if (targetPosition.y > maxHeight) targetPosition.y = maxHeight;

        var targetRotation = this._getAxis(this.input.left, this.input.right) * player_param.rotationSpeed * delta_time;

        //Collisions
        if (this.checkInWall(targetPosition, targetRotation + this.yRotation)) {
            this.velocity.copy(zero);
        }
        else {
            this.position = targetPosition;
            this.direction = this.direction.applyAxisAngle(up, targetRotation);
        }
        
        //Camera
        this.followCamera.update(delta_time);
        
    }
}