varying vec3 worldPosition;
varying vec3 vNormal;
varying float depth;

uniform float uTime;
uniform vec3 uLightColor;
uniform vec3 uLightPos;
uniform vec3 uLightDir;
uniform float uLightAngle;
uniform float uLightIntensity;


vec3 normal;

const vec3 black = vec3(0.001);


vec3 get_lighting() {
    vec3 pos = worldPosition - uLightPos;
    float angle = acos(dot(normalize(pos), uLightDir));

    if (angle > uLightAngle) {
        return black;
    }

    vec3 lightDir = normalize(uLightPos - worldPosition);
    float diff = max(dot(normal, lightDir), 0.001);
    vec3 diffuse = diff * uLightColor * uLightIntensity / length(pos);

    return mix(diffuse, black, smoothstep(0.4, 1.0, angle / uLightAngle));
}


vec3 get_color() {
    vec3 color = vec3(0.51, 0.4, 0.31);

    if (normal.y > 0.0) {
        vec3 grassColor = vec3(0.13, 0.39, 0.13);
        color = mix(color, grassColor, normal.y);
    }

    return color;
}


void main() {
    normal = normalize(vNormal);

    vec3 color = get_color();
    vec3 lighting = get_lighting();

    color = mix(color, color * lighting, clamp(-worldPosition.y / 3.0, 0.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
}