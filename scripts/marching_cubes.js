import * as THREE from 'three';
import { createNoise3D } from 'noise';
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


function createGeometry(size) {
    const geometry = new THREE.BufferGeometry();
    const noise = createNoise3D()

    const noise_values = Array.from({length: size.x + 1}, (_, x) =>
        Array.from({length: size.y + 1}, (_, y) =>
            Array.from({length: size.z + 1}, (_, z) =>
                noise(x, y, z)
            )
        )
    );

    const vertices = [];
    const indices = [];

    for (let x = 0; x < size.x; x++) {
        for (let y = 0; y < size.y; y++) {
            for (let z = 0; z < size.z; z++) {
                const cube_index = getCubeIndex(noise_values, x, y, z);

                const edges = edgeTable[cube_index];
                const triangles = triTable.slice(cube_index * 16, cube_index * 16 + 16).filter((val) => val != -1);

                const _vertices = [];
                const vertices_indices = [];
                for (let i = 0; i < 12; i++) {
                    vertices_indices.push(-1);
                    if (edges & (1 << i)) {
                        vertices_indices[i] = _vertices.length / 3;
                        _vertices.push(...middleEdges[i].clone().add(new THREE.Vector3(x, y, z)));
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


export function createMarchingCubes(size = new THREE.Vector3(5, 5, 5)) {
    const geometry = createGeometry(size);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false, side: THREE.DoubleSide});
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
}