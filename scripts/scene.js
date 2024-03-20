import * as THREE from 'three';
import { OrbitControls } from 'control';
import { createChunksFromTopToBottom, updateChunksShaderTime } from './chunk.js';
import { updateNoiseGUI } from './noise.js';
import { GUI } from 'dat.gui';
import { Player, updatePlayerGUI } from './entities/Player/player.js';
import { updateCameraGUI } from './entities/Player/followCamera.js';
import { updateLightGUI } from './light.js';
import { updateEntities } from './entities/entity.js';
import { addShader } from './shader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/ShaderPass.js';

const playerSpawn = {
    position: {
        x: 0,
        y: 0,
        z: 0
    },
    direction: {
        x: 1,
        y: 0,
        z: 0
    }
}

const view = {
    fov: 75,
    near: 0.1,
    far: 1000
}

const view_distance = 5; // in chunks


export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, view.near, view.far);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

addShader(
    'postprocessing',
    {},
    {
        tDiffuse: null,
        uTime: performance.now()
    }
).then(([shader, _]) => {
    composer.addPass(new ShaderPass(shader));
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const player = new Player(
    new THREE.Vector3(playerSpawn.position.x, playerSpawn.position.y, playerSpawn.position.z),
    new THREE.Vector3(playerSpawn.direction.x, playerSpawn.direction.y, playerSpawn.direction.z),
    view_distance
);

const gui = new GUI();
updateNoiseGUI(gui);
updatePlayerGUI(gui, player);
updateCameraGUI(gui, controls, player);
updateLightGUI(gui, player);

const map_size = new THREE.Vector2(view_distance, view_distance);
createChunksFromTopToBottom(new THREE.Vector2(), map_size);

function animate() {
    requestAnimationFrame(animate);

    updateEntities();
    
    // update water shader
    if (composer.passes[1] !== undefined)
        composer.passes[1].uniforms.uTime.value = performance.now();

    updateChunksShaderTime();

    composer.render();
}

animate();

//Resize Screen
function ResizeWindow() {
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    composer.render();
};


window.addEventListener( 'resize', ResizeWindow);