import * as THREE from 'three';
import { createNoise3D } from 'noise';
import { createMarchingCubes } from "./marching_cubes.js";
import { scene } from './scene.js';


const chunk_size = new THREE.Vector3(100, 100, 100);
const n_vertices = new THREE.Vector3(16, 16, 16);
const chunks = {};

const noise = createNoise();


function createNoise(frequency = 0.8) {
    const noise = createNoise3D();
    return (x, y, z) => noise(x * frequency, y * frequency, z * frequency);
}


export function loadChunk(x, y, z) {
    const id = `${x},${y},${z}`;

    if (chunks[id]) {
        return;
    }

    const chunk = createMarchingCubes(
        (_x, _y, _z) => noise(_x/n_vertices.x + x, _y/n_vertices.y + y, _z/n_vertices.z + z),
        chunk_size,
        n_vertices
    );
    chunk.position.set(x * chunk_size.x, y * chunk_size.y, z * chunk_size.z);
    chunks[id] = chunk;
    scene.add(chunk);

    return chunk;
}


export function unloadChunk(x, y, z) {
    const id = `${x},${y},${z}`;

    if (chunks[id]) {
        chunks[id].geometry.dispose();
        chunks[id].material.dispose();
        scene.remove(chunks[id]);
        delete chunks[id];
    }
}


export function getChunk(x, y, z) {
    return chunks[`${x},${y},${z}`];
}


export function loadChunks(position, size) {
    for (let x = position.x; x < position.x + size.x; x++) {
        for (let y = position.y; y < position.y + size.y; y++) {
            for (let z = position.z; z < position.z + size.z; z++) {
                loadChunk(x, y, z);
            }
        }
    }
}