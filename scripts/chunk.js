import * as THREE from 'three';
import { createNoise, noise_param } from './marching_cubes/noise.js';
import { getNormalChunkCoords } from "./marching_cubes/marching_cubes.js";
import { addShader } from './shader.js';
import { createWaterGeometry } from './water.js';
import { Vector3 } from '../build/three.module.js';
import { getLightUniforms } from './light.js';


export const chunk_size = new THREE.Vector3(10, 10, 10);
export const n_vertices = new THREE.Vector3(16, 16, 16);

export const chunk_lines = {};

export const noise = createNoise();


export function unloadAllChunks() {
    Object.values(chunk_lines).forEach((chunkLine) => {
        chunkLine.unload();
    });
}


export function getNormal(x, y, z) {
    return new THREE.Vector3(...getNormalChunkCoords(x / chunk_size.x, y / chunk_size.y, z / chunk_size.z));
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
    return noise(x / chunk_size.x, y / chunk_size.y, z / chunk_size.z) < noise_param.threshold;
}


export function updateChunksShaderUniforms(uniforms) {
    Object.values(chunk_lines).forEach((chunkLine) => {
        chunkLine.updateShaderUniforms(uniforms);
    });
}


export function updateChunksShaderTime() {
    updateChunksShaderUniforms({
        uTime: performance.now()
    });
    Object.values(chunk_lines).forEach((chunkLine) => {
        chunkLine.water.material.uniforms.uTime.value = performance.now();
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
        return this.mesh?.geometry;
    }

    get material() {
        return this.mesh?.material;
    }

    get position() {
        return this.mesh?.position;
    }


    isLoaded() {
        return this.mesh !== undefined;
    }


    load() {
        if (this.isLoaded()) {
            return;
        }

        marchingCubes(
            new Vector3(this.x, this.y, this.z),
            n_vertices,
            chunk_size,
            noise_param.threshold,
        ).then((result) => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(result.vertices, 3));
            geometry.setAttribute('normal', new THREE.BufferAttribute(result.normals, 3));
            geometry.setIndex(new THREE.BufferAttribute(result.indices, 1));
            
            const material = new THREE.ShaderMaterial({side: THREE.DoubleSide, wireframe: false});
            addShader('terrain', material, Object.assign({uTime: 0}, getLightUniforms())).then(() => {
                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.layers.enable(1);
                scene.add(this.mesh);
            });
        });
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
            if (this.material === undefined) {
                return;
            }
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
        this.water = null;

        for (let y = noise_param.floor_level; y < noise_param.surface_level; y++) {
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

        const water_geometry = createWaterGeometry();
        const water_material = new THREE.ShaderMaterial({side: THREE.DoubleSide, wireframe: false, transparent: true});
        addShader('water', water_material, {uTime: performance.now()});
        this.water = new THREE.Mesh(water_geometry, water_material);

        this.water.position.set(this.x * chunk_size.x, noise_param.surface_level, this.z * chunk_size.z);
        this.water.rotation.x = -Math.PI / 2;
        scene.add(this.water);

        chunk_lines[this.id] = this;
    }


    unload() {
        Object.values(this.chunks).forEach((chunk) => {
            chunk.unload();
        });

        this.water.geometry.dispose();
        this.water.material.dispose();
        scene.remove(this.water);

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