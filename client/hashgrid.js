/*
	TODO: only update the ones that have actually moved
*/

import * as THREE from "three";

export class HashGrid {
	constructor(size) {
		this.size = size;
		this.space = new Map();
		this._hash = new THREE.Vector3(0, 0, 0);
		this._counter = 0;
		//console.log(this._hash)
	}

	hash(vec) {
		this._hash.x = Math.floor(vec.x / this.size);
		this._hash.y = Math.floor(vec.y / this.size);
		this._hash.z = Math.floor(vec.z / this.size);
		return this._hash.clone();
	}

	clear() {
		this.space = new Map();
	}

	insert(aabb) {
		let min = this.hash(aabb.min);
		let max = this.hash(aabb.max);

		for (let i = min.x; i <= max.x; i++) {
			for (let j = min.y; j <= max.y; j++) {
				for (let k = min.z; k <= max.z; k++) {
					let key = `${i},${j},${k}`;

					if (this.space.has(key)) {
						let l = this.space.get(key);
						l.push(aabb);
						this.space.set(key, l);
					} else {
						this.space.set(key, [aabb]);
					}
				}
			}
		}
		//console.log(this.space.size)
		//console.log(this.space)
	}

	possible_ray_collisions(ray) {
		//console.log(ray.direction)

		let possible = new Set();

		const ray_length = 100;

		let p0 = ray.origin.clone();

		let len = ray.direction.clone();
		//len.setY(0);
		len.normalize();
		len.multiplyScalar(ray_length);

		let p1 = new THREE.Vector3();
		p1.addVectors(p0, len);

		//if (this._counter % 100 == 0) console.log(p0, p1)

		let dx = p1.x - p0.x;
		let dy = p1.y - p0.y;
		let dz = p1.z - p0.z;

		const step = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

		dx = dx / step;
		dy = dy / step;
		dz = dz / step;

		let x = p0.x;
		let y = p0.y;
		let z = p0.z;

		let tmp = "";

		for (let i = 0; i <= Math.ceil(step); i++) {
			let key = `${Math.floor(x / this.size)},${Math.floor(y / this.size)},${Math.floor(z / this.size)}`;
			//tmp += key + " ";

			//console.log(key)

			if (this.space.has(key)) {
				for (let item of this.space.get(key)) {
					possible.add(item);
				}
			}
			x += dx;
			y += dy;
			z += dz;
		}

		/*
        if (++this._counter % 100 == 0) {
            //console.log(tmp)
            //console.log(`${tmp1.x},${tmp1.z}`)
            //console.log(possible.size)
            //console.log(this.space)
        }
        */

		return possible;
	}

	possible_point_collisions(point) {
		let h = this.hash(point);

		let key = `${h.x},${h.y},${h.z}`;
		if (this.space.has(key)) {
			return this.space.get(key);
		} else {
			return [];
		}
	}

	possible_aabb_collisions(aabb) {
		let min = this.hash(aabb.min);
		let max = this.hash(aabb.max);

		let possible = new Set();

		for (let i = min.x; i <= max.x; i++) {
			for (let j = min.y; j <= max.y; j++) {
				for (let k = min.z; k <= max.z; k++) {
					let key = `${i},${j},${k}`;

					if (this.space.has(key)) {
						for (let item of this.space.get(key)) {
							if (item != aabb) possible.add(item);
						}
					}
				}
			}
		}
		return possible;
	}
}
