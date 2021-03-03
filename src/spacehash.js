
/*
	TODO: only update the ones that have actually moved
*/
import * as THREE from './three/build/three.module.js';


export class SpaceHash {
	constructor(size){
		this.size = size
		this.space = new Map()
		this._hash = new THREE.Vector3()
	}

	hash(vec){
		//var hash2 = new THREE.Vector3(Math.floor(vec.x/this.size),Math.floor(vec.y/this.size),Math.floor(vec.z/this.size))
		this._hash.x = Math.floor(vec.x/this.size)
		this._hash.y = Math.floor(vec.y/this.size)
		this._hash.z = Math.floor(vec.z/this.size)
//		return this._hash
		return this._hash.clone()
	}

	clear(){
		this.space = new Map()
	}

	insert(aabb){
		let min = this.hash(aabb.min)
		let max = this.hash(aabb.max)

		for (let i = min.x; i <= max.x; i++){
			for (let j = min.y; j <= max.y; j++){
				for (let k = min.z; k <= max.z; k++){

					let key = `${i}${j}${k}`

					if (this.space.has(key)){
						let l = this.space.get(key)
						l.push(aabb)
						this.space.set(key, l)
					} else {
						this.space.set(key, [aabb])
					}
				}
			}
		}
		//console.log(this.space.size)
		//console.log(this.space)		
	}

	find_possible_collisions(aabb){
		let min = this.hash(aabb.min)
		let max = this.hash(aabb.max)
		
		let possible = new Set()

		for (let i = min.x; i <= max.x; i++){
			for (let j = min.y; j <= max.y; j++){
				for (let k = min.z; k <= max.z; k++){

					let key = `${i}${j}${k}`

					if (this.space.has(key)){
						for (let item of this.space.get(key)){
							if (item != aabb) possible.add(item)
						}
					}
				}
			}
		}
		return possible
	}
}