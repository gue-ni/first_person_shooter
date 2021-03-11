
/*
	TODO: only update the ones that have actually moved
*/

import * as THREE from './three/build/three.module.js';

export class SpaceHash {
	constructor(size){
		this.size = size
		this.space = new Map()
		this._hash = new THREE.Vector3(0,0,0)
		//console.log(this._hash)
	}

	hash(vec){
		this._hash.x = Math.floor(vec.x/this.size)
		this._hash.y = Math.floor(vec.y/this.size)
		this._hash.z = Math.floor(vec.z/this.size)
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

    possible_ray_collisions(ray){

        let possible = new Set()
        
        const ray_length = 10;

        let p0 = ray.origin.clone();
        let p1 = ray.direction.clone().multiplyScalar(ray_length);
        
        let dx = (p1.x - p0.x);
        let dy = (p1.y - p0.y);
        let dz = (p1.z - p0.z);

        const step = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
        //console.log(step)

        dx = dx / step;
        dy = dy / step;
        dz = dz / step;

        let x = p0.x;
        let y = p0.y;
        let z = p0.z;

        for (let i = 0; i <= Math.ceil(step); i++){
            //set_voxel(Math.floor(x), Math.floor(y), Math.floor(z))

			let key = `${Math.floor(x/this.size)}${Math.floor(y/this.size)}${Math.floor(z/this.size)}`
            if (this.space.has(key)){
                for (let item of this.space.get(key)){
                    possible.add(item)
                }
            }

            x += dx;
            y += dy;
            z += dz;
        }

        return possible;
    }

	possible_aabb_collisions(aabb){
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