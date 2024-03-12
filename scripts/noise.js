import * as THREE from 'three';
import { createNoise3D } from 'noise';
import { forceChunksUpdate } from './chunk.js';


const noise_param = {
    frequency: 0.8,
    n_octaves: 3,
    persistence: 0.5,
    lacunarity: 2,
};


export function updateNoiseGUI(gui) {
    const folder = gui.addFolder('Noise');
    folder.add(noise_param, 'frequency', 0.1, 2, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'n_octaves', 1, 10, 1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'persistence', 0, 1, 0.1).onChange(forceChunksUpdate);
    folder.add(noise_param, 'lacunarity', 1, 3, 0.1).onChange(forceChunksUpdate);
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

        return THREE.clamp(value, -1, 1);
    }
}