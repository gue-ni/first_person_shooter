
class GameObject {
	constructor(parent){
		this.components = []
		this.transform 	= new THREE.Object3D()
		parent.add(this.transform)

		this.velocity = new THREE.Vector3()
	}

	addComponent(component) {
		this.components.push(component);
		return component;
	}

	getComponent(name) {
		return this.components.find(c => c.name == name);
	}

	update(dt){
		for (const component of this.components){
			component.update(dt)
		}
	}

	set position(pos){
		this.transform.position.set(pos.x, pos.y, pos.z)
	}	

	get position(){
		return this.transform.position;
	}
}

class Component {
	constructor(gameObject){
		this.gameObject = gameObject
		this.name = "component"
	}
	update(dt){}
}

class Box extends Component {
	constructor(gameObject, size, box_color){
		super(gameObject)
		this.name = "box"
		var geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
		var material = new THREE.MeshStandardMaterial({ color: box_color, flatShading: true, metalness: 0, roughness: 1 })
		this.gameObject.transform.add(new THREE.Mesh(geometry, material))
	}
}

class AABB extends Component {
	constructor(gameObject, size){
		super(gameObject)
		this.name = "aabb"
		this.size = size;
		var geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
		var material = new THREE.MeshBasicMaterial( {color: "#dadada", wireframe: true, transparent: true})
		this.gameObject.transform.add(new THREE.Mesh(geometry, material))
		/*
		var geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
		var material = new THREE.MeshStandardMaterial( { color: 0xff0051, flatShading: true, metalness: 0, roughness: 1 })
		this.gameObject.transform.add(new THREE.Mesh (geometry, material))
		*/
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

	intersect(b){
		return (this.minX < b.maxX && this.maxX > b.minX) &&
	           (this.minY < b.maxY && this.maxY > b.minY) &&
		       (this.minZ < b.maxZ && this.maxZ > b.minZ)
	}

	collide(gameObject){
		var b = gameObject.getComponent("aabb")

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
						gameObject.position.set(gameObject.position.x, gameObject.position.y-y, gameObject.position.z)  
						gameObject.velocity.y = 0
						return
					}

					if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)){
						gameObject.position.set(gameObject.position.x-x, gameObject.position.y, gameObject.position.z)  
						gameObject.velocity.x = 0
						return
					}

					if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)){
						gameObject.position.set(gameObject.position.x, gameObject.position.y, gameObject.position.z-z)  
						gameObject.velocity.z = 0
						return
					}
				}
			}
		}
	}
}

class Gravity extends Component {
	constructor(gameObject){
		super(gameObject)
		this.name = "gravity"
	}

	update(dt){
		this.gameObject.position.add(this.gameObject.velocity.clone().multiplyScalar(dt))
		this.gameObject.velocity.add(new THREE.Vector3(0, -9.81*dt, 0))
	}
}

class Weapon extends Component {
	constructor(gameObject){
		super(gameObject);
		this.name = "weapon"
		var geometry = new THREE.BoxGeometry(0.5, 0.5, 1)
		var material = new THREE.MeshStandardMaterial({ color: 0xff0051, flatShading: true, metalness: 0, roughness: 1 })
		var mesh = new THREE.Mesh(geometry, material)
		mesh.position.set(-0.5, -0.5, 0)
		this.gameObject.transform.add(mesh)
	}
}

class Ray {
	constructor(origin, direction){
		this.origin 	= origin.clone()
		this.direction 	= direction.normalize().clone()
	}

	intersect(box){
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

