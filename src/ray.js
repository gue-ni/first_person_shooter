import * as THREE from './three/build/three.module.js';

export class Ray {
	constructor(origin, direction){
		this.origin 	= origin.clone()
		this.direction 	= direction.normalize().clone()
		this.checked_collision = false;
	}

	intersect(box){
		this.checked_collision = true
		// https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection
		let min = box.min
		let max = box.max

	    let tmin = (min.x - this.origin.x) / this.direction.x; 
	    let tmax = (max.x - this.origin.x) / this.direction.x; 
	 
	    if (tmin > tmax){
	    	let tmp = tmax
	    	tmax = tmin
	    	tmin = tmp
	    } 
	 
	    let tymin = (min.y - this.origin.y) / this.direction.y; 
	    let tymax = (max.y - this.origin.y) / this.direction.y; 

		if (tymin > tymax){
	    	let tmp = tymax
	    	tymax = tymin
	    	tymin = tmp
	    } 
	 
	    if ((tmin > tymax) || (tymin > tmax)) return false; 
	    if (tymin > tmin)  tmin = tymin; 
	    if (tymax < tmax)  tmax = tymax; 
	 
	    let tzmin = (min.z - this.origin.z) / this.direction.z; 
	    let tzmax = (max.z - this.origin.z) / this.direction.z; 
	
	 	if (tzmin > tzmax){
	    	let tmp = tzmax
	    	tzmax = tzmin
	    	tzmin = tmp
	    }
	 
	    if ((tmin > tzmax) || (tzmin > tmax)) return false; 
	    if (tzmin > tmin)  tmin = tzmin; 
	    if (tzmax < tmax)  tmax = tzmax; 
    	return true; 
	}
}

