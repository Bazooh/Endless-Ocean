uniform sampler2D tDiffuse;

varying vec2 vUv;


void main() {
    vec4 diffuse = texture2D(tDiffuse, vUv);

    const vec3 oceanColor = vec3(0.0, 0.0, 0.3);

    vec3 color = mix(oceanColor, diffuse.rgb, 0.5);

    gl_FragColor = vec4(color, diffuse.a);
}