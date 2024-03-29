uniform float uTime;

varying vec2 worldPosition;
varying vec3 vNormal;

const float PHI = 1.61803398874989484820459; // golden ratio: (1 + sqrt(5)) / 2

float noise(vec2 xy, float seed) {
    return fract(tan(distance(xy*PHI, xy)*seed)*xy.x*xy.y);
}

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
    return 2.0*(130.0 * dot(m, g) - 1.0);
}


float waterHeight(vec2 position) {
    const float waveFrequency = 0.1;
    const float waveAmplitude = 0.3;
    const float waterSpeed = 0.0002;

    return waveAmplitude * snoise(waveFrequency*position + waterSpeed*uTime*vec2(0.0, 1.0))
         + 0.5*waveAmplitude * snoise(waveFrequency*position + waterSpeed*uTime*vec2(0.0, -2.0) + vec2(2738.2749, 9572.2048))
         + 0.4*waveAmplitude * snoise(4.0*waveFrequency*position + waterSpeed*uTime*vec2(0.0, -1.0) + vec2(9284.2442, 2648.1244));
}


void main() {
    const float delta = 0.01;

    worldPosition = (modelMatrix * vec4(position, 1.0)).xz;

    vec3 new_position = position;
    new_position.z += waterHeight(worldPosition);


    vNormal = vec3(
        waterHeight(worldPosition + vec2(delta, 0.0)) - waterHeight(worldPosition - vec2(delta, 0.0)),
        2.0*delta,
        waterHeight(worldPosition + vec2(0.0, delta)) - waterHeight(worldPosition - vec2(0.0, delta))
    );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);
}