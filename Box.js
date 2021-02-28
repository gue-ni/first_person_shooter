class Box {
	constructor(position, w, h, d){
		this.position = position
		this.h = h
		this.w = w
		this.d = d	
	}

	update(){}

	draw(){
		push()
		translate(this.position.x, this.position.y, this.position.z)
		box(this.w, this.h, this.d)
		pop()
	}	
}

class Ray {
	constructor(origin, direction){
		this.origin = origin
		this.direction = direction
	}

	intersect(box){
		// https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection
	}
}

// axis aligned bounding box
class BoundingBox extends Box {
	constructor(position, w, h, d){
		super(position, w,h,d)
	}

	get minX(){	return this.position.x - this.w/2 }
	get maxX(){ return this.position.x + this.w/2 }
	get minY(){ return this.position.y - this.h/2 }
	get maxY(){ return this.position.y + this.h/2 }
	get minZ(){ return this.position.z - this.d/2 }
	get maxZ(){ return this.position.z + this.d/2 }
	get min(){ return createVector(this.minX, this.minY, this.minZ) }
	get max(){ return createVector(this.maxX, this.maxY, this.maxZ) }

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

	intersectRay(ray){
		/*
		let A = this.min
		let B = this.max

		let tAx = (A.x - ray.origin.x) / ray.direction.x
		let tAy = (A.y - ray.origin.y) / ray.direction.y
		let tAz = (A.z - ray.origin.z) / ray.direction.z
		let tBx = (B.x - ray.origin.x) / ray.direction.x
		let tBy = (B.y - ray.origin.y) / ray.direction.y
		let tBz = (B.z - ray.origin.z) / ray.direction.z

		//let tA = p5.Vector.div(p5.Vector.sub(A, ray.origin), ray.direction)

		let tmin = (tAx > )
		*/

	}

	collide(b){

		let d0, d1, x, y, z
		if (this.intersect(b)){
			if (this.velocity == undefined || this.velocity.mag() < b.velocity.mag()){
			
				d0 = b.maxX 	- this.minX
				d1 = this.maxX 	- b.minX
				x = (d0 < d1 ? d0 : -d1)

				d0 = b.maxY 	- this.minY
				d1 = this.maxY 	- b.minY
				y = (d0 < d1 ? d0 : -d1)

				d0 = b.maxZ 	- this.minZ
				d1 = this.maxZ 	- b.minZ
				z = (d0 < d1 ? d0 : -d1)

				if (abs(x) > abs(y) && abs(z) > abs(y)){
					b.position.y -= y 
					b.velocity.y = 0
					return
				}

				if (abs(y) > abs(x) && abs(z) > abs(x)){
					b.position.x -= x 
					b.velocity.x = 0
					return
				}

				if (abs(y) > abs(z) && abs(x) > abs(z)){
					b.position.z -= z 
					b.velocity.z = 0
					return
				}
			}
		}
	}
}

class PhysicsBox extends BoundingBox {
	constructor(position, w, h, d){
		super(position, w, h, d)
		this.velocity 		= createVector(0,0,0)
		this.acceleration 	= createVector(0,0,0)
	}

	update(){
		this.position = p5.Vector.add(this.position, p5.Vector.mult(this.velocity, deltaTime))
		this.velocity = p5.Vector.add(this.velocity, p5.Vector.mult(createVector(0, gravity, 0), deltaTime))
	}
}