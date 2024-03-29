import * as THREE from '../../build/three.module.js';
import { edgeTable, triTable } from './tables.js';
import { createNoise } from './noise.js';


const epsilon = 0.05;
const N_VERTICES_MAX = 10_000;
const noise = createNoise();


export function getNormalChunkCoords(x, y, z, noise) {
    // The normal is the gradient of the noise function
    const nx = (noise(x - epsilon, y, z) - noise(x + epsilon, y, z)) / (2 * epsilon);
    const ny = (noise(x, y - epsilon, z) - noise(x, y + epsilon, z)) / (2 * epsilon);
    const nz = (noise(x, y, z - epsilon) - noise(x, y, z + epsilon)) / (2 * epsilon);

    const length = Math.sqrt(nx*nx + ny*ny + nz*nz);

    return [nx / length, ny / length, nz / length];
}


function getCubeIndex(noise_values, x, y, z, threshold) {
    let cube_index = 0;

    if (noise_values[x][y][z] < threshold) cube_index |= 1;
    if (noise_values[x + 1][y][z] < threshold) cube_index |= 2;
    if (noise_values[x + 1][y + 1][z] < threshold) cube_index |= 4;
    if (noise_values[x][y + 1][z] < threshold) cube_index |= 8;
    if (noise_values[x][y][z + 1] < threshold) cube_index |= 16;
    if (noise_values[x + 1][y][z + 1] < threshold) cube_index |= 32;
    if (noise_values[x + 1][y + 1][z + 1] < threshold) cube_index |= 64;
    if (noise_values[x][y + 1][z + 1] < threshold) cube_index |= 128;

    return cube_index;
}


function getVertices(noise_values, x, y, z, offset, edges, ratio, threshold) {
    const vertices = [];
    const indices = new Array(12).fill(-1);

    if (edges & 1) {
        indices[0] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y][z]) / (noise_values[x + 1][y][z] - noise_values[x][y][z]);
        vertices.push((x + mu)*ratio.x + offset.x, y*ratio.y + offset.y, z*ratio.z + offset.z);
    }
    if (edges & 2) {
        indices[1] = vertices.length / 3;
        const mu = (threshold - noise_values[x + 1][y][z]) / (noise_values[x + 1][y + 1][z] - noise_values[x + 1][y][z]);
        vertices.push((x + 1)*ratio.x + offset.x, (y + mu)*ratio.y + offset.y, z*ratio.z + offset.z);
    }
    if (edges & 4) {
        indices[2] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y + 1][z]) / (noise_values[x + 1][y + 1][z] - noise_values[x][y + 1][z]);
        vertices.push((x + mu)*ratio.x + offset.x, (y + 1)*ratio.y + offset.y, z*ratio.z + offset.z);
    }
    if (edges & 8) {
        indices[3] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y][z]) / (noise_values[x][y + 1][z] - noise_values[x][y][z]);
        vertices.push(x*ratio.x + offset.x, (y + mu)*ratio.y + offset.y, z*ratio.z + offset.z);
    }
    if (edges & 16) {
        indices[4] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y][z + 1]) / (noise_values[x + 1][y][z + 1] - noise_values[x][y][z + 1]);
        vertices.push((x + mu)*ratio.x + offset.x, y*ratio.y + offset.y, (z + 1)*ratio.z + offset.z);
    }
    if (edges & 32) {
        indices[5] = vertices.length / 3;
        const mu = (threshold - noise_values[x + 1][y][z + 1]) / (noise_values[x + 1][y + 1][z + 1] - noise_values[x + 1][y][z + 1]);
        vertices.push((x + 1)*ratio.x + offset.x, (y + mu)*ratio.y + offset.y, (z + 1)*ratio.z + offset.z);
    }
    if (edges & 64) {
        indices[6] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y + 1][z + 1]) / (noise_values[x + 1][y + 1][z + 1] - noise_values[x][y + 1][z + 1]);
        vertices.push((x + mu)*ratio.x + offset.x, (y + 1)*ratio.y + offset.y, (z + 1)*ratio.z + offset.z);
    }
    if (edges & 128) {
        indices[7] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y][z + 1]) / (noise_values[x][y + 1][z + 1] - noise_values[x][y][z + 1]);
        vertices.push(x*ratio.x + offset.x, (y + mu)*ratio.y + offset.y, (z + 1)*ratio.z + offset.z);
    }
    if (edges & 256) {
        indices[8] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y][z]) / (noise_values[x][y][z + 1] - noise_values[x][y][z]);
        vertices.push(x*ratio.x + offset.x, y*ratio.y + offset.y, (z + mu)*ratio.z + offset.z);
    }
    if (edges & 512) {
        indices[9] = vertices.length / 3;
        const mu = (threshold - noise_values[x + 1][y][z]) / (noise_values[x + 1][y][z + 1] - noise_values[x + 1][y][z]);
        vertices.push((x + 1)*ratio.x + offset.x, y*ratio.y + offset.y, (z + mu)*ratio.z + offset.z);
    }
    if (edges & 1024) {
        indices[10] = vertices.length / 3;
        const mu = (threshold - noise_values[x + 1][y + 1][z]) / (noise_values[x + 1][y + 1][z + 1] - noise_values[x + 1][y + 1][z]);
        vertices.push((x + 1)*ratio.x + offset.x, (y + 1)*ratio.y + offset.y, (z + mu)*ratio.z + offset.z);
    }
    if (edges & 2048) {
        indices[11] = vertices.length / 3;
        const mu = (threshold - noise_values[x][y + 1][z]) / (noise_values[x][y + 1][z + 1] - noise_values[x][y + 1][z]);
        vertices.push(x*ratio.x + offset.x, (y + 1)*ratio.y + offset.y, (z + mu)*ratio.z + offset.z);
    }

    return {_vertices: vertices, _vertex_indices: indices};
}


function createGeometry(chunk_idx, n_vertices, chunk_size, threshold) {
    const local_noise = (x, y, z) => noise(chunk_idx.x + x/n_vertices.x, chunk_idx.y + y/n_vertices.y, chunk_idx.z + z/n_vertices.z);

    const offset = new THREE.Vector3(chunk_idx.x * chunk_size.x, chunk_idx.y * chunk_size.y, chunk_idx.z * chunk_size.z);
    const ratio = new THREE.Vector3(chunk_size.x / n_vertices.x, chunk_size.y / n_vertices.y, chunk_size.z / n_vertices.z);

    const noise_values = Array.from({length: n_vertices.x + 1}, (_, x) =>
        Array.from({length: n_vertices.y + 1}, (_, y) =>
            Array.from({length: n_vertices.z + 1}, (_, z) => 
                local_noise(x, y, z)
            )
        )
    );

    const vertices = [];
    const indices = [];
    const normals = [];

    for (let x = 0; x < n_vertices.x; x++) {
        for (let y = 0; y < n_vertices.y; y++) {
            for (let z = 0; z < n_vertices.z; z++) {
                const cube_index = getCubeIndex(noise_values, x, y, z, threshold);

                const edges = edgeTable[cube_index];
                const triangles = triTable.slice(cube_index * 16, cube_index * 16 + 16).filter((val) => val != -1);

                const {_vertices, _vertex_indices} = getVertices(noise_values, x, y, z, offset, edges, ratio, threshold);
                const _indices = triangles.map((val) => _vertex_indices[val] + vertices.length / 3);

                vertices.push(..._vertices);
                indices.push(..._indices);
            }
        }
    }

    for (let i = 0; i < vertices.length; i += 3) {
        const vx = vertices[i] / chunk_size.x;
        const vy = vertices[i + 1] / chunk_size.y;
        const vz = vertices[i + 2] / chunk_size.z;

        normals.push(...getNormalChunkCoords(vx, vy, vz, noise));
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices)
    };
}


export function createMarchingCubes(chunk_idx, n_vertices, chunk_size, threshold) {
    if (n_vertices.x * n_vertices.y * n_vertices.z > N_VERTICES_MAX)
        throw new Error('Too much vertices : ' + n_vertices.x + ' x ' + n_vertices.y + ' x ' + n_vertices.z + ' = ' + n_vertices.x * n_vertices.y * n_vertices.z + ' > ' + N_VERTICES_MAX);

    return createGeometry(chunk_idx, n_vertices, chunk_size, threshold);
}


export function __createMarchingCubes(chunk_idx, n_vertices, chunk_size, noise_frequency, threshold) {
    if (n_vertices.x * n_vertices.y * n_vertices.z > N_VERTICES_MAX)
        throw new Error('Too much vertices : ' + n_vertices.x + ' x ' + n_vertices.y + ' x ' + n_vertices.z + ' = ' + n_vertices.x * n_vertices.y * n_vertices.z + ' > ' + N_VERTICES_MAX + ' (N_VERTICES_MAX)');

    let time = performance.now();

    const pointer = wasm.ccall(
        'getGeometryAttributes',
        'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
        [
            chunk_idx.x, chunk_idx.y, chunk_idx.z,
            n_vertices.x, n_vertices.y, n_vertices.z,
            chunk_size.x, chunk_size.y, chunk_size.z,
            noise_frequency.x, noise_frequency.y, noise_frequency.z,
            threshold
        ]
    );

    const wasm_time = performance.now() - time;
    time = performance.now(); 

    const output = wasm.HEAP32.subarray(pointer / 4, pointer / 4 + 6);

    const positions_pointer = output[0];
    const positions_size = output[1];

    const normals_pointer = output[2];
    const normals_size = output[3];

    const indices_pointer = output[4];
    const indices_size = output[5];

    const positions = Float32Array.from(wasm.HEAPF32.subarray(positions_pointer / 4, positions_pointer / 4 + positions_size));
    const normals = Float32Array.from(wasm.HEAPF32.subarray(normals_pointer / 4, normals_pointer / 4 + normals_size));
    const indices = Uint32Array.from(wasm.HEAPU32.subarray(indices_pointer / 4, indices_pointer / 4 + indices_size));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    wasm._free(pointer);
    wasm._free(positions_pointer);
    wasm._free(normals_pointer);
    wasm._free(indices_pointer);

    const get_geometry_time = performance.now() - time;

    return [ wasm_time, get_geometry_time ];

    // return geometry;
}