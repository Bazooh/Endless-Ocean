import * as THREE from 'three';

const forward = new THREE.Vector3(0,0,-1);


export const camera_param = {
    updateCamera: true,
    followSpeed: 1,
    offset: {
        x: 0,
        y: 5,
        z: 5,
    },
    lookPosition: {
        x: 0,
        y: 0,
        z: -2,
    }
}

export function updateCameraGUI(gui, controls, player) {
    const folder = gui.addFolder('Camera');
    folder.add(camera_param, 'updateCamera').name("Update Camera").onChange(() => {controls.target.set(player.position.x, player.position.y, player.position.z); controls.update();});
    folder.add(camera_param, 'followSpeed', 0.1, 5, 0.1).name("Follow Speed");

    const offsetFolder = folder.addFolder('Offset');
    offsetFolder.add(camera_param.offset, 'x').name("Offset X");
    offsetFolder.add(camera_param.offset, 'y').name("Offset Y");
    offsetFolder.add(camera_param.offset, 'z').name("Offset Z");

    const lookFolder = folder.addFolder('Look Position');
    lookFolder.add(camera_param.lookPosition, 'x').name("Offset X");
    lookFolder.add(camera_param.lookPosition, 'y').name("Offset Y");
    lookFolder.add(camera_param.lookPosition, 'z').name("Offset Z");
}

var player;

export class FollowCamera {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        this.position = new THREE.Vector3();
        this.lookPos = new THREE.Vector3();

        this.position.copy(this.getTargetPosition());
        this.lookPos.copy(this.getTargetLookPos());
    }


    getTargetPosition() {
        var offset =  new THREE.Vector3(camera_param.offset.x, camera_param.offset.y, camera_param.offset.z);
        offset.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, this.player.direction));
        return this.player.position.clone().add(offset);
    }

    getTargetLookPos() {
        var lookPos = new THREE.Vector3(camera_param.lookPosition.x, camera_param.lookPosition.y, camera_param.lookPosition.z);
        lookPos.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, this.player.direction));
        return this.player.position.clone().add(lookPos);
    }

    update(delta_time) {
        
        var targetPosition = this.getTargetPosition();
        var targetLookPos = this.getTargetLookPos();

        var scaledDelta = 1.0 - Math.pow(0.001, delta_time);

        this.position.lerp(targetPosition, camera_param.followSpeed * (scaledDelta));
        this.lookPos.copy(targetLookPos, camera_param.followSpeed * (scaledDelta));

        if (!camera_param.updateCamera) return;

        this.camera.position.copy(this.position);
        this.camera.lookAt(this.lookPos);
    }
}