import * as THREE from 'three';
import {Fish, FishData} from './fish.js';
import {noise_param} from '../marching_cubes/noise.js'
import { chunk_size } from '../chunk.js';

const centre = new THREE.Vector3(0,0,0);

const spawnDistance = 20;

const fishArray = [];
var fishId = 0;

const chunkSize = 4;
const fishChunks = new Map();

var hasBoss = false;

export function GetAllFish() {return fishArray};

export function SpawnFish(fishData, count) {

    for (var i = 0; i < count; ++i) {
        var pos = GetSpawnPos();
        var dir = GetSpawnDir();
        var fish =  new Fish(fishData, pos, dir, centre, fishId, !hasBoss)
        fishId++;
        fishArray.push(fish);

        if (!hasBoss) hasBoss = true;
    }
}

export function Step(delta) {

    //Move Fish
    for (var i = 0; i < fishArray.length; ++i) {
        fishArray[i].step(delta);
    }
}


function GetSpawnPos() {
    return new THREE.Vector3(
        GetRandomOffset(spawnDistance), 
        Math.random() * (noise_param.surface_level * chunk_size.y - noise_param.floor_level * chunk_size.y) + noise_param.floor_level * chunk_size.y, 
        GetRandomOffset(spawnDistance));
}

function GetSpawnDir() {
    var dir = new THREE.Vector3(GetRandomOffset(1), GetRandomOffset(1), GetRandomOffset(1));
    dir.normalize();
    return dir;
}

function GetRandomOffset(max) {
    return Math.random() * max * 2 - max;
}

export function GetChunkKeyAtPosition(x, z) {
    var chunkKey = Math.floor(parseInt(x) / chunkSize).toString() + ',' +  Math.floor(parseInt(z) / chunkSize).toString();

    if (!fishChunks.has(chunkKey)) {
        fishChunks.set(chunkKey, []);
    }

    return chunkKey;
}

export function EnterChunk(fish, oldChunk, newChunk) {

    if (oldChunk != null) {
        var chunkFish = fishChunks.get(oldChunk);
        chunkFish.splice(chunkFish.indexOf(fish), 1);
    }

    fishChunks.get(newChunk).push(fish);

}

export function GetFishInNearbyChunks(currentChunk) {
    var fishArray = [];

    

    for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
            
            var chunkKey = currentChunk.split(',').map(Number);
            chunkKey[0] += x;
            chunkKey[1] += z;
            let chunk = chunkKey[0].toString() + ',' + chunkKey[1].toString();

            if (fishChunks.has(chunk)) {
                fishArray.push(...fishChunks.get(chunk));
            }
        }
    }

    return fishArray;
}

