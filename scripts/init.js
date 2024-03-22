import { Module } from '../build/marching_cubes/marching_cubes.js';


Module().then((mod) => {
    globalThis.wasm = mod;

    import('./scene.js')
});