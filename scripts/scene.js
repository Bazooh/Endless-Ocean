import * as THREE from 'three';
import { OrbitControls } from 'control';
import { loadChunks } from './chunk.js';
import { updateNoiseGUI } from './noise.js';
import { GUI } from 'dat.gui';


const view = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: {
        x: 5,
        y: 5,
        z: 5
    },
    target: {
        x: 0,
        y: 0,
        z: 0
    }
}


const gui = new GUI();
updateNoiseGUI(gui);

export const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, view.near, view.far);
camera.position.set(view.position.x, view.position.y, view.position.z);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(view.target.x, view.target.y, view.target.z);
controls.update();


const map_size = new THREE.Vector3(4, 4, 4);
loadChunks(new THREE.Vector3(-2, -2, -2), map_size);


function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

animate();