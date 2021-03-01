class Player extends Component {
	constructor(gameObject){
        super(gameObject)
        this.name = "player"
		this.id 		= Math.floor(Math.random() * 100) + 1
        this.direction  = new THREE.Vector3(0, 0,-1)
        this.center     = new THREE.Vector3(0, 0, 0)
		this.yaw 		= -0.5 * Math.PI
		this.pitch 		= 0

        this.keyD       = false;   
        this.keyA       = false;   
        this.keyS       = false;   
        this.keyW       = false;  
        this.keySpace   = false; 

        document.addEventListener("keyup", (event) => {
            switch (event.keyCode) {
                case 68: //d
                    this.keyD = false;
                    break;
                case 83: //s
                    this.keyS = false;
                    break;
                case 65: //a
                    this.keyA = false;
                    break;
                case 87: //w
                    this.keyW = false;
                    break;
                case 32:
                    this.keySpace = false
                    break
            }
        })

        document.addEventListener("keydown", (event) => {
            switch (event.keyCode) {
                case 68: //d
                    this.keyD = true;
                    break;
                case 83: //s
                    this.keyS = true;
                    break;
                case 65: //a
                    this.keyA = true;
                    break;
                case 87: //w
                    this.keyW = true;
                    break;
                case 32:
                    this.keySpace = true
                    break
            }
        })
	}

    get cameraCenter(){
        return this.center.addVectors(this.gameObject.position, this.direction)
    } 

	update(dt){
        let speed = 7 
        if (this.keyW){ // W
            let tmp = this.direction.clone()
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z

        } else if(this.keyS){   // S
            let tmp = this.direction.clone()
            tmp.multiplyScalar(-speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z
           
        } else if (this.keyD){  // D
            let tmp = this.direction.clone().multiplyScalar(speed)
            this.gameObject.velocity.x = -tmp.z
            this.gameObject.velocity.z =  tmp.x 

        } else if (this.keyA){  // A
            let tmp = this.direction.clone().multiplyScalar(speed)
            this.gameObject.velocity.x =  tmp.z
            this.gameObject.velocity.z = -tmp.x 

        } else { // no input
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }

        if (this.keySpace && Math.abs(this.gameObject.velocity.y) == 0){ // SPACE
            console.log("jump")
            this.gameObject.velocity.y += 7
        }

        //var gun = this.gameObject.getComponent("weapon")
        //let d = 2
        //gun.position.set(this.direction.x*d, this.direction.y*d, this.direction.z*d)

        //this.ray.origin = p5.Vector.sub(this.position, createVector(0, 40, 0))
	}
}




