import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";
import { BulletRay } from "./ray.js";

// emitts bullet rays
export class HitscanEmitter {
    constructor(bullets){
        this.bullets = bullets;
        this._rotation = new THREE.Quaternion();
        this._origin = new THREE.Vector3();
    }

    emit(origin, direction){
        console.log(`new hitscan`)   
        this.bullets[this.bullets.length] = new BulletRay(origin, direction, 1, 1);
    }

    emitFromTransform(transform){
        transform.getWorldQuaternion(this._rotation);
        const dir = new THREE.Vector3(0,0,-1);
        dir.applyQuaternion(this._rotation);
        transform.getWorldPosition(this._origin);
        this._emitter.emit(this._origin, dir);
        //console.log("emit")
    }
}

export class ProjectileEmitter {
}

// light and flash texture
export class MuzzleFlash extends Component {
    constructor(gameObject){
        super(gameObject);
        //this.name = "muzzleFlash"

        /*
        this._flashDuration = 0.05;
        this._flashDurationCounter = 0;
        this._flashStartingScale = new THREE.Vector3(1.5,1.5,1.5);


		const planeGeometry = new THREE.PlaneGeometry(1, 1, 1);
        planeGeometry.translate(0.5, 0, 0)
		const planeMaterial = new THREE.MeshBasicMaterial({
			map:            new THREE.TextureLoader().load('assets/textures/flash.png'), 
			side:           THREE.DoubleSide, 
			opacity: 		0.5,
			transparent: 	true,
			depthTest: 		true,
			depthWrite: 	false,
			blending: THREE.AdditiveBlending,
		});

		const flash1 = new THREE.Mesh(planeGeometry, planeMaterial);
		flash1.rotateY(Math.PI / 2);
        const flash2 = new THREE.Mesh(planeGeometry, planeMaterial);
		flash2.rotateY(Math.PI / 2);
        flash2.rotateX(Math.PI / 2);

        this.flash = new THREE.Object3D();
        this.flash.add(flash1);
        this.flash.add(flash2);
        this.flash.scale.set(0,0,0);
		//this.flash.position.copy(this._muzzlePosition);
		this.gameObject.transform.add(this.flash);
        */

    }

    start(){
        //this.flash.scale.copy(this._flashStartingScale);
        console.log("start flash")
    }

    update(dt){
        /*
        if (this.gameObject.fired && this._flashDurationCounter <= this._flashDuration){
            
            this.flash.scale.multiplyScalar(1.7)
            //this.light.color.setHex(0xffffff);
            this._flashDurationCounter += dt;

            if (this._flashDurationCounter > this._flashDuration){
                this._fired = false;
                this._flashDurationCounter = 0;
                this.flash.scale.set(0,0,0);

                //this.light.color.setHex(0x000000);
                
                if (this.smoke) this.smoke.active = false;
            }
        }
        */
    }
} 

export class WeaponController extends Component {
    constructor(gameObject, input, bulletEmitter){
        super(gameObject);
        this._input = input;
        this.active = true;
        this._emitter = bulletEmitter;


        this._rotation = new THREE.Quaternion();
        this._origin = new THREE.Vector3();

        this._ammo = 100;
        this._reloading = false;
    }

    fire(){
        if (this._ammo <= 0 || this._reloading) return;

        this._ammo--;
        this._fired = true;
        this.gameObject.fired = true;

        if (this._emitter){
            //this.gameObject.transform.getWorldQuaternion(this._rotation);
            //const dir = new THREE.Vector3(0,0,-1);
            //dir.applyQuaternion(this._rotation);
            //this.gameObject.transform.getWorldPosition(this._origin);
            //this._emitter.emit(this._origin, dir);
            this._emitter.emitFromTransform(this.gameObject.transform);
        }
    }

    update(dt){
        if (this._input.firing && this.active){
            this.fire();
        }
    }
}



