//import * as THREE from './three.module.js';
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
	    this.mesh 			= gltf.scene;

	    //console.log(this.mesh)

  	    this.mesh.position.set(0.24, -0.7, -0.7)
	    this.mesh.rotateY(Math.PI/2)
	    this.mesh.scale.set(0.1, 0.1, 0.1)
		this.gameObject.transform.add(this.mesh);

	}
}


export class FullyAutomaticWeapon extends Component {
	constructor(gameObject, rays, firing_rate){
		super(gameObject);
		this.name = "FullyAutomaticWeapon"
		this._firing = false

		this._duration =  1 / (firing_rate / 60)
		this._elapsed  = 0

		let geometry 	= new THREE.BoxBufferGeometry(0.25, 0.5, 1)
		let material 	= new THREE.MeshStandardMaterial({ color: 0xD3D3D3, flatShading: true, metalness: 0, roughness: 1 })
		this.mesh 		= new THREE.Mesh(geometry, material)
		this.mesh.position.set(1,0.2,-1.7)
		this.gameObject.transform.add(this.mesh)


		
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

		//this.mesh.lookAt(0,0,0)
	}
}