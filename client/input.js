import { Component } from './components.js'
import * as THREE from './three/build/three.module.js';



export class WASDMovement extends Component {
	constructor(gameObject){
        super(gameObject)
        this.name = "wasd"
        this.keyD       = false;   
        this.keyA       = false;   
        this.keyS       = false;   
        this.keyW       = false;  
        this.keySpace   = false; 

        //this.duration = 2
        //this.elapsed = 0

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

	update(dt){
        //this.elapsed += dt;

        let speed = 7 
        if (this.keyW){ // W
            let tmp = this.gameObject.direction.clone()
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z

        } else if(this.keyS){   // S
            let tmp = this.gameObject.direction.clone()
            tmp.multiplyScalar(-speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z
           
        } else if (this.keyD){  // D
            let tmp = this.gameObject.direction.clone().multiplyScalar(speed)
            this.gameObject.velocity.x = -tmp.z
            this.gameObject.velocity.z =  tmp.x 

        } else if (this.keyA){  // A
            let tmp = this.gameObject.direction.clone().multiplyScalar(speed)
            this.gameObject.velocity.x =  tmp.z
            this.gameObject.velocity.z = -tmp.x 

        } else { // no input
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }

        if (this.keySpace && Math.abs(this.gameObject.velocity.y) < 0.5){ // SPACE
            this.gameObject.velocity.y += 7;
        }
	}
}

export class FPSCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject)
        this.name = "camera";
        camera.position.set(0,0,0)
        this.gameObject.transform.add(camera)
        this.yaw        = -0.5 * Math.PI
        this.pitch      = 0
    } 
}

