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

const float sunIntensity = 1e4;


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

    return (1.0 - altitude) * exp(-altitude * densityAttenuation);
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
    if (!intersectionRaySphere(pos, dir, vec3(0.0, -1000.0, 0.0), 1000.0 + atmosphereHeight, atomsphereEntryPoint, atomsphereEndPoint)) {
        return vec3(0.0);
    }

    vec3 planetEntryPoint;
    vec3 planetEndPoint;
    if (intersectionRaySphere(pos, dir, vec3(0.0, -1000.0, 0.0), 1000.0, planetEntryPoint, planetEndPoint)) {
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
    // Normalize the vectors
    direction = normalize(direction);
    vec3 cameraDirection = normalize(uCameraDirection);

    // Compute the axis of rotation
    vec3 axis = cross(direction, cameraDirection);
    float angle = acos(dot(direction, cameraDirection));

    // Create a quaternion for rotation
    float halfAngle = angle * 0.5;
    float s = sin(halfAngle);
    vec4 quat = vec4(axis * s, cos(halfAngle));

    // Convert quaternion to rotation matrix
    mat4 rotationMatrix = mat4(
        1.0 - 2.0 * (quat.y * quat.y + quat.z * quat.z), 2.0 * (quat.x * quat.y - quat.w * quat.z), 2.0 * (quat.x * quat.z + quat.w * quat.y), 0.0,
        2.0 * (quat.x * quat.y + quat.w * quat.z), 1.0 - 2.0 * (quat.x * quat.x + quat.z * quat.z), 2.0 * (quat.y * quat.z - quat.w * quat.x), 0.0,
        2.0 * (quat.x * quat.z - quat.w * quat.y), 2.0 * (quat.y * quat.z + quat.w * quat.x), 1.0 - 2.0 * (quat.x * quat.x + quat.y * quat.y), 0.0,
        0.0, 0.0, 0.0, 1.0
    );

    // Apply rotation to direction vector
    vec4 rotatedDirection = rotationMatrix * vec4(direction, 1.0);

    return rotatedDirection.xyz;
}


// WARNING : This should not work if the camera is looking up or down
vec3 getLookingDirection() {
    float dx = vUv.x * uTanHalfFov * uAspectRatio;
    float dy = vUv.y * uTanHalfFov;

    vec3 direction = vec3(dx, dy, 1.0);
    return rotateVector(direction);
}


vec3 atmosphereColor(vec3 sunPosition) {
    return intensity(vec3(0.0, uCameraPosition.y, 0.0), getLookingDirection(), sunPosition);
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
        vec3 sunPosition = vec3(0.0, 1000.0, 0.0);
        gl_FragColor = vec4(atmosphereColor(sunPosition), 1.0);
        return;
    }

    gl_FragColor = vec4(color, 1.0);
}