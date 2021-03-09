import * as THREE from './three/build/three.module.js';
import { Component } from './components.js';

export class AABB extends Component {
	constructor(gameObject, size){
		super(gameObject)
		this.name = "aabb"
		this.size = size;
		//this._min = new THREE.Vector3(this.minX, this.minY, this.minZ)
		//this._max = new THREE.Vector3(this.maxX, this.maxY, this.maxZ) }
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

	collide(aabb){
		if (this.intersect(aabb)){

			let d0, d1;

			if (this.gameObject.velocity.length() < aabb.gameObject.velocity.length()){
				d0 = aabb.maxX - this.minX
				d1 = this.maxX - aabb.minX
				let x = (d0 < d1 ? d0 : -d1)

				d0 = aabb.maxY - this.minY
				d1 = this.maxY - aabb.minY
				let y = (d0 < d1 ? d0 : -d1)

				d0 = aabb.maxZ - this.minZ
				d1 = this.maxZ - aabb.minZ
				let z = (d0 < d1 ? d0 : -d1)

				if (Math.abs(x) > Math.abs(y) && Math.abs(z) > Math.abs(y)){
					aabb.gameObject.position.setY(aabb.gameObject.position.y-y)
					aabb.gameObject.velocity.setY(0)
					return true
				}

				if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)){
					aabb.gameObject.position.setX(aabb.gameObject.position.x-x)  
					aabb.gameObject.velocity.setX(0)
					return true
				}

				if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)){
					aabb.gameObject.position.setZ(aabb.gameObject.position.z-z)  
					aabb.gameObject.velocity.setZ(0)
					return true
				}
			}
		} else {
			return false;
		}
	}
}
