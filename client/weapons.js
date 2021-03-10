//import * as THREE from './three.module.js';
import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { GameObject} from './gameobject.js'
import { Component } from './components.js'
import { BulletRay } from './ray.js'
import { Smoke } from './particles.js';

export class Inventory extends Component {
    constructor(gameObject){
        super(gameObject);
        this.weapons = [];
        this._active = 0; 

        document.addEventListener("keydown", (event) => {
            switch (event.keyCode) {
                case 69: // e
                    console.log("switch gun")
                    //this._active = (this._active + 1) % this.weapons.length;  
                    break;
            }
        });
    }

    remove(){
        for (let weapon of this.weapons){
            weapon.remove();
            weapon = undefined;
        }

        this.weapons = undefined;
    }

    update(dt){
        if (this.weapons) this.weapons[this._active].update(dt);
    }

    // TODO add cycle through weapons
}

export class Weapon extends Component {
	constructor(gameObject, rays, listener){
		super(gameObject);
		this.name = "Weapon"

        this._damage = 5;

        this._weaponPosition = new THREE.Vector3(0.2, 0.3, -0.1)
        this._muzzlePosition = new THREE.Vector3(0.2, 0.3, -1.6);
        this._fired = false;
        this._flashDuration = 0.05;
        this._flashDurationCounter = 0;
        this._flashStartingScale = new THREE.Vector3(1.5,1.5,1.5);

        this._reloading = false;
        this._reloadTime = 2;
        this._reloadTimeCounter = 0;
        this._ammoCapacity = 45;
        this._ammo = this._ammoCapacity;
        this._ammoDisplay = document.querySelector('#ammo');
        this._ammoDisplay.innerText = this._ammo;

        // load gun model
        (async () => {
            const gltfLoader 	= new GLTFLoader();
            const gltf 			= await new Promise((resolve, reject) => {
                gltfLoader.load('./assets/AUG_A++.glb', data=> resolve(data), null, reject);
            });
            this.gun = gltf.scene;
            this.gun.position.copy(this._weaponPosition);
            this.gun.rotateY(-Math.PI/2);
            this.gun.scale.set(0.1, 0.1, 0.1)
            this.gameObject.transform.add(this.gun);
        })();

        // muzzle flash light
        this.light = new THREE.PointLight(0x000000, 1, 5);
		this.light.position.set(1,0.2,-2)
		this.gameObject.transform.add(this.light)

        // muzzle flash texture
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
		this.flash.position.copy(this._muzzlePosition);
		this.gameObject.transform.add(this.flash);

        // gunshot
        /*
        let that = this;
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('./assets/audio/used/machine_gun_edited.mp3', function(buffer) {
            const audio = new THREE.PositionalAudio(listener);
            audio.setBuffer(buffer);
            audio.setRefDistance(1);
            that.gunshot = audio;
        });
        */

        (async () => {
            const audioLoader = new THREE.AudioLoader();
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load('./assets/audio/used/machine_gun_edited.mp3', data => resolve(data), null, reject);
            });
            this.gunshot = new THREE.PositionalAudio(listener);
            this.gunshot.setBuffer(buffer);
            this.gunshot.setRefDistance(1);
            this.gunshot.position.copy(this._muzzlePosition);
            this.gameObject.transform.add(this.gunshot);
        })();

		this._fire = function(){
            if (this._ammo <= 0 || this._reloading) return;
            this.smoke.active   = true;
            this._fired         = true;
            this.flash.scale.copy(this._flashStartingScale);
            this._ammoDisplay.innerText = --this._ammo;
            
            if (this.gunshot.isPlaying){
                this.gunshot.stop();
                this.gunshot.play();
            } else {
                this.gunshot.play();
            }
            rays[rays.length] = new BulletRay(this.gameObject.position, this.gameObject.direction, this.gameObject, this._damage);
		}

        document.addEventListener("keydown", (event) => {
            switch (event.keyCode) {
                case 82: // r
                    // reload
                    this._reloading = true;
                    this._ammoDisplay.innerText = "reloading"
                    break;
            }
        })
	}

    remove(){
        this.gun.children.forEach( child => { 
            if (child.geometry){
                child.geometry.dispose();
            }
            if (child.material){
                child.material.dispose();
            }
        });
        this.gun.parent.remove(this.gun)

        this.flash.children.forEach( child => {
             if (child.geometry){
                child.geometry.dispose();
            }
            if (child.material){
                child.material.dispose();
            }
        })      
        this.flash.parent.remove(this.flash)

        this.gunshot.parent.remove(this.gunshot)
        this.gunshot = undefined;

        this.light.parent.remove(this.light);

        if (this.smoke){
            this.smoke.remove();
        }
    }

    update(dt){
        //this.gunshot.position.copy(this._muzzlePosition);
        //console.log(this.gunshot.position.x)

        if (this._fired && this._flashDurationCounter <= this._flashDuration){
            
            this.flash.scale.multiplyScalar(1.7)
            this.light.color.setHex(0xffffff);
            this._flashDurationCounter += dt;

            if (this._flashDurationCounter > this._flashDuration){
                this._fired = false;
                this._flashDurationCounter = 0;
                this.flash.scale.set(0,0,0);
                this.light.color.setHex(0x000000);
                this.smoke.active = false;
            }
        }

        if (this._reloading && this._reloadTimeCounter <= this._reloadTime){
            this._reloadTimeCounter += dt;
            if (this._reloadTimeCounter > this._reloadTime){
                this._reloading = false;
                this._reloadTimeCounter = 0;
                this._ammo = this._ammoCapacity; 
                this._ammoDisplay.innerText = this._ammo;
            }
        }

        this.smoke._source.copy(this.flash.localToWorld(this._muzzlePosition));
        this.smoke.update(dt);
    }
}

export class SemiAutomaticWeapon extends Weapon {
    constructor(gameObject, rays, listener){
        super(gameObject, rays, listener);
        this.handler = this._fire.bind(this);
        document.body.addEventListener("mousedown", this.handler, false);
    }

    remove(){
        console.log("remove")
        document.body.removeEventListener("mousedown", this.handler, false);
        super.remove();
    }
}

export class FullAutoWeapon extends Weapon {
    constructor(gameObject, rays, listener, firingRate){
        super(gameObject, rays, listener);
        this.name = "FullAutoWeapon";

        this._duration =  1 / (firingRate / 60)
		this._elapsed  = 0

        function toggleFiring(){
            this._firing = !this._firing;
        }
        this._toggleFiringHandler = toggleFiring.bind(this);
        
        document.body.addEventListener("mousedown", this._toggleFiringHandler, false);
        document.body.addEventListener("mouseup",   this._toggleFiringHandler, false);
    }

    remove(){
        document.body.removeEventListener("mousedown",  this._toggleFiringHandler, false);
        document.body.removeEventListener("mouseup",    this._toggleFiringHandler, false);
        super.remove()
    }

    update(dt){
        //console.log("update")

        this._elapsed += dt;

		if (this._firing && this._elapsed >= this._duration){
            //console.log("firing")
			this._fire()
			this._elapsed = 0
		}      
        
        super.update(dt);
    }
}
