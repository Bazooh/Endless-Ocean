import * as THREE from 'three';
import { createNoise } from './noise.js';
import { createMarchingCubes, getLocalNormal } from "./marching_cubes.js";
import { scene } from './scene.js';


const chunk_size = new THREE.Vector3(10, 10, 10);
const n_vertices = new THREE.Vector3(16, 16, 16);

export const surface_level = 0;
export const floor_level = -4;

export const chunk_lines = {};

const noise = createNoise();


export function unloadAllChunks() {
    Object.values(chunk_lines).forEach((chunkLine) => {
        chunkLine.unload();
    });
}


function getChunkLine(x, z) {
    return chunk_lines[`${x},${z}`];
}


export function getChunkLinePosByWorldPos(x, z) {
    return new THREE.Vector2(Math.floor(x / chunk_size.x), Math.floor(z / chunk_size.z));
}


export function getChunkLineByWorldPos(x, z) {
    return getChunkLine(...getChunkLinePosByWorldPos(x, z));
}


// Create a cube of chunks
export function createChunksFromTopToBottom(position, radius) {
    for (let x = position.x - radius.x; x <= position.x + radius.x; x++) {
        for (let z = position.y - radius.y; z <= position.y + radius.y; z++) {
            if (getChunkLine(x, z) !== undefined) {
                continue;
            }

            new verticalChunkLine(x, z);
        }
    }
}


export function forceChunksUpdate() {
    Object.values(chunk_lines).forEach((chunkLine) => {
        chunkLine.forceUpdate();
    });
}


export function canMoveTo(x, y, z) {
    return noise(x / chunk_size.x, y / chunk_size.y, z / chunk_size.z) < 0;
}


export function getNormal(x, y, z) {
    return getLocalNormal(x / chunk_size.x, y / chunk_size.y, z / chunk_size.z, noise);
}


export function updateChunksShaderUniforms(uniforms) {
    Object.values(chunk_lines).forEach((chunkLine) => {
        chunkLine.updateShaderUniforms(uniforms);
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
        return this.mesh !== undefined;
    }


    load() {
        if (this.isLoaded()) {
            return;
        }

        this.mesh = createMarchingCubes(
            (x, y, z) => noise(x/n_vertices.x + this.x, y/n_vertices.y + this.y, z/n_vertices.z + this.z),
            chunk_size,
            n_vertices
        );
        this.position.set(this.x * chunk_size.x, this.y * chunk_size.y, this.z * chunk_size.z);
        scene.add(this.mesh);
    }


    unload() {
        if (!this.isLoaded()) {
            return;
        }

        this.geometry.dispose();
        this.material.dispose();
        scene.remove(this.mesh);
        this.mesh = undefined;
    }


    forceUpdate() {
        this.unload();
        this.load();
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


class verticalChunkLine {

    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.chunks = {};

        for (let y = floor_level; y < surface_level; y++) {
            this.chunks[y] = new chunk(x, y, z);
        }

        this.load();
    }


    get id() {
        return `${this.x},${this.z}`;
    }


    load() {
        Object.values(this.chunks).forEach((chunk) => {
            chunk.load();
        });

        chunk_lines[this.id] = this;
    }


    unload() {
        Object.values(this.chunks).forEach((chunk) => {
            chunk.unload();
        });

        delete chunk_lines[this.id];
    }


    updateShaderUniforms(uniforms) {
        Object.values(this.chunks).forEach((chunk) => {
            chunk.updateShaderUniforms(uniforms);
        });
    }


    forceUpdate() {
        Object.values(this.chunks).forEach((chunk) => {
            chunk.forceUpdate();
        });
    }
}