import { forceChunksUpdate } from "./chunk.js";
import { noise_param } from "./marching_cubes/noise.js";


export function updateNoiseGUI(gui) {
    const folder = gui.addFolder('Noise');
    // folder.add(noise_param, 'frequency', 0.1, 2, 0.1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'n_octaves', 1, 10, 1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'persistence', 0, 1, 0.1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'lacunarity', 1, 3, 0.1).onChange(forceChunksUpdate);
    // folder.add(noise_param, 'threshold', -1, 1, 0.1).onChange(forceChunksUpdate);
}