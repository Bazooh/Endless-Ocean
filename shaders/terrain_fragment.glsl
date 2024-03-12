varying vec3 worldPosition;
varying vec3 vNormal;

uniform float uTime;
uniform vec3 uLightPos;
uniform float uLightIntensity;


vec3 apply_lighting(vec3 color) {
    const vec3 lightColor = vec3(1.0);
    const float specularStrength = 0.5;
    const float shininess = 32.0;

    vec3 lightDir = normalize(uLightPos - worldPosition);
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor * uLightIntensity;

    vec3 result = diffuse * color;

    return result;
}


void main() {
    vec3 color = vec3(0.51, 0.4, 0.31);
    color = apply_lighting(color);

    gl_FragColor = vec4(color, 1.0);
}