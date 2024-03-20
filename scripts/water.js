import * as THREE from 'three';
import { chunk_size, n_vertices } from './chunk.js';


export function createWaterGeometry() {
    const geometry = new THREE.PlaneGeometry(chunk_size.x, chunk_size.z, n_vertices.x - 1, n_vertices.z - 1);

    return geometry;
}