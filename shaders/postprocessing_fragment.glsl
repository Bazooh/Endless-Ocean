uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float uTime;
uniform float uTimeOfDay;
uniform vec3 uCameraPosition;

uniform vec3 uScatteringCoefficients;
uniform float uAtmosphereHeight;
uniform float uSunIntensity;
uniform vec3 uSunColor;
uniform float uEarthRadius;
uniform int uRayNumberOfPoints;
uniform float uCloudsHeight;

uniform mat4 projectionMatrixInverse;
uniform mat4 viewMatrixInverse;

uniform lowp sampler3D cloudTexture;
varying vec2 vUv;

float invRayNumberOfPoints;

const float pi = 3.14159265359;


vec2 distort(vec2 uv, vec2 amplitude, vec2 frequency, vec2 phase) {
    return uv + amplitude * sin(uv * frequency + phase);
}


bool isAtmoshepere(float depth) {
    return depth == 0.0;
}


float cloudDensity(vec3 point) {
    return texture(cloudTexture, fract(point / 2.0)).r * 2.0;
}


float density(vec3 point) {
    float altitude = length(point) - uEarthRadius;

    if (altitude < 0.0) {
        return 0.0;
    }

    return exp(-altitude / uAtmosphereHeight);
}


vec3 lightSample(float sampleOpticalDepth, vec3 startPoint, vec3 endPoint, bool clouds) {
    vec3 offset = (endPoint - startPoint) * invRayNumberOfPoints;

    vec3 samplePoint = startPoint + 0.5*offset;

    float sum = 0.0;
    for (int i = 0; i < uRayNumberOfPoints; i++) {
        // sum += clouds ? cloudDensity(samplePoint) : density(samplePoint);
        sum += density(samplePoint);
        samplePoint += offset;
    }
    float opticalDepth = sum * length(offset);

    return exp(-uScatteringCoefficients * 4e-2 * (sampleOpticalDepth + opticalDepth));
}


float phaseFunction(float cosThetaSquared) {
    const float coef = 3.0 / (16.0 * pi);
    return coef * (1.0 + cosThetaSquared);
}


vec3 scatteringPhaseFunction(float cosThetaSquared) {
    return uScatteringCoefficients * phaseFunction(cosThetaSquared);
}


bool intersectionRaySphere(vec3 origin, vec3 direction, vec3 center, float radius, out vec3 firstIntersection, out vec3 secondIntersection, out bool behind) {
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

    behind = DT < 0.0;

    return true;
}


vec3 intensity(vec3 pos, vec3 dir, vec3 sunPosition) {
    vec3 atomsphereEntryPoint;
    vec3 atomsphereEndPoint;
    vec3 cloudsEntryPoint;
    bool behind;

    if (!intersectionRaySphere(pos, dir, vec3(0.0), uEarthRadius + uAtmosphereHeight, atomsphereEntryPoint, atomsphereEndPoint, behind)) {
        return vec3(0.0);
    }

    vec3 planetEntryPoint;
    vec3 planetEndPoint;
    if (intersectionRaySphere(pos, dir, vec3(0.0), uEarthRadius, planetEntryPoint, planetEndPoint, behind)) {
        if (!behind)
            return vec3(0.0);
        
        atomsphereEntryPoint = planetEndPoint;
    }

    float cos_theta = dot(normalize(sunPosition - pos), normalize(atomsphereEndPoint - atomsphereEntryPoint));
    vec3 offset = (atomsphereEndPoint - atomsphereEntryPoint) * invRayNumberOfPoints;

    vec3 samplePoint = atomsphereEntryPoint; // Maybe there is an error here if the ray is inside the atmosphere;
    float sampleLength = length(offset);

    vec3 sum = vec3(0.0);
    float sampleOpticalDepth = 0.0;
    for (int i = 0; i < uRayNumberOfPoints; i++) {
        vec3 sampleDirection = normalize(sunPosition - samplePoint);

        intersectionRaySphere(samplePoint, sampleDirection, vec3(0.0), uEarthRadius + uAtmosphereHeight, atomsphereEntryPoint, atomsphereEndPoint, behind);
        if (!intersectionRaySphere(samplePoint, sampleDirection, vec3(0.0), uEarthRadius, planetEntryPoint, planetEndPoint, behind) || behind) {
            vec3 light = lightSample(sampleOpticalDepth, samplePoint, atomsphereEndPoint, false) * density(samplePoint);
            sum += light;
        }

        // if (dot(samplePoint, samplePoint) >= uCloudsHeight * uCloudsHeight)
        //     cloudsEntryPoint = samplePoint;
        // else
        //     intersectionRaySphere(samplePoint, sampleDirection, vec3(0.0), uEarthRadius + uCloudsHeight, atomsphereEntryPoint, cloudsEntryPoint, behind);
        
        // sum += lightSample(sampleOpticalDepth, cloudsEntryPoint, atomsphereEndPoint, true) * cloudDensity(cloudsEntryPoint);

        samplePoint += offset;
        sampleOpticalDepth += density(samplePoint) * sampleLength;
    }

    return uSunIntensity * uSunColor * scatteringPhaseFunction(pow(cos_theta, 2.0)) * sum * sampleLength;
}


vec3 getLookingDirection() {
    vec4 clipSpaceCoordinate = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec4 viewSpaceCoordinate = projectionMatrixInverse * clipSpaceCoordinate;
    viewSpaceCoordinate /= viewSpaceCoordinate.w;
    vec4 worldSpaceCoordinates = viewMatrixInverse * viewSpaceCoordinate;

    return normalize(worldSpaceCoordinates.xyz);
}


vec3 atmosphereColor(vec3 sunPosition, vec3 horizonColor) {
    vec3 lookingDirection = getLookingDirection();

    if ((uCameraPosition.y > 0.0 && lookingDirection.y < 0.0) || (uCameraPosition.y < 0.0 && lookingDirection.y > 0.0)) {
        return horizonColor;
    } else if (uCameraPosition.y < 0.0) {
        const vec3 spaceColor = vec3(0.0);
        return horizonColor;
    }

    vec3 pos = vec3(0.0, uEarthRadius, 0.0);
    vec3 sky = intensity(pos, lookingDirection, sunPosition);

    float cos_theta = dot(normalize(sunPosition - pos), lookingDirection);
    if (cos_theta > 0.99) {
        return mix(sky, uSunColor, (cos_theta - 0.99) * (cos_theta - 0.99) * 10000.0);
    }

    return sky;
}


void main() {
    const vec3 oceanColor = vec3(0.0, 0.0, 0.3);
    const vec2 amplitude = vec2(0.001, 0.001);
    const vec2 frequency = vec2(20.0, 20.0);
    const vec2 time_scale = vec2(0.004, 0.004);

    invRayNumberOfPoints = 1.0 / float(uRayNumberOfPoints);

    vec2 uv = distort(vUv, amplitude, frequency, time_scale * vec2(uTime, uTime));
    vec4 diffuse = texture2D(tDiffuse, uv);

    vec3 color = mix(oceanColor, diffuse.rgb, 0.5);

    float depth = texture2D(tDepth, uv).r;

    float dt = fract(uTimeOfDay / 24.0);
    float sunDistance = 149e3;
    float angle = 2.0 * pi * dt;
    vec3 sunPosition = vec3(sunDistance * sin(angle), sunDistance * -cos(angle), 0.0);

    const vec3 farOceanColor = vec3(0.07, 0.07, 0.38);

    float sunIntensity = sunPosition.y / sunDistance;
    if (sunIntensity < 0.0)
        sunIntensity = 0.0;
    vec3 horizonColor = mix(vec3(0.0), farOceanColor, sunIntensity);

    if (isAtmoshepere(depth)) {
        gl_FragColor = vec4(atmosphereColor(sunPosition, horizonColor), 1.0);
        return;
    }
    
    float blur = (1.0 - depth) * (1.0 - sunIntensity);

    color = mix(color, horizonColor, blur);

    gl_FragColor = vec4(color, 1.0);
}