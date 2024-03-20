uniform sampler2D tDiffuse;
uniform float uTime;

varying vec2 vUv;


vec2 distort(vec2 uv, vec2 amplitude, vec2 frequency, vec2 phase) {
    return uv + amplitude * sin(uv * frequency + phase);
}


void main() {
    const vec3 oceanColor = vec3(0.0, 0.0, 0.3);
    const vec2 amplitude = vec2(0.002, 0.002);
    const vec2 frequency = vec2(20.0, 20.0);
    const vec2 time_scale = vec2(0.004, 0.004);

    vec2 uv = distort(vUv, amplitude, frequency, time_scale * vec2(uTime, uTime));
    vec4 diffuse = texture2D(tDiffuse, uv);

    vec3 color = mix(oceanColor, diffuse.rgb, 0.5);

    gl_FragColor = vec4(color, diffuse.a);
}