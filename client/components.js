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
		let geometry = new THREE.BoxBufferGeometry(size.x, size.y, size.z)
		let material = new THREE.MeshStandardMaterial({ color: box_color, flatShading: true, metalness: 0, roughness: 1 })
		this.mesh = new THREE.Mesh(geometry, material)
		this.mesh.castShadow = castShadow
		this.mesh.receiveShadow = receiveShadow
		this.gameObject.transform.add(this.mesh)
	}

	remove(){
		this.mesh.geometry.dispose()
		this.mesh.material.dispose()
		this.mesh.parent.remove(this.mesh)
	}
}

export class AABB extends Component {
	constructor(gameObject, size){
		super(gameObject)
		this.name = "aabb"
		this.size = size;
		//this._min = new THREE.Vector3(this.minX, this.minY, this.minZ)
		//this._max =new THREE.Vector3(this.maxX, this.maxY, this.maxZ) }
		//let geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
		//let material = new THREE.MeshBasicMaterial( {color: "#dadada", wireframe: true, transparent: true})
		//this.gameObject.transform.add(new THREE.Mesh(geometry, material))
	}

	get minX(){	return this.gameObject.position.x - this.size.x/2 }
	get maxX(){ return this.gameObject.position.x + this.size.x/2 }
	get minY(){ return this.gameObject.position.y - this.size.y/2 }
	get maxY(){ return this.gameObject.position.y + this.size.y/2 }
	get minZ(){ return this.gameObject.position.z - this.size.z/2 }
	get maxZ(){ return this.gameObject.position.z + this.size.z/2 }
	get min(){ 	return new THREE.Vector3(this.minX, this.minY, this.minZ) }
	get max(){ 	return new THREE.Vector3(this.maxX, this.maxY, this.maxZ) }

	isPointInside(point) {
        return (point.y >= this.minY/2 && point.y <= this.maxY) &&
         	   (point.z >= this.minZ/2 && point.z <= this.maxZ) &&
         	   (point.x >= this.minX/2 && point.x <= this.maxX)
	}

	intersect(aabb){
		return (this.minX < aabb.maxX && this.maxX > aabb.minX) &&
	           (this.minY < aabb.maxY && this.maxY > aabb.minY) &&
		       (this.minZ < aabb.maxZ && this.maxZ > aabb.minZ)
	}

	collideAABB(aabb){
		let d0, d1, x, y, z
		if (this.intersect(aabb)){
			//console.log("collides")

			if (this.gameObject.velocity.length() < aabb.gameObject.velocity.length()){
				d0 = aabb.maxX - this.minX
				d1 = this.maxX - aabb.minX
				x = (d0 < d1 ? d0 : -d1)

				d0 = aabb.maxY - this.minY
				d1 = this.maxY - aabb.minY
				y = (d0 < d1 ? d0 : -d1)

				d0 = aabb.maxZ - this.minZ
				d1 = this.maxZ - aabb.minZ
				z = (d0 < d1 ? d0 : -d1)

				if (Math.abs(x) > Math.abs(y) && Math.abs(z) > Math.abs(y)){
					aabb.gameObject.position.setY(aabb.gameObject.position.y-y)
					aabb.gameObject.velocity.setY(0)
					return
				}


				if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)){
					aabb.gameObject.position.setX(aabb.gameObject.position.x-x)  
					aabb.gameObject.velocity.x = 0
					return
				}

				if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)){
					aabb.gameObject.position.setZ(aabb.gameObject.position.z-z)  
					aabb.gameObject.velocity.z = 0
					return
				}
			}
		}
	}

	collide(gameObject){
		let b = gameObject.getComponent("aabb")
		if (b != undefined){
			let d0, d1, x, y, z
			if (this.intersect(b)){
				if (this.gameObject.velocity.length() < gameObject.velocity.length()){
				
					d0 = b.maxX 	- this.minX
					d1 = this.maxX 	- b.minX
					x = (d0 < d1 ? d0 : -d1)

					d0 = b.maxY 	- this.minY
					d1 = this.maxY 	- b.minY
					y = (d0 < d1 ? d0 : -d1)

					d0 = b.maxZ 	- this.minZ
					d1 = this.maxZ 	- b.minZ
					z = (d0 < d1 ? d0 : -d1)

					if (Math.abs(x) > Math.abs(y) && Math.abs(z) > Math.abs(y)){
						gameObject.position.setX(b.gameObject.position.x-x)  
						gameObject.velocity.y = 0
						return
					}

					if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)){
						gameObject.position.setY(gameObject.position.y-y)  
						gameObject.velocity.x = 0
						return
					}

					if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)){
						gameObject.position.setZ(gameObject.position.z-z)  
						gameObject.velocity.z = 0
						return
					}
				}
			}
		}
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


