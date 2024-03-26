import * as THREE from 'three';

const forward = new THREE.Vector3(0,0,-1);

var raycaster = new THREE.Raycaster();
var dir = new THREE.Vector3;
var far = new THREE.Vector3;

const offsetPastWall = 0.2;
const hidePlayerDistance = 1.5;



export const camera_param = {
    updateCamera: true,
    followSpeed: 1,
    offset: {
        x: 0,
        y: 4,
        z: 6,
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

    const positionFolder = folder.addFolder('Position Offset');
    positionFolder.add(camera_param.offset, 'x', -10, 10, 1).name("Position X");
    positionFolder.add(camera_param.offset, 'y', -10, 10, 1).name("Position Y");
    positionFolder.add(camera_param.offset, 'z',  0, 10, 1).name("Position Z");

    const lookFolder = folder.addFolder('Look Offset');
    lookFolder.add(camera_param.lookPosition, 'x', -10, 10, 1).name("Offset X");
    lookFolder.add(camera_param.lookPosition, 'y', -10, 10, 1).name("Offset Y");
    lookFolder.add(camera_param.lookPosition, 'z', -10, 0, 1).name("Offset Z");
}

export class FollowCamera {
    constructor(camera, player, scene) {
        this.camera = camera;
        this.player = player;
        this.position = new THREE.Vector3();
        this.lookPos = new THREE.Vector3();
        this.scene = scene;

        this.position.copy(this.getTargetPosition());
        this.lookPos.copy(this.getTargetLook());
    }


    getTargetPosition() {
        var offset =  new THREE.Vector3(camera_param.offset.x, camera_param.offset.y, camera_param.offset.z);
        offset.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, this.player.direction));
        return this.player.position.clone().add(offset);
    }

    getTargetLook() {
        var lookPos = new THREE.Vector3(camera_param.lookPosition.x, camera_param.lookPosition.y, camera_param.lookPosition.z);
        lookPos.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(forward, this.player.direction));
        return this.player.position.clone().add(lookPos);
    }

    update(delta_time) {
        
        var targetPosition = this.getTargetPosition();
        var targetLook = this.getTargetLook();

        var scaledDelta = 1.0 - Math.pow(0.001, delta_time);

        this.position.lerp(targetPosition, camera_param.followSpeed * (scaledDelta));
        this.lookPos.copy(targetLook, camera_param.followSpeed * (scaledDelta));

        if (!camera_param.updateCamera) return;

        var distancePastWall = this.distancePastWall();
        if (distancePastWall > 0) {
            
           var cameraToPlayerVector = dir.subVectors(this.player.position, this.position);
           var move = cameraToPlayerVector.normalize().multiplyScalar(distancePastWall + offsetPastWall);
           var newPos = this.position.clone().add(move);

           var distanceToPlayer = newPos.distanceTo(this.player.position);
           this.player.setTransparent(distanceToPlayer < hidePlayerDistance);

           this.camera.position.copy(newPos);
        }
        else {
            this.player.setTransparent(false);
            this.camera.position.copy(this.position);
        }
       
        this.camera.lookAt(this.lookPos);
        
    }

    distancePastWall() {
        raycaster.set(this.position, dir.subVectors(this.player.position, this.position).normalize());
        raycaster.far = far.subVectors(this.position, this.player.position).length();
        raycaster.layers.set(1);
        var intersects = raycaster.intersectObjects(this.scene.children, true) ;
        if (intersects.length > 0) {
            return intersects[intersects.length - 1].distance;
        }
        return 0;
    }
}