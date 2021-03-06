import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

import { GameObject} from './gameobject.js'

export class Component {
	constructor(gameObject){
		this.gameObject = gameObject
		this.name = "component"
	}
	update(dt){}
	remove(){}
}

export class Box extends Component {
	constructor(gameObject, size, box_color, castShadow, receiveShadow){
		super(gameObject)
		this.name = "box"
		let geometry 	= new THREE.BoxBufferGeometry(size.x, size.y, size.z)
		let material 	= new THREE.MeshStandardMaterial({ 
			color: box_color, 
			flatShading: true, 
			emissive: 0xffffff, 
			emissiveIntensity: 0,
			roughness: 0.5
		});
		this.mesh 		= new THREE.Mesh(geometry, material)
		this.mesh.castShadow 	= castShadow
		this.mesh.receiveShadow = receiveShadow
		this.gameObject.transform.add(this.mesh)
	}

	remove(){
		this.mesh.geometry.dispose()
		this.mesh.material.dispose()
		this.mesh.parent.remove(this.mesh)
	}
}


export class Gravity extends Component {
	constructor(gameObject){
		super(gameObject)
		this.name = "gravity"
	}

	update(dt){
		this.gameObject.position.add(this.gameObject.velocity.clone().multiplyScalar(dt))
		this.gameObject.velocity.add(new THREE.Vector3(0, -9.81*dt, 0))
	}
}


