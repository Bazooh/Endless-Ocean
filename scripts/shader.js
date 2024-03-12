export function addShader(shader, material, shader_type = "fragmentShader", uniforms = {}) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `./shaders/${shader}.glsl`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            material[shader_type] = xhr.responseText;
            material.needsUpdate = true;

            Object.entries(uniforms).forEach(([key, value]) => {
                material.uniforms[key] = { value: value };
            });
        }
    };
    xhr.send();
}