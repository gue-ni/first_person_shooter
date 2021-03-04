
class Vector3 {
	constructor(x,y,z){
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

class Ray {
	constructor(data){
		this.data = data;
	}

	static intersect_box(ray, box){
		let minX = box.minX;
		let minY = box.minY;
		let minZ = box.minZ;
		let maxX = box.maxX;
		let maxY = box.maxY;
		let maxZ = box.maxZ;
		let tmp = 0;

	    let tmin = (minX - ray[0]) / ray[3]; 
	    let tmax = (maxX - ray[0]) / ray[3]; 
	 
	    if (tmin > tmax){
	    	tmp = tmax
	    	tmax = tmin
	    	tmin = tmp
	    } 
	 
	    let tymin = (minY - ray[1]) / ray[4]; 
	    let tymax = (maxY - ray[1]) / ray[4]; 

		if (tymin > tymax){
	    	tmp = tymax
	    	tymax = tymin
	    	tymin = tmp
	    } 
	 
	    if ((tmin > tymax) || (tymin > tmax)) return false; 
	    if (tymin > tmin)  tmin = tymin; 
	    if (tymax < tmax)  tmax = tymax; 
	 
	    let tzmin = (minZ - ray[2]) / ray[5]; 
	    let tzmax = (maxZ - ray[2]) / ray[5]; 
	
	 	if (tzmin > tzmax){
	    	tmp = tzmax
	    	tzmax = tzmin
	    	tzmin = tmp
	    }
	 
	    if ((tmin > tzmax) || (tzmin > tmax)) return false; 
	    if (tzmin > tmin)  tmin = tzmin; 
	    if (tzmax < tmax)  tmax = tzmax; 
    	return true; 
	}
}

class AABB {
	constructor(position, size){
		this.size 		= size;
		this.position 	= position;
	}

	get minX(){	return this.position[0] - this.size.x/2 }
	get maxX(){ return this.position[0] + this.size.x/2 }
	get minY(){ return this.position[1] - this.size.y/2 }
	get maxY(){ return this.position[1] + this.size.y/2 }
	get minZ(){ return this.position[2] - this.size.z/2 }
	get maxZ(){ return this.position[2] + this.size.z/2 }
}

exports.Ray 	= Ray;
exports.AABB 	= AABB;
exports.Vector3 = Vector3;







