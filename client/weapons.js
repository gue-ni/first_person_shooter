//import * as THREE from './three.module.js';
import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { GameObject} from './gameobject.js'
import { Component } from './components.js'
import { BulletRay } from './ray.js'

export class SemiAutomaticWeapon extends Component {
	constructor(gameObject, rays, listener){
		super(gameObject);
		this.name = "SemiAutomaticWeapon"

    	this.light = new THREE.PointLight( 0x000000, 1, 5);
		this.light.position.set(1,0.2,-2)
		this.gameObject.transform.add(this.light)

		let geometry 	= new THREE.BoxBufferGeometry(0.25, 0.5, 1)
		let material 	= new THREE.MeshStandardMaterial({ 
			color: 0xD3D3D3, 
			flatShading: true,
			metalness: 0, 
			roughness: 1 
		});

		this.gun = new THREE.Mesh(geometry, material)
		this.gun.position.set(1,0.2,-1)
		this.gameObject.transform.add(this.gun)

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

        this._fired = false;
        this._flashDuration = 0.05;
        this._flashDurationCounter = 0;
        this._flashStartingScale = new THREE.Vector3(1,1,1);

		const flash1 = new THREE.Mesh(planeGeometry, planeMaterial);
		flash1.rotateY(Math.PI / 2);
        const flash2 = new THREE.Mesh(planeGeometry, planeMaterial);
		flash2.rotateY(Math.PI / 2);
        flash2.rotateX(Math.PI / 2);

        this.flash = new THREE.Object3D();
        this.flash.add(flash1);
        this.flash.add(flash2);
        this.flash.scale.set(0,0,0);
		this.flash.position.set(0.8, 0.2, -1.35);
		this.gameObject.transform.add(this.flash);

        let that = this;
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('assets/audio/gunshot4.mp3', function(buffer) {
            const audio = new THREE.PositionalAudio(listener);
            audio.setBuffer(buffer);
            audio.setRefDistance(20);
            that.gunshot = audio;
            that.gameObject.transform.add(audio);
        });
        
		this._fire = function () {
            this._fired  = true;
			console.log("fire");
            this.flash.scale.copy(this._flashStartingScale);
            
            if (this.gunshot.isPlaying){
                this.gunshot.stop();
                this.gunshot.play();
            } else {
                this.gunshot.play();
            }

            rays[rays.length] = new BulletRay(this.gameObject.position, this.gameObject.direction, this.gameObject)
		}

		document.body.addEventListener("mousedown", e => {
			this._fire()
		});
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
            }
        }
    }
}

export class FullAutoWeapon extends SemiAutomaticWeapon {
    constructor(gameObject, rays, listener, firingRate){
        super(gameObject, rays, listener);
        this.name = "FullAutoWeapon";

        this._duration =  1 / (firingRate / 60)
		this._elapsed  = 0

        document.body.addEventListener("mousedown", e => {
			this._firing = true
		});

		document.body.addEventListener("mouseup", e => {
			this._firing = false
		});
    }

    update(dt){
 		this._elapsed += dt;

		if (this._firing && this._elapsed >= this._duration){
			this._fire()
			this._elapsed = 0
		}      
        
        super.update(dt);
    }
}

export class FullyAutomaticWeapon extends Component {
	constructor(gameObject, rays, firing_rate){
		super(gameObject);
		this.name = "FullyAutomaticWeapon"
		this._firing = false

		this._duration =  1 / (firing_rate / 60)
		this._elapsed  = 0

		//this._load('assets/raygun.glb');

		
		let geometry 	= new THREE.BoxBufferGeometry(0.25, 0.5, 1)
		let material 	= new THREE.MeshStandardMaterial({ color: 0xD3D3D3, flatShading: true, metalness: 0, roughness: 1 })
		this.gun 		= new THREE.Mesh(geometry, material)
		this.gun.position.set(1,0.2,-1.7)
		this.gameObject.transform.add(this.gun)
		

		
		document.body.addEventListener("mousedown", e => {
			this._firing = true
		});

		document.body.addEventListener("mouseup", e => {
			this._firing = false
		});

		this._fire = function () {
			rays[rays.length] = new BulletRay(this.gameObject.position, this.gameObject.direction, this.gameObject)
		}
	}
	
	async _load(path){
		const gltfLoader 	= new GLTFLoader();
		const gltf 			= await new Promise((resolve, reject) => {
			gltfLoader.load(path, data=> resolve(data), null, reject);
		});
	    this.gun 			= gltf.scene;
  	    this.gun.position.set(0.6, 0.4, -0.7)
	    this.gun.rotateY(Math.PI/2)
	    this.gun.scale.set(0.1, 0.1, 0.1)
		this.gameObject.transform.add(this.gun);
	}

	update(dt){
		this._elapsed += dt;

		if (this._firing && this._elapsed >= this._duration){
			this._fire()
			this._elapsed = 0
		}

		//this.gun.lookAt(0,0,0)
	}
}