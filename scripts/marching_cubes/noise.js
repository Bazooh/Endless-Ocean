import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise';
import Mash from 'https://cdn.skypack.dev/alea';


export const noise_param = {
    frequency: 0.6,
    n_octaves: 2,
    persistence: 0.2,
    lacunarity: 2,
    threshold: 0,
    surface_transition_height: 3, // in chunks (can be float)
    floor_transition_height: 1, // in chunks (can be float)
    surface_level: 0,
    floor_level: -4
};


function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function surfaceMask(x, y, z) {
    const value = (noise_param.surface_level - y) / noise_param.surface_transition_height;
    return clamp(value, 0, 1);
}


function floorMask(x, y, z) {
    const value = (y - noise_param.floor_level) / noise_param.floor_transition_height;
    return clamp(value, 0, 1);
}


export function createNoise() {
    const octaves = [];
    for (let i = 0; i < noise_param.n_octaves; i++) {
        octaves.push(createNoise3D(new Mash(i)));
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

        value = clamp(value, -1, 1)
        value = (value + 1)*surfaceMask(x, y, z) - 1;
        value = (value - 1)*floorMask(x, y, z) + 1;

        return value;
    }
}