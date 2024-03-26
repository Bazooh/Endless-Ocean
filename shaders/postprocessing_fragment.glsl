uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform float uTanHalfFov;
uniform float uAspectRatio;

varying vec2 vUv;


const float densityAttenuation = 0.1;
const float sunDistance = 100.0;
const float rayLength = 100.0;

const int rayNumberOfPoints = 10;


vec2 distort(vec2 uv, vec2 amplitude, vec2 frequency, vec2 phase) {
    return uv + amplitude * sin(uv * frequency + phase);
}


bool isAtmoshepere(float depth) {
    return depth == 0.0 && uCameraPosition.y >= 0.0;
}


float getDensity(vec3 pos) {
    if (pos.y < 0.0) {
        return 0.0;
    }

    return (1.0 - pos.y) * exp(-pos.y * densityAttenuation);
}


float getOpticalDensity(vec3 pos) {
    float beta = densityAttenuation*sunDistance;
    float theta = exp(-beta);
    
    return (-sunDistance + beta + theta*sunDistance - beta*theta + beta*sunDistance*theta) / (beta*densityAttenuation);
}


vec3 getAtmosphereColor() {
    const vec3 skyColor = vec3(0.46, 0.72, 1.0);
    return skyColor;
}





// WARNING : This should not work if the camera is looking up or down
float dy_dz(vec2 uv) {
    return uv.y * uTanHalfFov;
}


void main() {
    const vec3 oceanColor = vec3(0.0, 0.0, 0.3);
    const vec2 amplitude = vec2(0.002, 0.002);
    const vec2 frequency = vec2(20.0, 20.0);
    const vec2 time_scale = vec2(0.004, 0.004);

    vec2 uv = distort(vUv, amplitude, frequency, time_scale * vec2(uTime, uTime));
    vec4 diffuse = texture2D(tDiffuse, uv);

    vec3 color = mix(oceanColor, diffuse.rgb, 0.5);

    float depth = texture2D(tDepth, uv).r;

    if (isAtmoshepere(depth)) {
        gl_FragColor = vec4(getAtmosphereColor(), 1.0);
        return;
    }

    gl_FragColor = vec4(color, 1.0);
}