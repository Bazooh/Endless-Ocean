import * as THREE from 'three';
import { OrbitControls } from 'control';
import { createChunks } from './chunk.js';
import { updateNoiseGUI } from './noise.js';
import { GUI } from 'dat.gui';
import { Player, updatePlayerGUI } from './entities/Player/player.js';
import { updateCameraGUI } from './entities/Player/followCamera.js';
import { updateLightGUI } from './light.js';
import { updateEntities } from './entities/entity.js';
import { updateChunksShaderUniforms } from './chunk.js';
import { addShader } from './shader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/ShaderPass.js';

const playerSpawn = {
    position: {
        x: 0,
        y: 0,
        z: 0
    }
}

const view = {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: {
        x: 20,
        y: 20,
        z: 20
    },
    target: {
        x: 0,
        y: 0,
        z: 0
    }
}

export const surface_level = 0;
export const floor_level = -4;


export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, view.near, view.far);
camera.position.set(view.position.x, view.position.y, view.position.z);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

addShader('water', {}, {tDiffuse: {value: null}}).then(([shader, _]) => composer.addPass(new ShaderPass(shader)));

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(view.target.x, view.target.y, view.target.z);
controls.update();

const player = new Player(new THREE.Vector3(playerSpawn.position.x, playerSpawn.position.y, playerSpawn.position.z));

const gui = new GUI();
updateNoiseGUI(gui);
updatePlayerGUI(gui, player);
updateCameraGUI(gui, controls, player);
updateLightGUI(gui, player);

const map_size = new THREE.Vector3(6, surface_level - floor_level, 6);
createChunks(new THREE.Vector3(-3, floor_level, -3), map_size);

function animate() {
    requestAnimationFrame(animate);

    updateEntities();

    composer.render();
}

animate();

//Resize Screen
var ResizeWindow = function ( )
{
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene,camera);
};


window.addEventListener( 'resize', ResizeWindow);