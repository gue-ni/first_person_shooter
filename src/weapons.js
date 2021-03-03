import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { GameObject} from './gameobject.js'
import { Component } from './components.js'

export class SemiAutomaticWeapon extends Component {
	constructor(gameObject, rays){
		super(gameObject);
		this.name = "weapon"
		//let geometry = new THREE.BoxGeometry(0.5, 0.5, 1)
		//let material = new THREE.MeshStandardMaterial({ color: 0xff0051, flatShading: true, metalness: 0, roughness: 1 })
		//let mesh = new THREE.Mesh(geometry, material)

		var model1 = 'assets/downloaded/Ak47.glb'
		var model2 = 'assets/downloaded/m4.glb'
		var model3 = 'assets/downloaded/untitled.glb'
		var model4 = 'assets/ak47.glb'

		this.load(model3)

		/*
		let player = this.gameObject.getComponent("player")
		document.body.addEventListener("mousedown", e => {
			rays[rays.length] = new Ray(this.gameObject.position, player.direction)
		})
		*/	
	}



	async load(path){
		const gltfLoader = new GLTFLoader();
		const gltf = await new Promise((resolve, reject) => {gltfLoader.load(path, data=> resolve(data), null, reject);});
	    let model = gltf.scene;

	    console.log(model)

  	    model.position.set(0.24, -0.7, -0.7)
	    model.rotateY(Math.PI/2)
	    model.scale.set(0.1, 0.1, 0.1)
		this.gameObject.transform.add(model);

	}
}
