import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";
import { BulletRay } from "./ray.js";

// emitts bullet rays
export class HitscanEmitter extends Component {
    constructor(gameObject, bullets){
        super(gameObject);

        this.bullets = bullets;
        this._rotation = new THREE.Quaternion();
        this._origin = new THREE.Vector3();

        this.gameObject.subscribe("fire", (e) => {
            this.emitFromTransform(e.transform);
        })
    }

    emit(origin, direction){
        this.bullets[this.bullets.length] = new BulletRay(origin, direction, 1, 1);
    }

    emitFromTransform(transform){
        transform.getWorldQuaternion(this._rotation);
        const dir = new THREE.Vector3(0,0,-1);
        dir.applyQuaternion(this._rotation);
        transform.getWorldPosition(this._origin);
    
        this.emit(this._origin, dir);
    }
}

export class ProjectileEmitter {
}

// light and flash texture
export class MuzzleFlash extends Component {
    constructor(gameObject, muzzlePosition, listener){
        super(gameObject);

        this._muzzlePosition = muzzlePosition;

        this.gameObject.subscribe("fire", (e) => this.start());

        this._fired = false;
        this._flashDuration = 0.06;
        this._flashDurationCounter = 0;
        this._flashStartingScale = new THREE.Vector3(1.5,1.5,1.5);

        // muzzle flash light
        this.light = new THREE.PointLight(0x000000, 1, 5);
        this.light.position.copy(this._muzzlePosition)
		this.gameObject.transform.add(this.light)


		const planeGeometry = new THREE.PlaneGeometry(1,1,1);
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
        const flash2 = new THREE.Mesh(planeGeometry, planeMaterial);
        flash2.rotateX(Math.PI / 2);

        this.flash = new THREE.Object3D();
        this.flash.add(flash1);
        this.flash.add(flash2);
        this.flash.scale.set(0,0,0);
        
        this.flash.rotateY(Math.PI / 2)
		this.flash.position.copy(this._muzzlePosition)

		this.gameObject.transform.add(this.flash);

        // gunshot
        (async () => {
            const audioLoader = new THREE.AudioLoader();
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load('./assets/audio/used/machine_gun_edited.mp3', data => resolve(data), null, reject);
            });
            this.gunshot = new THREE.PositionalAudio(listener);
            this.gunshot.setBuffer(buffer);
            this.gunshot.setRefDistance(20);
            this.gunshot.position.copy(this._muzzlePosition);
            this.gameObject.transform.add(this.gunshot);
        })();




    }

    start(){
        this._fired = true;
        
        this.flash.scale.copy(this._flashStartingScale);

        if (this.gunshot.isPlaying){
            this.gunshot.stop();
            this.gunshot.play();
        } else {
            this.gunshot.play();
        }
    }

    update(dt){
        if (this._fired && this._flashDurationCounter <= this._flashDuration){
            
            this.flash.scale.multiplyScalar(1.7)
            this.light.color.setHex(0xffffff);
            this._flashDurationCounter += dt;

            if (this._flashDurationCounter > this._flashDuration){
                this._fired = false;
                this._flashDurationCounter = 0;
                this.flash.scale.set(0,0,0);

                this.light.color.setHex(0x000000);
                
                if (this.smoke) this.smoke.active = false;
            }
        }
    }
} 

export class WeaponController extends Component {
    constructor(gameObject, input){
        super(gameObject);
        this._input = input;
        this.active = true;

        this._rotation  = new THREE.Quaternion();
        this._origin    = new THREE.Vector3();

        this._ammo = 100;
        this._reloading = false;

        this._duration =  1 / (620 / 60)
		this._elapsed  = 0
    }

    fire(){
        if (this._ammo <= 0 || this._reloading) return;

        this._ammo--;

        console.log("fire")

        this.gameObject.publish("fire", { transform: this.gameObject.transform })
    }

    update(dt){
        //if (this._input.firing && this.active){
        //    this.fire();
        //}

        this._elapsed += dt;
		if (this._input.firing && this._elapsed >= this._duration){
			this.fire()
			this._elapsed = 0
		}
    }
}



