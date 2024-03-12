import * as THREE from 'three';
import { edgeTable, triTable } from './marching_cubes_tables.js';


const middleEdges = [
    new THREE.Vector3(0.5, 0, 0),
    new THREE.Vector3(1, 0.5, 0),
    new THREE.Vector3(0.5, 1, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.5, 0, 1),
    new THREE.Vector3(1, 0.5, 1),
    new THREE.Vector3(0.5, 1, 1),
    new THREE.Vector3(0, 0.5, 1),
    new THREE.Vector3(0, 0, 0.5),
    new THREE.Vector3(1, 0, 0.5),
    new THREE.Vector3(1, 1, 0.5),
    new THREE.Vector3(0, 1, 0.5)
]


function getCubeIndex(noise_values, x, y, z, threshold = 0) {
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


function createGeometry(n_vertices, chunk_size, noise) {
    const geometry = new THREE.BufferGeometry();
    const ratio = new THREE.Vector3(chunk_size.x / n_vertices.x, chunk_size.y / n_vertices.y, chunk_size.z / n_vertices.z);

    const noise_values = Array.from({length: n_vertices.x + 1}, (_, x) =>
        Array.from({length: n_vertices.y + 1}, (_, y) =>
            Array.from({length: n_vertices.z + 1}, (_, z) =>
                noise(x, y, z)
            )
        )
    );

    const vertices = [];
    const indices = [];

    for (let x = 0; x < n_vertices.x; x++) {
        for (let y = 0; y < n_vertices.y; y++) {
            for (let z = 0; z < n_vertices.z; z++) {
                const cube_index = getCubeIndex(noise_values, x, y, z);

                const edges = edgeTable[cube_index];
                const triangles = triTable.slice(cube_index * 16, cube_index * 16 + 16).filter((val) => val != -1);

                const _vertices = [];
                const vertices_indices = [];
                for (let i = 0; i < 12; i++) {
                    vertices_indices.push(-1);
                    if (edges & (1 << i)) {
                        vertices_indices[i] = _vertices.length / 3;
                        _vertices.push(...new THREE.Vector3(x, y, z).add(middleEdges[i]).multiply(ratio));
                    }
                }
                const _indices = triangles.map((val) => vertices_indices[val] + vertices.length / 3);

                vertices.push(..._vertices);
                indices.push(..._indices);
            }
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

    return geometry;
}


export function createMarchingCubes(noise, chunk_size, n_vertices = new THREE.Vector3(20, 20, 20)) {
    if (n_vertices.x * n_vertices.y * n_vertices.z > 10_000) throw new Error('Too much vertices : ' + n_vertices.x + ' x ' + n_vertices.y + ' x ' + n_vertices.z + ' = ' + n_vertices.x * n_vertices.y * n_vertices.z + ' > 10_000');

    const geometry = createGeometry(n_vertices, chunk_size, noise);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.DoubleSide});
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
}