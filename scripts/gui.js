import { forceChunksUpdate } from "./chunk.js";
import { noise_param } from "./marching_cubes/noise.js";
import * as THREE from 'three';
import { camera_param } from "./entities/followCamera.js";
import { player_param } from "./entities/player.js";
import { light_param } from "./light.js";
import { PRESETS } from "./presets.js";


// Menu visibility
const toggleMenuVisibility = () => {
    const menu = document.querySelector('.dg.a.main');
    const action = menu.classList.contains('hidden') ? 'remove' : 'add';
    menu.classList[action]('hidden');
};
window.addEventListener('keypress', ({ key }) => { if (key === 'm') toggleMenuVisibility(); });


export function updateNoiseGUI(gui) {
    // This does not work because the noise is not updated in the worker

    // const folder = gui.addFolder('Noise');
    // folder.add(noise_param, 'frequency', 0.1, 2, 0.1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'n_octaves', 1, 10, 1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'persistence', 0, 1, 0.1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'lacunarity', 1, 3, 0.1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'threshold', -1, 1, 0.1).onChange(forceChunksUpdate);
}


export function updateTimeGUI(gui, time, shader) {
    const folder = gui.addFolder('Time');
    folder.add(time, 'uTimeOfDay', 0, 24, 0.1).name('Time of Day').onChange((value) => shader.uniforms.uTimeOfDay.value = value).listen();
    folder.add(time, 'dayLength', 1, 1e6, 1).name('Day Length (s)');
    folder.add(time, 'timeStatic').name('Time Static');
}


export function updateAtmoshpereGUI(gui, atmosphere_param, shader) {
    const folder = gui.addFolder('Atmosphere');
    folder.add(atmosphere_param, 'uSunIntensity', 0, 2, 0.01).onChange((value) => shader.uniforms.uSunIntensity.value = value);
    
    const scatteringCoefficients = folder.addFolder('Scattering Coefficients');
    scatteringCoefficients.add(atmosphere_param.uScatteringCoefficients, 'r', 0, 50, 0.001).onChange((value) => shader.uniforms.uScatteringCoefficients.value = new THREE.Vector3(value, shader.uniforms.uScatteringCoefficients.value.y, shader.uniforms.uScatteringCoefficients.value.z));
    scatteringCoefficients.add(atmosphere_param.uScatteringCoefficients, 'g', 0, 50, 0.001).onChange((value) => shader.uniforms.uScatteringCoefficients.value = new THREE.Vector3(shader.uniforms.uScatteringCoefficients.value.x, value, shader.uniforms.uScatteringCoefficients.value.z));
    scatteringCoefficients.add(atmosphere_param.uScatteringCoefficients, 'b', 0, 50, 0.001).onChange((value) => shader.uniforms.uScatteringCoefficients.value = new THREE.Vector3(shader.uniforms.uScatteringCoefficients.value.x, shader.uniforms.uScatteringCoefficients.value.y, value));

    folder.add(atmosphere_param, 'uAtmosphereHeight', 0, 5e-2, 1e-6).onChange((value) => shader.uniforms.uAtmosphereHeight.value = value);
    folder.add(atmosphere_param, 'uEarthRadius', 0, 10, 1e-3).onChange((value) => shader.uniforms.uEarthRadius.value = value);
    
    const sunColorFolder = folder.addFolder('Sun Color');
    sunColorFolder.add(atmosphere_param.uSunColor, 'r', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(value, shader.uniforms.uSunColor.value.y, shader.uniforms.uSunColor.value.z));
    sunColorFolder.add(atmosphere_param.uSunColor, 'g', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(shader.uniforms.uSunColor.value.x, value, shader.uniforms.uSunColor.value.z));
    sunColorFolder.add(atmosphere_param.uSunColor, 'b', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(shader.uniforms.uSunColor.value.x, shader.uniforms.uSunColor.value.y, value));

    folder.add(atmosphere_param, 'uRayNumberOfPoints', 1, 100, 1).onChange((value) => shader.uniforms.uRayNumberOfPoints.value = value);
}


export function updateViewGUI(gui, view, player) {
    const folder = gui.addFolder('View');
    folder.add(view, 'generation_distance', 1, 64, 1).name("Generation Distance").onChange((new_value) => {
        player.view_distance = new_value;
        player.unloadFarChunks();
        player.loadSurroundingChunks();
    });
}

export function updatePresetGUI(gui, { time, atmosphere_param }) {
    const folder = gui.addFolder('Presets');
    let preset = { preset: 'default' };

    folder.add(preset, 'preset', ['default', 'cinematic']).onChange((value) => {
        const current_preset = PRESETS[value];

        noise_param.frequency = current_preset.noise_param.frequency;
        noise_param.n_octaves = current_preset.noise_param.n_octaves;
        noise_param.persistence = current_preset.noise_param.persistence;
        noise_param.lacunarity = current_preset.noise_param.lacunarity;
        noise_param.threshold = current_preset.noise_param.threshold;

        time.uTimeOfDay = current_preset.time.uTimeOfDay;
        time.dayLength = current_preset.time.dayLength;
        time.timeStatic = current_preset.time.timeStatic;

        atmosphere_param.uSunIntensity = current_preset.atmosphere_param.uSunIntensity;
        atmosphere_param.uAtmosphereHeight = current_preset.atmosphere_param.uAtmosphereHeight;
        atmosphere_param.uEarthRadius = current_preset.atmosphere_param.uEarthRadius;
        atmosphere_param.uRayNumberOfPoints = current_preset.atmosphere_param.uRayNumberOfPoints;
        atmosphere_param.uScatteringCoefficients.r = current_preset.atmosphere_param.uScatteringCoefficients.r;
        atmosphere_param.uScatteringCoefficients.g = current_preset.atmosphere_param.uScatteringCoefficients.g;
        atmosphere_param.uScatteringCoefficients.b = current_preset.atmosphere_param.uScatteringCoefficients.b;
        atmosphere_param.uSunColor.r = current_preset.atmosphere_param.uSunColor.r;
        atmosphere_param.uSunColor.g = current_preset.atmosphere_param.uSunColor.g;
        atmosphere_param.uSunColor.b = current_preset.atmosphere_param.uSunColor.b;

        camera_param.updateCamera = current_preset.camera_param.updateCamera;
        camera_param.followSpeed = current_preset.camera_param.followSpeed;
        camera_param.offset.x = current_preset.camera_param.offset.x;
        camera_param.offset.y = current_preset.camera_param.offset.y;
        camera_param.offset.z = current_preset.camera_param.offset.z;
        camera_param.lookPosition.x = current_preset.camera_param.lookPosition.x;
        camera_param.lookPosition.y = current_preset.camera_param.lookPosition.y;
        camera_param.lookPosition.z = current_preset.camera_param.lookPosition.z;

        player_param.enableCollisions = current_preset.player_param.enableCollisions;
        player_param.horizontalAcceleration = current_preset.player_param.horizontalAcceleration;
        player_param.verticalAcceleration = current_preset.player_param.verticalAcceleration;
        player_param.friction = current_preset.player_param.friction;
        player_param.rotationSpeed = current_preset.player_param.rotationSpeed;

        light_param.intensity = current_preset.light_param.intensity;
        light_param.direction_theta = current_preset.light_param.direction_theta;
        light_param.direction_phi = current_preset.light_param.direction_phi;
        light_param.color = current_preset.light_param.color;
        light_param.angle = current_preset.light_param.angle;

        gui.updateDisplay();
        try { forceChunksUpdate(); }
        catch (e) { console.error(e); }
    });
}