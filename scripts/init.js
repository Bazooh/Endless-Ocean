// Module().then((mod) => {
//     globalThis.wasm = mod;

//     import('./marching_cubes/test.js');
// });

const marching_cubes_worker = new Worker('scripts/marching_cubes/worker.js', { type: 'module' });
const chunks_in_process = {};


function get_id(obj) {
    return `${obj.x},${obj.y},${obj.z}`;
}


marching_cubes_worker.onmessage = function(message) {
    const result = message.data;

    if (result.type === 'Ready') {
        globalThis.marchingCubes = function(...data) {
            const chunk_idx = data[0];

            return new Promise((resolve, reject) => {
                chunks_in_process[get_id(chunk_idx)] = {resolve: resolve, reject: reject};
                marching_cubes_worker.postMessage(data);
            });
        };
        import('./scene.js');
    }

    if (result.type == 'Result') {
        const chunk_id = get_id(result.data.chunk_idx);
        chunks_in_process[chunk_id].resolve(result.data);
    }
};