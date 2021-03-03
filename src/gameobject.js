import * as THREE from './three/build/three.module.js';

export class GameObject {
	constructor(parent){
		this.components = []
		this.transform 	= new THREE.Object3D()
		parent.add(this.transform)

		this.velocity = new THREE.Vector3()
		this.direction = new THREE.Vector3(1,0,0)
	}

	addComponent(component) {
		this.components.push(component);
		return component;
	}

	getComponent(name) {
		return this.components.find(c => c.name == name);
	}

	update(dt){
		let look = new THREE.Vector3()
		for (const component of this.components){
			component.update(dt)
		}
		
		look.subVectors(this.position, this.direction)
		this.transform.lookAt(look)
	}

	set position(pos){
		this.transform.position.set(pos.x, pos.y, pos.z)
	}	

	get position(){
		return this.transform.position;
	}
}