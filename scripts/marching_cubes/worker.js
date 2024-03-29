import('./marching_cubes.js').then(marching_cubes => {
    onmessage = function(message) {
        const result = marching_cubes.createMarchingCubes(...message.data);
        result.chunk_idx = message.data[0];

        postMessage({type: "Result", data: result});
    }

    postMessage({type: "Ready", data: null});
});