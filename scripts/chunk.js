import * as THREE from 'three';
import { createNoise } from './noise.js';
import { createMarchingCubes } from "./marching_cubes.js";
import { scene } from './scene.js';


const chunk_size = new THREE.Vector3(10, 10, 10);
const n_vertices = new THREE.Vector3(16, 16, 16);
const chunks = {};

const noise = createNoise();


function getCoordsFromId(id) {
    return id.split(',').map((val) => parseInt(val));
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


export function unloadAllChunks() {
    Object.keys(chunks).forEach((id) => {
        unloadChunk(...getCoordsFromId(id));
    });
}


export function getChunk(x, y, z) {
    return chunks[`${x},${y},${z}`];
}


// Load a cube of chunks
export function loadChunks(position, size) {
    for (let x = position.x; x < position.x + size.x; x++) {
        for (let y = position.y; y < position.y + size.y; y++) {
            for (let z = position.z; z < position.z + size.z; z++) {
                loadChunk(x, y, z);
            }
        }
    }
}


export function forceChunksUpdate() {
    Object.keys(chunks).forEach((id) => {
        const [x, y, z] = getCoordsFromId(id);
        unloadChunk(x, y, z);
        loadChunk(x, y, z);
    });
}


export function canMoveTo(x, y, z) {
    return noise(x, y, z) < 0;
}