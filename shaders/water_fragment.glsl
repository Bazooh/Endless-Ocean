uniform sampler2D tDiffuse;

varying vec2 vUv;


void main() {
    vec4 diffuse = texture2D(tDiffuse, vUv);

    const vec3 oceanColor = vec3(0.0, 0.0, 0.3);

    gl_FragColor = mix(diffuse, vec4(oceanColor, 1.0), 0.5);
}