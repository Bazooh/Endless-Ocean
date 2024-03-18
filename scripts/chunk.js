import * as THREE from 'three';
import { createNoise } from './noise.js';
import { createMarchingCubes } from "./marching_cubes.js";
import { scene } from './scene.js';


const chunk_size = new THREE.Vector3(10, 10, 10);
const n_vertices = new THREE.Vector3(16, 16, 16);
const chunks = {};

const noise = createNoise();


export function unloadAllChunks() {
    Object.values(chunks).forEach((chunk) => {
        chunk.unload();
    });
}


function getChunk(x, y, z) {
    return chunks[`${x},${y},${z}`];
}


export function createChunk(x, y, z) {
    if (getChunk(x, y, z) === undefined) {
        new chunk(x, y, z);
    }
}


// Create a cube of chunks
export function createChunks(position, size) {
    for (let x = position.x; x < position.x + size.x; x++) {
        for (let y = position.y; y < position.y + size.y; y++) {
            for (let z = position.z; z < position.z + size.z; z++) {
                createChunk(x, y, z);
            }
        }
    }
}


export function forceChunksUpdate() {
    Object.values(chunks).forEach((chunk) => {
        chunk.unload();
        chunk.load();
    });
}


export function canMoveTo(x, y, z) {
    return noise(x / chunk_size.x, y / chunk_size.y, z / chunk_size.z) < 0;
}


export function updateChunksShaderUniforms(uniforms) {
    Object.values(chunks).forEach((chunk) => {
        chunk.updateShaderUniforms(uniforms);
    });
}


class chunk {

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.load();
    }


    get id() {
        return `${this.x},${this.y},${this.z}`;
    }

    get geometry() {
        return this.mesh.geometry;
    }

    get material() {
        return this.mesh.material;
    }

    get position() {
        return this.mesh.position;
    }


    isLoaded() {
        return chunks[this.id] !== undefined;
    }


    load() {
        if (this.isLoaded()) {
            return;
        }

        this.mesh = createMarchingCubes(
            (_x, _y, _z) => noise(_x/n_vertices.x + this.x, _y/n_vertices.y + this.y, _z/n_vertices.z + this.z),
            chunk_size,
            n_vertices
        );
        this.position.set(this.x * chunk_size.x, this.y * chunk_size.y, this.z * chunk_size.z);
        chunks[this.id] = this;
        scene.add(this.mesh);
    }


    unload() {
        if (!this.isLoaded()) {
            return;
        }

        this.geometry.dispose();
        this.material.dispose();
        scene.remove(this.mesh);
        delete chunks[this.id];
    }


    updateShaderUniforms(uniforms) {
        Object.keys(uniforms).forEach((key) => {
            if (this.material.uniforms[key] === undefined) {
                return;
            }

            this.material.uniforms[key].value = uniforms[key];
        });
    }
}