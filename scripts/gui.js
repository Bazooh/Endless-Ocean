import { forceChunksUpdate } from "./chunk.js";
import { noise_param } from "./marching_cubes/noise.js";
import * as THREE from 'three';


export function updateNoiseGUI(gui) {
    const folder = gui.addFolder('Noise');
    folder.add(noise_param, 'frequency', 0.1, 2, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'n_octaves', 1, 10, 1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'persistence', 0, 1, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'lacunarity', 1, 3, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'threshold', -1, 1, 0.1).onChange(forceChunksUpdate);
}


export function updateAtmoshpereGUI(gui, atmosphere_param, shader) {
    const folder = gui.addFolder('Atmosphere');
    folder.add(atmosphere_param, 'uSunIntensity', 0, 1000, 0.01).onChange((value) => shader.uniforms.uSunIntensity.value = value);
    
    const waveLengthFolder = folder.addFolder('Wave Length');
    waveLengthFolder.add(atmosphere_param.uWaveLength, 'x', 0, 1000, 10).onChange((value) => shader.uniforms.uWaveLength.value = new THREE.Vector3(value, shader.uniforms.uWaveLength.value.y, shader.uniforms.uWaveLength.value.z));
    waveLengthFolder.add(atmosphere_param.uWaveLength, 'y', 0, 1000, 10).onChange((value) => shader.uniforms.uWaveLength.value = new THREE.Vector3(shader.uniforms.uWaveLength.value.x, value, shader.uniforms.uWaveLength.value.z));
    waveLengthFolder.add(atmosphere_param.uWaveLength, 'z', 0, 1000, 10).onChange((value) => shader.uniforms.uWaveLength.value = new THREE.Vector3(shader.uniforms.uWaveLength.value.x, shader.uniforms.uWaveLength.value.y, value));

    folder.add(atmosphere_param, 'uAtmosphereHeight', 0, 10000, 1).onChange((value) => shader.uniforms.uAtmosphereHeight.value = value);
    folder.add(atmosphere_param, 'uEarthRadius', 0, 200000, 1).onChange((value) => shader.uniforms.uEarthRadius.value = value);
    
    const sunColorFolder = folder.addFolder('Sun Color');
    sunColorFolder.add(atmosphere_param.uSunColor, 'r', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(value, shader.uniforms.uSunColor.value.y, shader.uniforms.uSunColor.value.z));
    sunColorFolder.add(atmosphere_param.uSunColor, 'g', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(shader.uniforms.uSunColor.value.x, value, shader.uniforms.uSunColor.value.z));
    sunColorFolder.add(atmosphere_param.uSunColor, 'b', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(shader.uniforms.uSunColor.value.x, shader.uniforms.uSunColor.value.y, value));

    folder.add(atmosphere_param, 'uScatteringFactor', 0, 10, 0.1).onChange((value) => shader.uniforms.uScatteringFactor.value = value);
}