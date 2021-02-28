class Character extends PhysicsBox {
	center;
	constructor(x, y, z){
        super(createVector(x,y,z), 100, 50, 100)
		this.id 		= Math.floor(Math.random() * 100) + 1
		this.direction 	= createVector(0,0,0)
		this.camera 	= createCamera()
		this.yaw 		= -0.5 * PI
		this.pitch 		= 0
	}

	shoot(){
		console.log("shoot")
	}

	input(){
        this.yaw   += ( movedX * 0.01)
        this.pitch -= (-movedY * 0.01)

        this.direction.x = cos(this.yaw) * cos(this.pitch)
        this.direction.y = sin(this.pitch)
        this.direction.z = sin(this.yaw) * cos(this.pitch)
        this.direction.normalize()

        const speed = 0.3

        if (keyIsDown(87)){         // W
            let tmp = this.direction.copy().mult(speed)
            this.velocity.x = tmp.x
            this.velocity.z = tmp.z

        } else if(keyIsDown(83)){   // S
            let tmp = this.direction.copy().mult(-speed)
            this.velocity.x = tmp.x
            this.velocity.z = tmp.z

        } else if (keyIsDown(68)){  // D
        	let tmp = this.direction.copy().mult(speed)
            let normal = new p5.Vector(-tmp.z, 0, tmp.x)
            this.velocity.x = normal.x 
            this.velocity.z = normal.z 

        } else if (keyIsDown(65)){  // A
            let tmp = this.direction.copy().mult(speed)
            let normal = new p5.Vector(tmp.z, 0, -tmp.x)
            this.velocity.x = normal.x 
            this.velocity.z = normal.z 

        } else { // no input
        	this.velocity.x = 0
            this.velocity.z = 0
        }

		if (keyIsDown(32) && abs(this.velocity.y) == 0){ // SPACE
            console.log("jump")
			this.velocity.y += -gravity*700
        }
	}


	update(){
        super.update()
	}

    draw(){
        this.center = p5.Vector.add(this.position, this.direction);
        this.camera.setPosition(this.position.x, this.position.y-40, this.position.z)
        this.camera.lookAt(this.center.x,this.center.y-40,this.center.z)
    }

}