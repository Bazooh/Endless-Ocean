import * as THREE from 'three'
import { chunk_size } from '../chunk.js'
import { noise_param } from '../marching_cubes/noise.js'
import { noiseValue, getNormal } from '../chunk.js'
import { OBJLoader } from '../../build/loaders/OBJLoader.js';

const maxCoral = 5

class CoralData {
    constructor(model, colour, scale) {
        this.model = model;
        this.colour = colour;
        this.scale = scale
    }
}

const coralList = [new CoralData("Coral0", new THREE.Color(0.01, 0.75, 0.01), 3), new CoralData("Coral1", new THREE.Color(0.75, 0.01, 0.01), 3), 
new CoralData("Coral2", new THREE.Color(0.5, 0.5, 0.3), 3), new CoralData("Coral3", new THREE.Color(0.9, 0.4, 0.2), 3)]

const ColourOffset = 0.3
const scaleOffset = 2.75


export function spawnCoral(chunk_x, chunk_z) {

    let all_coral = []

    const coralNumber = Math.floor(Math.random() * (maxCoral + 1))

    let randomCoral = coralList[Math.floor(Math.random() * coralList.length)]

    for (let i = 0; i < coralNumber; i++) {
        
        let randomX = (chunk_x + Math.random()) * chunk_size.x;
        let randomZ = (chunk_z + Math.random()) * chunk_size.z;

        all_coral.push( createModel(randomX, getSpawnY(randomX, randomZ), randomZ, randomCoral));
    }

    return all_coral;
}

function createModel(x, y, z, coralData) {

    let base = new THREE.Object3D();

    let objLoader = new OBJLoader();
    objLoader.setPath("../../models/environment/");
    objLoader.load(coralData.model + ".obj", (object) => onModelLoaded(object, base, coralData));

    base.position.x = x;
    base.position.y = y;
    base.position.z = z;

    let normal = getNormal(x, y, z)


    base.lookAt(normal.clone().add(new THREE.Vector3(x, y, z)))
    base.rotateX(Math.PI / 2)

    //base.translateOnAxis(normal, 0.1)

    scene.add( base );

    return base;
}

function onModelLoaded(object, base, coralData) {

    const material = new THREE.MeshStandardMaterial(); 
    material.color = new THREE.Color(offsetValue(coralData.colour.r, ColourOffset, 1), offsetValue(coralData.colour.g, ColourOffset, 1), offsetValue(coralData.colour.b, ColourOffset, 1))

    var scale = offsetValue(coralData.scale, scaleOffset );

    object.scale.set(scale, scale, scale)

    object.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.material =  material;
        }
    } );
    
    base.add(object);
}

function offsetValue(value, amount, max = 0) 
{
    value += (Math.random() * 2 - 1) * amount;
    if (value < 0.01) value = 0.01;
    if (max != 0 && value > max) value = max;
    return value;
}

function getSpawnY(spawn_x, spawn_z) {

    let topPos = noise_param.surface_level * chunk_size.y;
    let bottomPos = (noise_param.floor_level - 1) * chunk_size.y;
   
    let upper = topPos;
    let lower = bottomPos;
    let mid = (upper + lower) / 2;

    while (true) {
        
        let noise_value = noiseValue(spawn_x, mid, spawn_z)

        let isWater = noise_value < noise_param.threshold

        let dist = Math.abs(noise_value - noise_param.threshold)
        if (dist < 0.0001) return mid;
        if (Math.abs(lower - upper) < 0.0001) return lower;

        if (isWater) {
            upper = mid
        }
        else lower = mid

         mid = (upper + lower) / 2;

    }

    
}