class Player extends GravityObject {
	constructor(x, y, z){
        super(new THREE.Vector3(x,y,z), 0.5, 1.8, 0.5, 0xff0051)
		this.id 		= Math.floor(Math.random() * 100) + 1
        this.direction  = new THREE.Vector3(0, 0, -1)
        this.center     = new THREE.Vector3(0, 0, 0)
		this.yaw 		= -0.5 * Math.PI
		this.pitch 		= 0

        this.keyD = false;   
        this.keyA = false;   
        this.keyS = false;   
        this.keyW = false;  
        this.keySpace = false; 
	}

    get cameraCenter(){
        return this.center.addVectors(this.cameraPosition, new THREE.Vector3(this.direction.x, this.direction.y+this.h/2, this.direction.z))
    } 

    get cameraPosition(){
        return new THREE.Vector3(this.position.x, this.position.y+this.h/2, this.position.z)
    }

	update(dt){
        let speed = 4 
        if (this.keyW){ // W
            let tmp = this.direction.clone()
            tmp.multiplyScalar(speed)
            this.velocity.x = tmp.x
            this.velocity.z = tmp.z

        } else if(this.keyS){   // S
            let tmp = this.direction.clone()
            tmp.multiplyScalar(-speed)
            this.velocity.x = tmp.x
            this.velocity.z = tmp.z
           
        } else if (this.keyD){  // D
            let tmp = this.direction.clone().multiplyScalar(speed)
            this.velocity.x = -tmp.z
            this.velocity.z =  tmp.x 

        } else if (this.keyA){  // A
            let tmp = this.direction.clone().multiplyScalar(speed)
            this.velocity.x =  tmp.z
            this.velocity.z = -tmp.x 

        } else { // no input
            this.velocity.x = 0
            this.velocity.z = 0
        }

        if (this.keySpace && Math.abs(this.velocity.y) == 0){ // SPACE
            console.log("jump")
            this.velocity.y += 5
        }

        super.update(dt)

        //this.ray.origin = p5.Vector.sub(this.position, createVector(0, 40, 0))

	}
}