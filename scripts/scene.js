import * as THREE from 'three';
import { OrbitControls } from 'control';


const view = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: {
        x: 0,
        y: 0,
        z: 0
    },
    target: {
        x: 0,
        y: 0,
        z: 0
    }
}


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, view.near, view.far);
camera.position.set(view.position.x, view.position.y, view.position.z);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(view.target.x, view.target.y, view.target.z);
controls.update();


function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

animate();