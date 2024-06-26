varying vec2 worldPosition;
varying vec3 vNormal;


const vec3 sunPosition = vec3(-10000.0, 5000.0, 0.0);


vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}


float getLighting() {
    vec3 normal = normalize(vNormal + 0.0005*vec3(snoise(5.0*worldPosition)));
    vec3 lightDir = normalize(sunPosition - vec3(worldPosition.x, 0.0, worldPosition.y));
    float lightIntensity = max(dot(normal, lightDir), 0.01);

    vec2 lookingDir = worldPosition - cameraPosition.xz;

    lightIntensity *= exp(-0.2*abs(dot(lookingDir, lightDir.zx)));

    return lightIntensity;
}


void main() {
    const vec4 waterColor = vec4(0.26, 0.36, 1.0, 0.4);

    vec4 color = waterColor;

    float noise = snoise(worldPosition * 0.2)
         + 0.50 * snoise(worldPosition * 0.4 + vec2(8164.208, 2794.927));
         + 0.25 * snoise(worldPosition * 0.8 + vec2(1942.234, 8224.723));
    vec4 noiseColor = vec4(0.2, 0.15, 1.0, 0.4);

    color = mix(color, noiseColor, noise);
    color = mix(color, vec4(1.0), 1.5*getLighting());

    gl_FragColor = vec4(color);
}