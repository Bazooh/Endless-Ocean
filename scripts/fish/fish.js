import * as THREE from 'three';
import {MTLLoader} from '../../build/loaders/MTLLoader.js';
import {OBJLoader} from '../../build/loaders/OBJLoader.js';
import {GetAllFish, GetChunkKeyAtPosition, GetFishInNearbyChunks, EnterChunk} from './fishSpawner.js';
import {noise_param} from '../marching_cubes/noise.js'
import { chunk_size } from '../chunk.js';

const maxDistance = 30;

const baseSeparationMultiplier = 1.5;
const baseAlignmentMultiplier = 1;
const baseCohesionMultiplier = 0.25;

const maxSteering = 0.5;

const maxYMovement = 0.2;


export class BoidData {
    constructor(speed = 5, steering = 3, neighbourRange = 4, randomTurnOffset = 0.1, separationMultiplier = 1, alignmentMultiplier = 1, cohesionMultiplier = 1) {
        this.speed = speed;
        this.steering = steering;
        this.neighbourRange = neighbourRange;
        this.randomTurnOffset = randomTurnOffset;
        this.separationMultiplier = separationMultiplier;
        this.alignmentMultiplier = alignmentMultiplier;
        this.cohesionMultiplier = cohesionMultiplier;
    }

}

export class FishData {
    constructor(name, model, material, data) {
        this.name = name,
        this.model = model;
        this.material = material;

        this.boidData = data;
    }

    setColour(colour, materialIndex, randomOffset = 0.3) {
        this.changeColour = true;
        this.colour = colour;
        this.materialIndex = materialIndex;
        this.randomColourOffset = randomOffset;
    }
}



export class Fish {
   
    constructor(fishdata, starting_position, starting_direction, centre, id, isBoss = false) {
        this.position = starting_position;
        this.direction = starting_direction;

        this.centre = centre;
        this.id = id;

        this.data = fishdata;
        this.isBoss = isBoss;

        this.loadModel();

        this.position = starting_position;
        this.direction = starting_direction;
        this.turnTimer = 0;

        this.enabled = true;

        this.currentChunk = GetChunkKeyAtPosition(this.position.x, this.position.z);
        EnterChunk(this, null, this.currentChunk);
 
    }

    loadModel() {

        this.model = new THREE.Object3D();

        let mtlLoader = new MTLLoader();
        mtlLoader.setPath("../../models/fishmaterials/");
        mtlLoader.load(this.data.material, (materials) => this.onMaterialLoaded(materials));

        this.offsetScale(0.25);
    }

    onMaterialLoaded(materials) {

        materials.preload();
        let objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("../../models/fishmodels/");
        objLoader.load(this.data.model, (object) => this.onModelLoaded(object));
    }

    onModelLoaded(object) {

        if (this.data.changeColour) object.traverse((object) => this.setColour(object));

        this.model.add(object);

        scene.add(this.model);
    }

    setColour(object) {
        if (object.isMesh) {
            object.material[0].side = THREE.DoubleSide;
            var colour = this.data.colour;
            object.material[this.data.materialIndex].color.set(new THREE.Color(
                this.offsetColourValue(colour.r,this.data.randomColourOffset), 
                this.offsetColourValue(colour.g, this.data.randomColourOffset), 
                this.offsetColourValue(colour.b, this.data.randomColourOffset)));
        }
    }

    offsetColourValue(value, amount) {
        value += Math.random() * amount * 2 - amount;
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        return value;
    }

    offsetScale(amount) {
        this.model.scale.multiplyScalar(1 + (Math.random() * amount * 2 - amount));
    }

    getRandomTurnOffset() {
        var turn =  Math.random() * this.data.boidData.randomTurnOffset * 2 - this.data.boidData.randomTurnOffset;
        return turn;
    }


    step(delta) {

        if (!this.enabled) return;

        var newPos = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
        newPos.add(this.direction.clone().multiplyScalar(this.data.boidData.speed * delta));

        var steer = this.direction.clone();

        steer.add(new THREE.Vector3(this.getRandomTurnOffset(), this.getRandomTurnOffset(), this.getRandomTurnOffset()));

        var allNeighbours = [];
        var sameFishNeighbours = [];
        this.findNeighbours(allNeighbours, sameFishNeighbours);

        if (allNeighbours.length > 0) {
            steer.add(this.calculateSeparation(allNeighbours));
        }
        if (sameFishNeighbours.length > 0) {
            steer.add(this.calculateAlignment(sameFishNeighbours));
            steer.add(this.calculateCohesion(sameFishNeighbours));
        }

        steer.y = Math.min(steer.y, maxYMovement);
        steer.y = Math.max(steer.y, -maxYMovement);

        var x = newPos.x - this.centre.x;
        var z = newPos.z - this.centre.z;
        
        if (Math.sqrt(x*x + z*z) >= maxDistance) {
            steer.sub(newPos.clone().sub(this.centre));
        }


        if (newPos.y > noise_param.surface_level * chunk_size.y - 1) {
            newPos.y = noise_param.surface_level * chunk_size.y - 1;
            steer.y -= 1;
        }

        steer.normalize();

        let newDirection = this.direction.clone();
        newDirection.lerp(steer, this.data.boidData.steering * delta);
        newDirection.normalize();
        this.direction = newDirection;

        this.position = newPos;


        let newChunk = GetChunkKeyAtPosition(this.position.x, this.position.z);
        if (this.currentChunk != newChunk) {
            EnterChunk(this, this.currentChunk, newChunk);
            this.currentChunk = newChunk;
        }
        

    }

    findNeighbours(allNeighbours, sameFishNeighbours) {
    
        var allFish = GetFishInNearbyChunks(this.currentChunk);
        //var allFish = GetAllFish();

       for (let fish of allFish) {
            if (this.id == fish.id) continue;
            let distance = this.position.distanceTo(fish.position);
            if (distance < this.data.boidData.neighbourRange) {
                allNeighbours.push({fish: fish, distance: distance});
                if (this.data.name == fish.data.name) sameFishNeighbours.push({fish: fish, distance: distance});
            }
       }
    }

    calculateSeparation(neighbours) {

        var steer = new THREE.Vector3();

        for (let neighbour of neighbours) {
            let offset = this.position.clone().sub(neighbour.fish.position);
            offset.normalize();
            offset.divideScalar(neighbour.distance);
            steer.add(offset);
        }

        steer.divideScalar(neighbours.length);

        steer.multiplyScalar(baseSeparationMultiplier * this.data.boidData.separationMultiplier);

        steer.clampLength(0, maxSteering);
        
        return steer;
    }

    calculateAlignment(neighbours) {

        var steer = new THREE.Vector3();

        for (let neighbour of neighbours) {
            steer.add(neighbour.fish.direction);
        }

        steer.divideScalar(neighbours.length);

        steer.multiplyScalar(baseAlignmentMultiplier * this.data.boidData.alignmentMultiplier);

        steer.clampLength(0, maxSteering);
        
        return steer;
    }

    calculateCohesion(neighbours) {
        var steer = new THREE.Vector3();

        var averagePos = new THREE.Vector3();

        for (let neighbour of neighbours) {
            averagePos.add(neighbour.fish.position);
        }

        averagePos.divideScalar(neighbours.length);

        steer = averagePos.sub(this.position);
        steer.multiplyScalar(baseCohesionMultiplier * this.data.boidData.cohesionMultiplier);

        steer.clampLength(0, maxSteering);
        

        return steer;
    }

    get direction() {return this._direction;}

    set direction(new_direction) {
        this._direction = new_direction;

        if (this.model != null) {
            this.model.rotation.y = Math.atan2(this.direction.x, this.direction.z);
        }
    }

    get position() {return this._position};

    set position(new_position) {
        this._position = new_position;

        if (this.model != null)
            this.model.position.copy(new_position);
    }

}