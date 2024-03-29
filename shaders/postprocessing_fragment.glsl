uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform vec3 uCameraDirection;
uniform float uTanHalfFov;
uniform float uAspectRatio;

varying vec2 vUv;


const int rayNumberOfPoints = 10;
const float invRayNumberOfPoints = 1.0 / float(rayNumberOfPoints);

const float reflectiveIndex = 1.00029;
const float pi = 3.14159265359;
const float molecularDensity = 2.504e25;
const float n2_1 = reflectiveIndex*reflectiveIndex - 1.0;

const vec3 waveLength = vec3(680e-9, 550e-9, 450e-9);
const vec3 invWaveLengthPow4 = pow(1.0 / waveLength, vec3(4.0));

const vec3 scatteringCoefficient = 8.0*pi*pi*pi*n2_1*n2_1 / (3.0 * molecularDensity) * invWaveLengthPow4;

const float atmosphereHeight = 10.0;
const float densityAttenuation = 1.0 / atmosphereHeight;

const float sunIntensity = 2e4;
const vec3 sunPosition = vec3(-10000.0, 5000.0, 0.0);


vec2 distort(vec2 uv, vec2 amplitude, vec2 frequency, vec2 phase) {
    return uv + amplitude * sin(uv * frequency + phase);
}


bool isAtmoshepere(float depth) {
    return depth == 0.0 && uCameraPosition.y >= 0.0;
}


float density(float altitude) {
    altitude /= atmosphereHeight;

    if (altitude < 0.0) {
        return 0.0;
    }

    return exp(-altitude * densityAttenuation);
}


float opticalDepth(vec3 startPoint, vec3 endPoint) {
    vec3 offset = (endPoint - startPoint) * invRayNumberOfPoints;

    vec3 samplePoint = startPoint;

    float sum = 0.0;
    for (int i = 0; i < rayNumberOfPoints; i++) {
        sum += density(samplePoint.y);
        samplePoint += offset;
    }
    return sum * invRayNumberOfPoints * length(endPoint - startPoint);
}


vec3 transmittence(float sampleOpticalDepth, vec3 samplePoint, vec3 endPoint) {
    return exp(-scatteringCoefficient * (sampleOpticalDepth + opticalDepth(samplePoint, endPoint)));
}


float phaseFunction(float cosThetaSquared) {
    const float coef = 3.0 / (16.0 * pi);
    return coef * (1.0 + cosThetaSquared);
}


vec3 scatteringPhaseFunction(float cosThetaSquared) {
    return scatteringCoefficient * phaseFunction(cosThetaSquared);
}


bool intersectionRaySphere(vec3 origin, vec3 direction, vec3 center, float radius, out vec3 firstIntersection, out vec3 secondIntersection) {
    vec3 L = center - origin;
    float DT = dot(L, direction);
    float radiusSquared = radius * radius;
    float CT2 = dot(L,L) - DT*DT;
    
    // Intersection point outside the circle
    if (CT2 > radiusSquared)
        return false;
    
    float AT = sqrt(radiusSquared - CT2);

    firstIntersection = origin + (DT - AT)*direction;
    secondIntersection = origin + (DT + AT)*direction;

    return true;
}


vec3 intensity(vec3 pos, vec3 dir, vec3 sunPosition) {
    vec3 atomsphereEntryPoint;
    vec3 atomsphereEndPoint;
    if (!intersectionRaySphere(pos, dir, vec3(0.0, -100000.0, 0.0), 100050.0 + atmosphereHeight, atomsphereEntryPoint, atomsphereEndPoint)) {
        return vec3(0.0);
    }

    vec3 planetEntryPoint;
    vec3 planetEndPoint;
    if (intersectionRaySphere(pos, dir, vec3(0.0, -100000.0, 0.0), 100049.0, planetEntryPoint, planetEndPoint)) {
        atomsphereEndPoint = planetEntryPoint;
    }

    vec3 offset = (atomsphereEndPoint - atomsphereEntryPoint) * invRayNumberOfPoints;

    vec3 samplePoint = atomsphereEntryPoint;
    float sampleLength = length(atomsphereEndPoint - atomsphereEntryPoint) * invRayNumberOfPoints;

    vec3 sum = vec3(0.0);
    float sampleOpticalDepth = 0.0;
    for (int i = 0; i < rayNumberOfPoints; i++) {
        sum += transmittence(sampleOpticalDepth, samplePoint, atomsphereEndPoint) * density(pos.y);
        
        samplePoint += offset;
        sampleOpticalDepth += density(samplePoint.y) * sampleLength;
    }

    float cos_theta = dot(normalize(sunPosition - pos), normalize(atomsphereEndPoint - atomsphereEntryPoint));

    return sunIntensity * scatteringPhaseFunction(pow(cos_theta, 2.0)) * sum * sampleLength;
}


vec3 rotateVector(vec3 direction) {
    vec2 cameraDirection = normalize(uCameraDirection.xz);
    vec2 axis = normalize(vec2(0.0, abs(cameraDirection.x)));
    
    float halfAngle = 0.5*acos(cameraDirection.y)*sign(cameraDirection.x);
    vec3 quat = vec3(axis * sin(halfAngle), cos(halfAngle));

    mat3 rotationMatrix = mat3(
        1.0 - 2.0*quat.y*quat.y, 2.0*quat.x*quat.y, 2.0*quat.z*quat.y,
        2.0*quat.x*quat.y, 1.0 - 2.0*quat.x*quat.x, -2.0*quat.z*quat.x,
        -2.0*quat.z*quat.y, 2.0*quat.z*quat.x, 1.0 - 2.0*(quat.x*quat.x + quat.y*quat.y)
    );

    return rotationMatrix * direction;
    return vec3(0.0, 0.0, 1.0);
}


// WARNING : This should not work if the camera is looking up or down
vec3 getLookingDirection() {
    float dx = vUv.x * uTanHalfFov * uAspectRatio * 2.0 - 1.0;
    float dy = vUv.y * uTanHalfFov * 2.0 - 1.0;

    vec3 direction = normalize(vec3(dx, dy, 1.0));
    return rotateVector(direction);
}


vec3 atmosphereColor(vec3 sunPosition) {
    vec3 lookingDirection = getLookingDirection();
    const vec3 sunColor = vec3(1.0, 0.97, 0.38);

    vec3 sky = intensity(vec3(0.0, uCameraPosition.y, 0.0), lookingDirection, sunPosition);

    float cos_theta = dot(normalize(sunPosition - vec3(0.0, uCameraPosition.y, 0.0)), lookingDirection);
    if (cos_theta > 0.98) {
        return mix(sky, sunColor, (cos_theta - 0.98) * (cos_theta - 0.98) * 60.0 * 60.0);
    }

    return sky;
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
        gl_FragColor = vec4(atmosphereColor(sunPosition), 1.0);
        return;
    }

    gl_FragColor = vec4(color, 1.0);
}