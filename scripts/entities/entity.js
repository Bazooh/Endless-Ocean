import * as THREE from 'three';


const entities = [];


export function updateEntities() {
    entities.forEach((entity) => {
        entity.requireUpdate();
    });
}


export class Entity {
    constructor(starting_position) {
        this.position = starting_position;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.prev_time = performance.now();

        entities.push(this);
    }

    get position() {
        return this._position;
    }

    set position(new_position) {
        this._position = new_position;
    }

    update(deltaTime) {}

    requireUpdate() {
        const current_time = performance.now();
        const deltaTime = (current_time - this.prev_time) / 1000;
        this.prev_time = current_time;

        this.update(deltaTime);
    }
}