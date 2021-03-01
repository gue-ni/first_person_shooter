

class Box {
	constructor(position, w, h, d, color){
		this.w = w
		this.h = h
		this.d = d
	
	
		this.mesh = this.createMesh(color)
		this.mesh.position.set(position.x, position.y, position.z)
	}

	createMesh(c){
		var geometry = new THREE.BoxGeometry( this.w, this.h, this.d)
		var material = new THREE.MeshStandardMaterial( { color: c, flatShading: true, metalness: 0, roughness: 1 })
		return new THREE.Mesh ( geometry, material )
	}

	update(){}

	set position(pos){
		this.mesh.position.set(pos.x, pos.y, pos.z)
	}	

	get position(){
		return this.mesh.position;
	}
}

class AABB extends Box {
	constructor(position, w, h, d, c){
		super(position, w,h,d, c)
	}

	get minX(){	return this.position.x - this.w/2 }
	get maxX(){ return this.position.x + this.w/2 }
	get minY(){ return this.position.y - this.h/2 }
	get maxY(){ return this.position.y + this.h/2 }
	get minZ(){ return this.position.z - this.d/2 }
	get maxZ(){ return this.position.z + this.d/2 }
	get min(){ return new THREE.Vector3(this.minX, this.minY, this.minZ) }
	get max(){ return new THREE.Vector3(this.maxX, this.maxY, this.maxZ) }

	isPointInside(point) {
        return (point.y >= this.minY/2 && point.y <= this.maxY) &&
         	   (point.z >= this.minZ/2 && point.z <= this.maxZ) &&
         	   (point.x >= this.minX/2 && point.x <= this.maxX)
	}

	intersect(b){
		if ((this.minX < b.maxX && this.maxX > b.minX) &&
		    (this.minY < b.maxY && this.maxY > b.minY) &&
			(this.minZ < b.maxZ && this.maxZ > b.minZ)){
			return true
		} else {
			return false
		}
	}

	collide(b){

		let d0, d1, x, y, z
		if (this.intersect(b)){
			if (this.velocity == undefined || this.velocity.length() < b.velocity.length()){
			
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
					b.position.set(b.position.x, b.position.y-y, b.position.z)  
					b.velocity.y = 0
					return
				}

				if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)){
					b.position.set(b.position.x-x, b.position.y, b.position.z)  
					b.velocity.x = 0
					return
				}

				if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)){
					b.position.set(b.position.x, b.position.y, b.position.z-z)  
					b.velocity.z = 0
					return
				}
			}
		}
	}
}

// has gravity
class GravityObject extends AABB {
	constructor(position, w, h, d, c){
		super(position, w, h, d, c)
		this.velocity 		= new THREE.Vector3()
		this.acceleration 	= new THREE.Vector3()
	}

	update(dt){
		this.position.add(this.velocity.clone().multiplyScalar(dt))
		this.velocity.add(new THREE.Vector3(0, -5 * dt, 0))
		this.mesh.position.set(this.position.x, this.position.y, this.position.z)
	}
}
