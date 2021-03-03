import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { GameObject} from './gameobject.js'
import { Component } from './components.js'
import { BulletRay } from './ray.js'

export class SemiAutomaticWeapon extends Component {
	constructor(gameObject, rays){
		super(gameObject);
		this.name = "SemiAutomaticWeapon"

		var model1 = 'assets/downloaded/Ak47.glb'
		var model2 = 'assets/downloaded/m4.glb'
		var model3 = 'assets/downloaded/untitled.glb'
		var model4 = 'assets/ak47.glb'
		//this.load(model3)
		
		document.body.addEventListener("mousedown", e => {
			rays[rays.length] = new BulletRay(this.gameObject.position, this.gameObject.direction, this.gameObject)
		});
	}

	async _load(path){
		const gltfLoader 	= new GLTFLoader();
		const gltf 			= await new Promise((resolve, reject) => {
			gltfLoader.load(path, data=> resolve(data), null, reject);
		});
	    let model 			= gltf.scene;

	    //console.log(model)

  	    model.position.set(0.24, -0.7, -0.7)
	    model.rotateY(Math.PI/2)
	    model.scale.set(0.1, 0.1, 0.1)
		this.gameObject.transform.add(model);

	}
}


export class FullyAutomaticWeapon extends Component {
	constructor(gameObject, rays, firing_rate){
		super(gameObject);
		this.name = "FullyAutomaticWeapon"
		this._firing = false

		this._duration =  1 / (firing_rate / 60)
		this._elapsed  = 0
		
		document.body.addEventListener("mousedown", e => {
			this._firing = true
		});

		document.body.addEventListener("mouseup", e => {
			this._firing = false
		});

		this._fire = function () {
			//console.log("fire")
			rays[rays.length] = new BulletRay(this.gameObject.position, this.gameObject.direction, this.gameObject)
		}
	}

	update(dt){
		this._elapsed += dt;

		if (this._firing && this._elapsed >= this._duration){
			this._fire()
			this._elapsed = 0
		}
	}
}