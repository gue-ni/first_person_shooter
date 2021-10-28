import * as THREE from "three";
import { Component } from "./components.js";

export class FirstPersonCamera extends Component {
	constructor(gameObject, camera) {
		super(gameObject);
		this.camera = camera;
		this._look = new THREE.Vector3();
		this._tmp = new THREE.Vector3();

		this.transform = new THREE.Object3D();
		this.transform.translateY(0.7);
		this.transform.add(this.camera);
		this.gameObject.transform.add(this.transform);
	}

	get position() {
		return this.camera.position;
	}

	update(dt) {
		this.transform.getWorldPosition(this._tmp);
		this._look.subVectors(this._tmp, this.gameObject.direction);
		this.transform.lookAt(this._look);
	}
}

export class Health extends Component {
	constructor(gameObject) {
		super(gameObject);
		this.value = 100;
		this.duration = 4;
		this.counter = 0;

		this.gameObject.subscribe("damage", (event) => {
			this.value -= event;
			if (this.value > 100) {
				this.value = 100;
			}
			if (this.value < 0) {
				this.value = 0;
			}
		});

		this.gameObject.subscribe("spawn", () => {
			this.reset();
		});
	}

	reset() {
		this.value = 100;
	}

	update(dt) {
		if (this.value <= 100) {
			this.counter += dt;
			if (this.counter >= this.duration) {
				this.gameObject.publish("damage", -10);
				this.counter = 0;
			}
		}
	}
}

export class SpawnManager extends Component {
	constructor(gameObject) {
		super(gameObject);
		this.gameObject.subscribe("spawn", (event) => {});

		this.gameObject.subscribe("killed", (event) => {});
	}
}
