import * as THREE from 'three';


const entities = [];

export const forward = new THREE.Vector3(0, 0, -1);


export function updateEntities() {
    entities.forEach((entity) => {
        entity.requireUpdate();
    });
}


export class Entity {

    get direction() {return this._direction;}

    set direction(new_direction) {
        this._direction = new_direction;
        if (this.model != null)
            this.model.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(forward, this.direction));
    }

    constructor(starting_position, starting_direction, scene) {
        this.direction = starting_direction;
        this.position = starting_position;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.prev_time = performance.now();
        this.scene = scene;
        
        entities.push(this);

        this.modelLoaded = false;
        this.loadModel();
        this.addToScene();
    }

    get position() {
        return this._position;
    }

    set position(new_position) {
        this._position = new_position;
        if (this.model != null) this.model.position.set(...this.position);
    }

    loadModel() {this.model = null;}

    addToScene() {
        if (this.model != null) {
            this.scene.add(this.model);
        }
       
    }

    update(delta_time) {}

    requireUpdate() {
        const current_time = performance.now();
        const deltaTime = (current_time - this.prev_time) / 1000;
        this.prev_time = current_time;

        this.update(deltaTime);
    }
}