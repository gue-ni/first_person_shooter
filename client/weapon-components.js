import * as THREE from "three";

import { Component, Physics, Box } from "./components.js";
import { GameObject } from "./game-object.js";
import { AABB } from "./collision.js";

export class BulletRay extends THREE.Ray {
	constructor(origin, direction, owner, damage) {
		super(origin, direction);
		this.owner = owner;
		this.damage = damage;
	}
}

export class HitscanEmitter extends Component {
	constructor(gameObject, bullets, owner) {
		super(gameObject);

		this._owner = owner;
		this.bullets = bullets;
		this._rotation = new THREE.Quaternion();
		this._origin = new THREE.Vector3();

		this.gameObject.subscribe("fire", (e) => {
			this.emitFromTransform(e.transform);
		});
	}

	emit(origin, direction) {
		this.bullets[this.bullets.length] = new BulletRay(origin, direction, this._owner, 20);
	}

	emitFromTransform(transform) {
		transform.getWorldQuaternion(this._rotation);
		const dir = new THREE.Vector3(0, 0, -1);
		dir.applyQuaternion(this._rotation);
		transform.getWorldPosition(this._origin);

		this.emit(this._origin, dir);
	}
}

export class ProjectileEmitter extends HitscanEmitter {
	constructor(gameObject, projectiles, factory) {
		super(gameObject, projectiles);
		//this.gameObjectArray = gameObjectArray;
		this.factory = factory;
		this._speed = 30;
	}

	emit(origin, direction) {
		let projectile = this.factory.createProjectile(this.factory.network);
		projectile.velocity.copy(direction.clone().multiplyScalar(this._speed));
		projectile.position.copy(origin);
	}
}

export class Inventory extends Component {
	constructor(gameObject, primary, secondary) {
		super(gameObject);
		this.primary = primary;
		this.secondary = secondary;

		this.primary.active = true;
		this.primary.transform.visible = true;

		this.secondary.active = false;
		this.secondary.transform.visible = false;

		this.gameObject.subscribe("toggleGun", (e) => {
			this.toggle(this.primary);
			this.toggle(this.secondary);
		});
	}

	toggle(gun) {
		gun.transform.visible = !gun.transform.visible;
		gun.active = !gun.active;
	}
}

export class Explosive extends Component {
	constructor(gameObject, explosions) {
		super(gameObject);
		this.explosions = explosions;

		this.gameObject.subscribe("collision", () => {
			this.gameObject.lifetime = 0;
		});

		this.gameObject.subscribe("destroy", () => {
			this.explosions.push(this.gameObject.position.clone());
		});
	}
}

export class MuzzleFlash extends Component {
	constructor(gameObject, muzzlePosition, listener, smoke) {
		super(gameObject);

		this._muzzlePosition = muzzlePosition;

		this.gameObject.subscribe("fire", (e) => this.start());

		this._fired = false;
		this._flashDuration = 0.06;
		this._flashDurationCounter = 0;
		this._flashStartingScale = new THREE.Vector3(0.5, 0.5, 0.5);

		// muzzle flash light
		this.light = new THREE.PointLight(0x000000, 1, 5);
		this.light.position.copy(this._muzzlePosition);
		this.gameObject.transform.add(this.light);

		this.smoke = smoke;
		this.smoke.active = false;

		const planeGeometry = new THREE.PlaneGeometry(1, 1, 1);
		planeGeometry.translate(0.5, 0, 0);
		const planeMaterial = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load("assets/textures/flash.png"),
			side: THREE.DoubleSide,
			opacity: 0.5,
			transparent: true,
			depthTest: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});

		const flash1 = new THREE.Mesh(planeGeometry, planeMaterial);
		const flash2 = new THREE.Mesh(planeGeometry, planeMaterial);
		flash2.rotateX(Math.PI / 2);

		this.flash = new THREE.Object3D();
		this.flash.add(flash1);
		this.flash.add(flash2);
		this.flash.scale.set(0, 0, 0);

		this.flash.rotateY(Math.PI / 2);
		this.flash.position.copy(this._muzzlePosition);

		this.gameObject.transform.add(this.flash);

		// gunshot
		(async () => {
			const audioLoader = new THREE.AudioLoader();
			const buffer = await new Promise((resolve, reject) => {
				audioLoader.load("./assets/audio/machine_gun_edited.mp3", (data) => resolve(data), null, reject);
			});
			this.gunshot = new THREE.PositionalAudio(listener);
			this.gunshot.setBuffer(buffer);
			this.gunshot.setRefDistance(20);
			this.gunshot.position.copy(this._muzzlePosition);
			this.gameObject.transform.add(this.gunshot);
		})();
	}

	start() {
		this._fired = true;

		this.flash.scale.copy(this._flashStartingScale);

		if (this.smoke) this.smoke.active = true;

		if (this.gunshot) {
			if (this.gunshot.isPlaying) {
				this.gunshot.stop();
				this.gunshot.play();
			} else {
				this.gunshot.play();
			}
		}
	}

	update(dt) {
		if (this._fired && this._flashDurationCounter <= this._flashDuration) {
			this.flash.scale.multiplyScalar(1.7);
			this.light.color.setHex(0xffffff);
			this._flashDurationCounter += dt;

			if (this._flashDurationCounter > this._flashDuration) {
				this._fired = false;
				this._flashDurationCounter = 0;
				this.flash.scale.set(0, 0, 0);

				this.light.color.setHex(0x000000);

				if (this.smoke) this.smoke.active = false;
			}
		}

		if (this.smoke) {
			this.smoke._source.copy(this.flash.localToWorld(this._muzzlePosition));
			this.smoke.update(dt);
		}
	}
}

export class WeaponController extends Component {
	constructor(gameObject, rpm = 620, capacity = 30) {
		super(gameObject);

		this.active = true;

		this._firing = false;

		this._reloading = false;
		this._reloadTime = 2;
		this._reloadTimeCounter = 0;
		this._ammo = this._fullAmmoCapacity = capacity;

		this.gameObject.subscribe("reload", (event) => {
			if (this.gameObject.active && !event.finished) {
				this._reloading = true;
			}
		});

		this.gameObject.subscribe("trigger", (event) => {
			if (this.gameObject.active) {
				this._firing = event.firing;
			}
		});

		this.gameObject.subscribe("spawn", (event) => {
			this._ammo = this._fullAmmoCapacity;
			this._firing = false;
			if (this.gameObject.active) this.gameObject.publish("ammo", this._ammo);
		});

		this.gameObject.subscribe("toggleGun", () => {
			this.gameObject.active = !this.gameObject.active;
			this.gameObject.transform.visible = !this.gameObject.transform.visible;
			if (this._firing) this._firing = false;

			if (this.gameObject.active) {
				this.gameObject.publish("ammo", this._ammo);
			}
		});

		this._duration = 1 / (rpm / 60);
		this._elapsed = 0;
	}

	fire() {
		if (this._ammo <= 0 || this._reloading) return;
		this._ammo--;
		this.gameObject.publish("fire", { transform: this.gameObject.transform });
		this.gameObject.publish("ammo", this._ammo);
	}

	update(dt) {
		this._elapsed += dt;
		if (this._firing && this._elapsed >= this._duration) {
			this.fire();
			this._elapsed = 0;
		}

		if (this._reloading && this._reloadTimeCounter <= this._reloadTime) {
			this._reloadTimeCounter += dt;

			if (this._reloadTimeCounter > this._reloadTime) {
				this._reloading = false;
				this._reloadTimeCounter = 0;
				this._ammo = this._fullAmmoCapacity;
				this.gameObject.publish("reload", { ammo: this._fullAmmoCapacity, finished: true });
			}
		}
	}
}
