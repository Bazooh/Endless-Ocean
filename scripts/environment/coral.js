import * as THREE from 'three'
import { chunk_size } from '../chunk.js'
import { noise_param } from '../marching_cubes/noise.js'
import { noiseValue, getNormal } from '../chunk.js'

const maxCoral = 5

export function spawnCoral(chunk_x, chunk_z) {

    let all_coral = []

    const coralNumber = Math.floor(Math.random() * (maxCoral + 1))

    for (let i = 0; i < coralNumber; i++) {
        
        let randomX = (chunk_x + Math.random()) * chunk_size.x;
        let randomZ = (chunk_z + Math.random()) * chunk_size.z;

        all_coral.push( createModel(randomX, getSpawnY(randomX, randomZ), randomZ));
    }

    return all_coral;
}

function createModel(x, y, z) {
    const geometry = new THREE.BoxGeometry( 0.5, 2, 0.5 ); 
    const material = new THREE.MeshStandardMaterial( {color: 0x01ff01} ); 
    const cube = new THREE.Mesh( geometry, material ); 

    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    cube.up.set(1, 0, 0)

    let normal = getNormal(x, y, z)


    cube.lookAt(normal.clone().add(new THREE.Vector3(x, y, z)))
    cube.rotateX(Math.PI / 2)

    cube.translateOnAxis(normal, 1)

    scene.add( cube );

    return cube;


}

function getSpawnY(spawn_x, spawn_z) {

    let topPos = noise_param.surface_level * chunk_size.y;
    let bottomPos = (noise_param.floor_level - 1) * chunk_size.y;

   
    let upper = topPos;
    let lower = bottomPos;
    let mid = (upper + lower) / 2;

    while (true) {
        
        let noise_value = noiseValue(spawn_x, mid, spawn_z)

        let isWater = noise_value < noise_param.threshold

        let dist = Math.abs(noise_value - noise_param.threshold)
        if (dist < 0.0001) break

        if (isWater) {
            upper = mid
        }
        else lower = mid

         mid = (upper + lower) / 2;

    }

    return mid;
}