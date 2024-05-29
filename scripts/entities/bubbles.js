import * as THREE from 'three';
import { Entity } from "./entity.js";

export class Bubble extends Entity {
    constructor(position, direction, speed, lifetime) {
        super(position, direction);
        this.speed = speed;
        this.lifetime = lifetime;
        this.time = 0;
    }

    update(delta_time) {
        this.position = this.position.addScaledVector(this.direction, this.speed * delta_time);

        this.time += delta_time;
        if (this.time > this.lifetime) {
            this.remove();
        }
    }

    loadModel() {
        const geometry = new THREE.SphereGeometry(0.02*Math.random() + 0.02, 32, 32);
        const material = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.5});
        this.model = new THREE.Mesh(geometry, material);

        this.model.position.set(...this.position);
    }
}