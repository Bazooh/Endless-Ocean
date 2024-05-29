import * as THREE from 'three';
import { SpawnFish, DispawnAllFish, Step } from './fishSpawner.js';
import { FishData, BoidData, fishes_param } from './fish.js';


var current_time;
var prev_time;

const clownfishData = new BoidData(5, 3, 4, 0.1, 1, 1, 1);
const clownfish = new FishData("Clownfish", "Clownfish.obj", "Clownfish.mtl", clownfishData);
clownfish.setColour(new THREE.Color(1, 0.4, 0), 0, 0.3);

const bluetangData = new BoidData(3, 2, 4, 0.1, 1, 1, 1);
const bluetang = new FishData("Bluetang", "Dory.obj", "Dory.mtl", bluetangData);
bluetang.setColour(new THREE.Color(0.2, 0.2, 0.8), 0, 0.3)


export function Run() {
    SpawnFish(clownfish, fishes_param.clownfish_count);
    SpawnFish(bluetang, fishes_param.bluetang_count);

    current_time = performance.now();
    prev_time = current_time;
    requestAnimationFrame(updateLoop);
}


export function updateFish() {
    DispawnAllFish();
    SpawnFish(clownfish, fishes_param.clownfish_count);
    SpawnFish(bluetang, fishes_param.bluetang_count);
}


function updateLoop() {
    current_time = performance.now();
    var delta = (current_time - prev_time) / 1000;
    prev_time = current_time;

    Step(Math.min(delta, 0.1));

    requestAnimationFrame(updateLoop);
};

