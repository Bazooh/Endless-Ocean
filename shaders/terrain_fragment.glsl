varying vec3 worldPosition;
varying vec3 vNormal;

uniform float uTime;
uniform vec3 uLightPos;
uniform float uLightIntensity;


vec3 apply_lighting(vec3 color) {
    const vec3 lightColor = vec3(1.0);

    vec3 lightDir = normalize(uLightPos - worldPosition);
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor * uLightIntensity;

    vec3 result = diffuse * color;

    return result;
}


vec3 get_color() {
    vec3 color = vec3(0.51, 0.4, 0.31);

    if (vNormal.y > 0.0) {
        vec3 grassColor = vec3(0.13, 0.39, 0.13);
        color = mix(color, grassColor, vNormal.y);
    }

    return color;
}


void main() {
    vec3 color = get_color();
    color = apply_lighting(color);

    gl_FragColor = vec4(color, 1.0);
}