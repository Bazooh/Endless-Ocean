import * as THREE from 'three';
import { OrbitControls } from 'control';
import { updateChunksShaderTime } from './chunk.js';
import { updateNoiseGUI, updateAtmoshpereGUI, updateViewGUI, updateTimeGUI } from './gui.js';
import { GUI } from 'dat.gui';
import { Player, updatePlayerGUI } from './entities/player.js';
import { updateCameraGUI } from './entities/followCamera.js';
import { updateLightGUI } from './light.js';
import { updateEntities } from './entities/entity.js';
import {Run} from './fish/fishManager.js';
import { addShader } from './shader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/ShaderPass.js';

const playerSpawn = {
    position: {
        x: 0,
        y: -0.5,
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
    far: 1000,
    generation_distance: 7, // radius of chunks to generate
}

const time = {
    uTimeOfDay: 0,
    dayLength: 10,
    timeStatic: false,
}

const atmosphere_param = {
    uSunIntensity: 1.0,
    uScatteringCoefficients: {r: 5.19673, g: 12.1427, b: 29.6453},
    uAtmosphereHeight: 1.0,
    uEarthRadius: 6.371,
    uSunColor: {r: 1, g: 1, b: 1},
    uRayNumberOfPoints: 40,
}

const view_distance = 7; // in chunks

globalThis.scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, view.near, view.far);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

export const player = new Player(
    new THREE.Vector3(playerSpawn.position.x, playerSpawn.position.y, playerSpawn.position.z),
    new THREE.Vector3(playerSpawn.direction.x, playerSpawn.direction.y, playerSpawn.direction.z),
    view.generation_distance
);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

addShader(
    'postprocessing',
    {},
    {
        tDiffuse: null,

        tDepth: null,
        uTime: performance.now(),
        uCameraPosition: camera.position,
        projectionMatrixInverse: camera.projectionMatrixInverse,
        viewMatrixInverse: camera.matrixWorld,

        uScatteringCoefficients: new THREE.Vector3(atmosphere_param.uScatteringCoefficients.r, atmosphere_param.uScatteringCoefficients.g, atmosphere_param.uScatteringCoefficients.b),
        uAtmosphereHeight: atmosphere_param.uAtmosphereHeight,
        uSunIntensity: atmosphere_param.uSunIntensity,
        uEarthRadius: atmosphere_param.uEarthRadius,
        uSunColor: new THREE.Vector3(atmosphere_param.uSunColor.r, atmosphere_param.uSunColor.g, atmosphere_param.uSunColor.b),
        uRayNumberOfPoints: atmosphere_param.uRayNumberOfPoints,
        
        uTimeOfDay: time.uTimeOfDay
    }
).then(([shader, _]) => {
    composer.addPass(new ShaderPass(shader));

    const gui = new GUI();
    updateNoiseGUI(gui);
    updatePlayerGUI(gui, player);
    updateCameraGUI(gui, controls, player);
    updateLightGUI(gui, player);
    updateAtmoshpereGUI(gui, atmosphere_param, composer.passes[1]);
    updateViewGUI(gui, view, player);
    updateTimeGUI(gui, time, composer.passes[1]);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

let prev_time = performance.now();
let delta_time = 0;

function animate() {
    requestAnimationFrame(animate);

    updateEntities();

    delta_time = performance.now() - prev_time;
    prev_time = performance.now();

    if (!time.timeStatic)
        time.uTimeOfDay = (time.uTimeOfDay + 24*delta_time / (1000*time.dayLength)) % 24;
    
    // update post-processing shader
    if (composer.passes[1] !== undefined) {
        composer.passes[1].uniforms.tDepth.value = composer.renderTarget2.texture;
        composer.passes[1].uniforms.uTime.value += delta_time;
        composer.passes[1].uniforms.uTimeOfDay.value = time.uTimeOfDay;
        composer.passes[1].uniforms.uCameraPosition.value = camera.position;
        composer.passes[1].uniforms.projectionMatrixInverse.value = camera.projectionMatrixInverse;
        composer.passes[1].uniforms.viewMatrixInverse.value = camera.matrixWorld;
    }

    updateChunksShaderTime();

    composer.render();
}

animate();

//Resize Screen
function ResizeWindow() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.render();
};


window.addEventListener( 'resize', ResizeWindow);

Run();