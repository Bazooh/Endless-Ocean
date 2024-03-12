import * as THREE from 'three';
import { createNoise3D } from 'noise';
import { forceChunksUpdate } from './chunk.js';
import { surface_level, floor_level } from './scene.js';


const noise_param = {
    frequency: 0.6,
    n_octaves: 2,
    persistence: 0.2,
    lacunarity: 2,
    surface_transition_height: 3, // in chunks (can be float)
    floor_transition_height: 1 // in chunks (can be float)
};


export function updateNoiseGUI(gui) {
    const folder = gui.addFolder('Noise');
    folder.add(noise_param, 'frequency', 0.1, 2, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'n_octaves', 1, 10, 1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'persistence', 0, 1, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'lacunarity', 1, 3, 0.1).onChange(forceChunksUpdate);
}


function surfaceMask(x, y, z) {
    const value = (surface_level - y) / noise_param.surface_transition_height;
    return THREE.clamp(value, 0, 1);
}


function floorMask(x, y, z) {
    const value = (y - floor_level) / noise_param.floor_transition_height;
    return THREE.clamp(value, 0, 1);
}


export function createNoise() {
    const octaves = [];
    for (let i = 0; i < noise_param.n_octaves; i++) {
        octaves.push(createNoise3D());
    }

    return (x, y, z) => {
        let value = 0;
        let octave_amplitude = 1;
        let octave_frequency = noise_param.frequency;

        for (let i = 0; i < noise_param.n_octaves; i++) {
            if (i >= octaves.length) {
                octaves.push(createNoise3D());
            }

            value += octave_amplitude * octaves[i](octave_frequency*x, octave_frequency*y, octave_frequency*z);
            octave_amplitude *= noise_param.persistence;
            octave_frequency *= noise_param.lacunarity;
        }

        value = THREE.clamp(value, -1, 1)
        value = (value + 1)*surfaceMask(x, y, z) - 1;
        value = (value - 1)*floorMask(x, y, z) + 1;

        return value;
    }
}