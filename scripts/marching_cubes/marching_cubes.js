import * as THREE from '../../build/three.module.js';
import { edgeTable, triTable } from './tables.js';
import { noise } from './noise.js';


const epsilon = 0.05;
const N_VERTICES_MAX = 10_000;


export function getNormalChunkCoords(x, y, z) {
    // The normal is the gradient of the noise function
    const nx = (noise(x - epsilon, y, z) - noise(x + epsilon, y, z)) / (2 * epsilon);
    const ny = (noise(x, y - epsilon, z) - noise(x, y + epsilon, z)) / (2 * epsilon);
    const nz = (noise(x, y, z - epsilon) - noise(x, y, z + epsilon)) / (2 * epsilon);

    const length = Math.sqrt(nx*nx + ny*ny + nz*nz);

    return [nx / length, ny / length, nz / length];
}


function getCubeIndex(threshold, noise_x_y_z, noise_x1_y_z, noise_x_y1_z, noise_x1_y1_z, noise_x_y_z1, noise_x1_y_z1, noise_x_y1_z1, noise_x1_y1_z1) {
    let cube_index = 0;

    if (noise_x_y_z < threshold) cube_index |= 1;
    if (noise_x1_y_z < threshold) cube_index |= 2;
    if (noise_x1_y1_z < threshold) cube_index |= 4;
    if (noise_x_y1_z < threshold) cube_index |= 8;
    if (noise_x_y_z1 < threshold) cube_index |= 16;
    if (noise_x1_y_z1 < threshold) cube_index |= 32;
    if (noise_x1_y1_z1 < threshold) cube_index |= 64;
    if (noise_x_y1_z1 < threshold) cube_index |= 128;

    return cube_index;
}


function getVertices(edges, threshold, xRatio, x1Ratio, ratioX, yRatio, y1Ratio, ratioY, zRatio, z1Ratio, ratioZ, noise_x_y_z, noise_x1_y_z, noise_x_y1_z, noise_x1_y1_z, noise_x_y_z1, noise_x1_y_z1, noise_x_y1_z1, noise_x1_y1_z1) {
    const vertices = [];
    const indices = new Array(12).fill(-1);

    if (edges & 1) {
        indices[0] = vertices.length / 3;
        const mu = (threshold - noise_x_y_z) / (noise_x1_y_z - noise_x_y_z);
        vertices.push(xRatio + mu*ratioX, yRatio, zRatio);
    }
    if (edges & 2) {
        indices[1] = vertices.length / 3;
        const mu = (threshold - noise_x1_y_z) / (noise_x1_y1_z - noise_x1_y_z);
        vertices.push(x1Ratio, yRatio + mu*ratioY, zRatio);
    }
    if (edges & 4) {
        indices[2] = vertices.length / 3;
        const mu = (threshold - noise_x_y1_z) / (noise_x1_y1_z - noise_x_y1_z);
        vertices.push(xRatio + mu*ratioX, y1Ratio, zRatio);
    }
    if (edges & 8) {
        indices[3] = vertices.length / 3;
        const mu = (threshold - noise_x_y_z) / (noise_x_y1_z - noise_x_y_z);
        vertices.push(xRatio, yRatio + mu*ratioY, zRatio);
    }
    if (edges & 16) {
        indices[4] = vertices.length / 3;
        const mu = (threshold - noise_x_y_z1) / (noise_x1_y_z1 - noise_x_y_z1);
        vertices.push(xRatio + mu*ratioX, yRatio, z1Ratio);
    }
    if (edges & 32) {
        indices[5] = vertices.length / 3;
        const mu = (threshold - noise_x1_y_z1) / (noise_x1_y1_z1 - noise_x1_y_z1);
        vertices.push(x1Ratio, yRatio + mu*ratioY, z1Ratio);
    }
    if (edges & 64) {
        indices[6] = vertices.length / 3;
        const mu = (threshold - noise_x_y1_z1) / (noise_x1_y1_z1 - noise_x_y1_z1);
        vertices.push(xRatio + mu*ratioX, y1Ratio, z1Ratio);
    }
    if (edges & 128) {
        indices[7] = vertices.length / 3;
        const mu = (threshold - noise_x_y_z1) / (noise_x_y1_z1 - noise_x_y_z1);
        vertices.push(xRatio, yRatio + mu*ratioY, z1Ratio);
    }
    if (edges & 256) {
        indices[8] = vertices.length / 3;
        const mu = (threshold - noise_x_y_z) / (noise_x_y_z1 - noise_x_y_z);
        vertices.push(xRatio, yRatio, zRatio + mu*ratioZ);
    }
    if (edges & 512) {
        indices[9] = vertices.length / 3;
        const mu = (threshold - noise_x1_y_z) / (noise_x1_y_z1 - noise_x1_y_z);
        vertices.push(x1Ratio, yRatio, zRatio + mu*ratioZ);
    }
    if (edges & 1024) {
        indices[10] = vertices.length / 3;
        const mu = (threshold - noise_x1_y1_z) / (noise_x1_y1_z1 - noise_x1_y1_z);
        vertices.push(x1Ratio, y1Ratio, zRatio + mu*ratioZ);
    }
    if (edges & 2048) {
        indices[11] = vertices.length / 3;
        const mu = (threshold - noise_x_y1_z) / (noise_x_y1_z1 - noise_x_y1_z);
        vertices.push(xRatio, y1Ratio, zRatio + mu*ratioZ);
    }

    return {_vertices: vertices, _vertex_indices: indices};
}


function createGeometry(chunk_idx, n_vertices, chunk_size, threshold) {
    const invNVerticesX = 1 / n_vertices.x;
    const invNVerticesY = 1 / n_vertices.y;
    const invNVerticesZ = 1 / n_vertices.z;

    const noise_values = new Float32Array((n_vertices.x + 1) * (n_vertices.y + 1) * (n_vertices.z + 1));
    let noiseIndex = 0;
    for (let x = 0; x <= n_vertices.x; x++) {
        const xValue = chunk_idx.x + x*invNVerticesX;
        for (let y = 0; y <= n_vertices.y; y++) {
            const yValue = chunk_idx.y + y*invNVerticesY;
            for (let z = 0; z <= n_vertices.z; z++) {
                const zValue = chunk_idx.z + z*invNVerticesZ;
                noise_values[noiseIndex++] = noise(xValue, yValue, zValue);
            }
        }
    }

    const ratioX = chunk_size.x / n_vertices.x;
    const ratioY = chunk_size.y / n_vertices.y;
    const ratioZ = chunk_size.z / n_vertices.z;
    const offsetX = chunk_idx.x * chunk_size.x;
    const offsetY = chunk_idx.y * chunk_size.y;
    const offsetZ = chunk_idx.z * chunk_size.z;

    const vertices = [];
    const indices = [];
    const normals = [];

    const numVerticesX = n_vertices.x;
    const numVerticesY = n_vertices.y;
    const numVerticesZ = n_vertices.z;
    const numVerticesZ1 = (numVerticesZ + 1);
    const numVerticesY1Z1 = (numVerticesY + 1) * numVerticesZ1;

    let verticesIndex = 0;
    let indicesIndex = 0;

    for (let x = 0; x < numVerticesX; x++) {
        const xRatio = x * ratioX + offsetX;
        const x1Ratio = (x + 1) * ratioX + offsetX;

        for (let y = 0; y < numVerticesY; y++) {
            const yRatio = y * ratioY + offsetY;
            const y1Ratio = (y + 1) * ratioY + offsetY;

            for (let z = 0; z < numVerticesZ; z++) {
                const zRatio = z * ratioZ + offsetZ;
                const z1Ratio = (z + 1) * ratioZ + offsetZ;

                const noise_x_y_z = noise_values[x * numVerticesY1Z1 + y * numVerticesZ1 + z];
                const noise_x1_y_z = noise_values[(x + 1) * numVerticesY1Z1 + y * numVerticesZ1 + z];
                const noise_x_y1_z = noise_values[x * numVerticesY1Z1 + (y + 1) * numVerticesZ1 + z];
                const noise_x1_y1_z = noise_values[(x + 1) * numVerticesY1Z1 + (y + 1) * numVerticesZ1 + z];
                const noise_x_y_z1 = noise_values[x * numVerticesY1Z1 + y * numVerticesZ1 + (z + 1)];
                const noise_x1_y_z1 = noise_values[(x + 1) * numVerticesY1Z1 + y * numVerticesZ1 + (z + 1)];
                const noise_x_y1_z1 = noise_values[x * numVerticesY1Z1 + (y + 1) * numVerticesZ1 + (z + 1)];
                const noise_x1_y1_z1 = noise_values[(x + 1) * numVerticesY1Z1 + (y + 1) * numVerticesZ1 + (z + 1)];

                const cubeIndex = getCubeIndex(threshold, noise_x_y_z, noise_x1_y_z, noise_x_y1_z, noise_x1_y1_z, noise_x_y_z1, noise_x1_y_z1, noise_x_y1_z1, noise_x1_y1_z1);

                const edges = edgeTable[cubeIndex];
                
                const tempIndices = [];
                let numTriangles = 0;

                for (let i = cubeIndex * 16; i < (cubeIndex + 1) * 16; i++) {
                    if (triTable[i] == -1) break;
                    tempIndices[numTriangles++] = triTable[i];
                }

                const { _vertices, _vertex_indices } = getVertices(edges, threshold, xRatio, x1Ratio, ratioX, yRatio, y1Ratio, ratioY, zRatio, z1Ratio, ratioZ, noise_x_y_z, noise_x1_y_z, noise_x_y1_z, noise_x1_y1_z, noise_x_y_z1, noise_x1_y_z1, noise_x_y1_z1, noise_x1_y1_z1);

                const baseIndex = verticesIndex / 3;
                for (let i = 0; i < _vertices.length; i++) {
                    vertices[verticesIndex++] = _vertices[i];
                }

                for (let i = 0; i < numTriangles; i++) {
                    indices[indicesIndex++] = _vertex_indices[tempIndices[i]] + baseIndex;
                }
            }
        }
    }

    let numNormals = 0;

    for (let i = 0; i < vertices.length; i += 3) {
        const vx = vertices[i] / chunk_size.x;
        const vy = vertices[i + 1] / chunk_size.y;
        const vz = vertices[i + 2] / chunk_size.z;

        const normal = getNormalChunkCoords(vx, vy, vz);

        normals[numNormals++] = normal[0];
        normals[numNormals++] = normal[1];
        normals[numNormals++] = normal[2];
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