import * as THREE from 'three';
import { updateChunksShaderUniforms } from './chunk.js';
import { forward } from './entities/entity.js';


export function getLightUniforms(player) {
    return {
        uLightPos: player?.position,
        uLightIntensity:  light_param.intensity,
        uLightColor: new THREE.Color(light_param.color),
        uLightDir: getLightDirection(player?.direction || forward),
        uLightAngle: light_param.angle
    };
}


export const light_param = {
    intensity: 100.0,
    color: 0xffffff,
    direction_theta: 2.2,
    direction_phi: Math.PI,
    angle: 1.0
}


export function getLightDirection(base_direction) {
    const theta = light_param.direction_theta;
    const phi = light_param.direction_phi - Math.acos(forward.dot(base_direction))*Math.sign(base_direction.x);

    return new THREE.Vector3(
        Math.sin(phi) * Math.sin(theta),
        Math.cos(theta),
        Math.cos(phi) * Math.sin(theta)
    );
}


export function updateLightGUI(gui, player) {
    const folder = gui.addFolder('Light');
    folder.add(light_param, 'intensity', 0.0, 500.0, 1.0).name("Intensity").onChange(() => updateChunksShaderUniforms({'uLightIntensity': light_param.intensity}));
    folder.add(light_param, 'angle', 0.0, 1.5, 0.01).name("Angle").onChange(() => updateChunksShaderUniforms({'uLightAngle': light_param.angle}));


    folder.addColor(light_param, 'color').name("Color").onChange(() => updateChunksShaderUniforms({'uLightColor': new THREE.Color(light_param.color)}));
    const direction_folder = folder.addFolder('Direction');
    direction_folder.add(light_param, 'direction_theta', 0, Math.PI, 0.1).name("Theta").onChange(player.updateLightDirection);
    direction_folder.add(light_param, 'direction_phi', 0, 2*Math.PI, 0.1).name("Phi").onChange(player.updateLightDirection);
}