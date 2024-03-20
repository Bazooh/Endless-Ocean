import * as THREE from 'three';
import { edgeTable, triTable } from './marching_cubes_tables.js';
import { noise_param } from './noise.js';


const epsilon = 0.05;


export function getLocalNormal(x, y, z, noise) {
    // The normal is the gradient of the noise function
    const nx = (noise(x - epsilon, y, z) - noise(x + epsilon, y, z)) / (2 * epsilon);
    const ny = (noise(x, y - epsilon, z) - noise(x, y + epsilon, z)) / (2 * epsilon);
    const nz = (noise(x, y, z - epsilon) - noise(x, y, z + epsilon)) / (2 * epsilon);

    const length = Math.sqrt(nx*nx + ny*ny + nz*nz);

    return [nx / length, ny / length, nz / length];
}


function getCubeIndex(noise_values, x, y, z) {
    let cube_index = 0;

    if (noise_values[x][y][z] < noise_param.threshold) cube_index |= 1;
    if (noise_values[x + 1][y][z] < noise_param.threshold) cube_index |= 2;
    if (noise_values[x + 1][y + 1][z] < noise_param.threshold) cube_index |= 4;
    if (noise_values[x][y + 1][z] < noise_param.threshold) cube_index |= 8;
    if (noise_values[x][y][z + 1] < noise_param.threshold) cube_index |= 16;
    if (noise_values[x + 1][y][z + 1] < noise_param.threshold) cube_index |= 32;
    if (noise_values[x + 1][y + 1][z + 1] < noise_param.threshold) cube_index |= 64;
    if (noise_values[x][y + 1][z + 1] < noise_param.threshold) cube_index |= 128;

    return cube_index;
}


function getVertices(noise_values, x, y, z, edges, ratio) {
    const vertices = [];
    const indices = new Array(12).fill(-1);

    if (edges & 1) {
        indices[0] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y][z]) / (noise_values[x + 1][y][z] - noise_values[x][y][z]);
        vertices.push((x + mu)*ratio.x, y*ratio.y, z*ratio.z);
    }
    if (edges & 2) {
        indices[1] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x + 1][y][z]) / (noise_values[x + 1][y + 1][z] - noise_values[x + 1][y][z]);
        vertices.push((x + 1)*ratio.x, (y + mu)*ratio.y, z*ratio.z);
    }
    if (edges & 4) {
        indices[2] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y + 1][z]) / (noise_values[x + 1][y + 1][z] - noise_values[x][y + 1][z]);
        vertices.push((x + mu)*ratio.x, (y + 1)*ratio.y, z*ratio.z);
    }
    if (edges & 8) {
        indices[3] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y][z]) / (noise_values[x][y + 1][z] - noise_values[x][y][z]);
        vertices.push(x*ratio.x, (y + mu)*ratio.y, z*ratio.z);
    }
    if (edges & 16) {
        indices[4] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y][z + 1]) / (noise_values[x + 1][y][z + 1] - noise_values[x][y][z + 1]);
        vertices.push((x + mu)*ratio.x, y*ratio.y, (z + 1)*ratio.z);
    }
    if (edges & 32) {
        indices[5] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x + 1][y][z + 1]) / (noise_values[x + 1][y + 1][z + 1] - noise_values[x + 1][y][z + 1]);
        vertices.push((x + 1)*ratio.x, (y + mu)*ratio.y, (z + 1)*ratio.z);
    }
    if (edges & 64) {
        indices[6] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y + 1][z + 1]) / (noise_values[x + 1][y + 1][z + 1] - noise_values[x][y + 1][z + 1]);
        vertices.push((x + mu)*ratio.x, (y + 1)*ratio.y, (z + 1)*ratio.z);
    }
    if (edges & 128) {
        indices[7] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y][z + 1]) / (noise_values[x][y + 1][z + 1] - noise_values[x][y][z + 1]);
        vertices.push(x*ratio.x, (y + mu)*ratio.y, (z + 1)*ratio.z);
    }
    if (edges & 256) {
        indices[8] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y][z]) / (noise_values[x][y][z + 1] - noise_values[x][y][z]);
        vertices.push(x*ratio.x, y*ratio.y, (z + mu)*ratio.z)
    }
    if (edges & 512) {
        indices[9] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x + 1][y][z]) / (noise_values[x + 1][y][z + 1] - noise_values[x + 1][y][z]);
        vertices.push((x + 1)*ratio.x, y*ratio.y, (z + mu)*ratio.z);
    }
    if (edges & 1024) {
        indices[10] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x + 1][y + 1][z]) / (noise_values[x + 1][y + 1][z + 1] - noise_values[x + 1][y + 1][z]);
        vertices.push((x + 1)*ratio.x, (y + 1)*ratio.y, (z + mu)*ratio.z);
    }
    if (edges & 2048) {
        indices[11] = vertices.length / 3;
        const mu = (noise_param.threshold - noise_values[x][y + 1][z]) / (noise_values[x][y + 1][z + 1] - noise_values[x][y + 1][z]);
        vertices.push(x*ratio.x, (y + 1)*ratio.y, (z + mu)*ratio.z);
    }

    return {_vertices: vertices, _vertex_indices: indices};
}


function createGeometry(n_vertices, chunk_size, local_noise) {
    const geometry = new THREE.BufferGeometry();
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
                const cube_index = getCubeIndex(noise_values, x, y, z);

                const edges = edgeTable[cube_index];
                const triangles = triTable.slice(cube_index * 16, cube_index * 16 + 16).filter((val) => val != -1);

                const {_vertices, _vertex_indices} = getVertices(noise_values, x, y, z, edges, ratio);
                const _indices = triangles.map((val) => _vertex_indices[val] + vertices.length / 3);

                vertices.push(..._vertices);
                indices.push(..._indices);
            }
        }
    }

    for (let i = 0; i < vertices.length; i += 3) {
        const vx = vertices[i] / ratio.x;
        const vy = vertices[i + 1] / ratio.y;
        const vz = vertices[i + 2] / ratio.z;

        normals.push(...getLocalNormal(vx, vy, vz, local_noise));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

    return geometry;
}


export function createMarchingCubes(local_noise, chunk_size, n_vertices = new THREE.Vector3(20, 20, 20)) {
    if (n_vertices.x * n_vertices.y * n_vertices.z > 10_000) throw new Error('Too much vertices : ' + n_vertices.x + ' x ' + n_vertices.y + ' x ' + n_vertices.z + ' = ' + n_vertices.x * n_vertices.y * n_vertices.z + ' > 10_000');

    return createGeometry(n_vertices, chunk_size, local_noise);
}