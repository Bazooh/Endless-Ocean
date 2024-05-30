import * as THREE from 'three';


export const clouds_param = {
    n_pixels: new THREE.Vector3(64, 64, 64),
    n_points: new THREE.Vector3(8, 8, 8),
}

let noise = worleyNoise(clouds_param.n_points);
let dataTexture;
updateDataTexture()


export function updateDataTexture() {
    const { x: nx, y: ny, z: nz } = clouds_param.n_pixels;
    const dataArray = new Uint8Array(nx * ny * nz * 4);
    const scaleX = 1 / nx;
    const scaleY = 1 / ny;
    const scaleZ = 1 / nz;
    
    let index = 0;
    for (let i = 0; i < nx; i++) {
        const ni = i * scaleX;
        for (let j = 0; j < ny; j++) {
            const nj = j * scaleY;
            for (let k = 0; k < nz; k++) {
                const nk = k * scaleZ;
                const value = Math.round(noise(ni, nj, nk) * 255);
                
                dataArray[index] = value;
                dataArray[index + 1] = value;
                dataArray[index + 2] = value;
                dataArray[index + 3] = 1.0;

                index += 4;
            }
        }
    }

    dataTexture = new THREE.Data3DTexture(dataArray, nx, ny, nz, THREE.RGBAFormat);
    dataTexture.needsUpdate = true;
}


function worleyNoise(n_points) {
    const points = [];
    for (let x = 0; x < n_points.x; x++) {
        points[x] = [];
        for (let y = 0; y < n_points.y; y++) {
            points[x][y] = [];
            for (let z = 0; z < n_points.z; z++) {
                points[x][y][z] = [
                    Math.random(),
                    Math.random(),
                    Math.random()
                ];
            }
        }
    }

    const cell_size = [
        1 / n_points.x,
        1 / n_points.y,
        1 / n_points.z
    ];

    return (x, y, z) => {
        const cell = [
            Math.floor(x * n_points.x),
            Math.floor(y * n_points.y),
            Math.floor(z * n_points.z)
        ];

        const local = [
            (x % cell_size[0]) * n_points.x,
            (y % cell_size[1]) * n_points.y,
            (z % cell_size[2]) * n_points.z
        ];

        let min_distance = 1.0;

        for (let i = -1; i <= 1; i++) {
            const ni = (cell[0] + i + n_points.x) % n_points.x;
            for (let j = -1; j <= 1; j++) {
                const nj = (cell[1] + j + n_points.y) % n_points.y;
                for (let k = -1; k <= 1; k++) {
                    const nk = (cell[2] + k + n_points.z) % n_points.z;

                    const point = points[ni][nj][nk];
                    const point_pos = [
                        point[0] + i,
                        point[1] + j,
                        point[2] + k
                    ];

                    const diff = [
                        point_pos[0] - local[0],
                        point_pos[1] - local[1],
                        point_pos[2] - local[2]
                    ];

                    const distance = Math.sqrt(
                        diff[0] * diff[0] +
                        diff[1] * diff[1] +
                        diff[2] * diff[2]
                    );

                    if (distance < min_distance) {
                        min_distance = distance;
                    }
                }
            }
        }

        return min_distance;
    }
}



export function updateCloudsNoise() {
    noise = worleyNoise(clouds_param.n_points);
}


export function getCloudsTexture() {
    return dataTexture;
}