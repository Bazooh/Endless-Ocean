varying vec3 worldPosition;
varying vec3 vNormal;
varying float depth;

uniform mat4 model;


void main() {
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}