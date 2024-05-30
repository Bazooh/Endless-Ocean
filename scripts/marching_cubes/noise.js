import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise';
import Mash from 'https://cdn.skypack.dev/alea';


export const noise_param = {
    frequency: 0.2,
    n_octaves: 3,
    persistence: 0.15,
    lacunarity: 4,
    threshold: 0.2,
    surface_transition_height: 5, // in chunks (can be float)
    floor_transition_height: 1, // in chunks (can be float)
    surface_level: 4,
    floor_level: -8,
    sea_level: 0,
};

export let noise = createNoise();


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


export function updateNoise() {
    noise = createNoise();
}


export function createNoise() {
    const { n_octaves, frequency, persistence, lacunarity } = noise_param;
    const octaves = new Array(n_octaves);

    for (let i = 0; i < n_octaves; i++) {
        const noise = createNoise3D(new Mash(i));
        const noise_frequency = frequency * Math.pow(lacunarity, i);
        const amplitude = Math.pow(persistence, i);
        octaves[i] = (x, y, z) => amplitude * noise(x * noise_frequency, y * noise_frequency, z * noise_frequency);
    }

    return (x, y, z) => {
        let value = 0;

        for (let i = 0; i < n_octaves; i++) {
            value += octaves[i](x, y, z);
        }

        value = clamp(value, -1, 1);
        value = (value + 1) * surfaceMask(x, y, z) - 1;
        value = (value - 1) * floorMask(x, y, z) + 1;

        return value;
    }
}