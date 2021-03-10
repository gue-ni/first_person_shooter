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

        let tmp = this.gameObject.direction.clone();
        tmp.setY(0);
        tmp.normalize();

        let speed = 7 
        if (this.keyW){ // W
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z

        } else if(this.keyS){   // S
            tmp.multiplyScalar(-speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z
           
        } else if (this.keyD){  // D
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = -tmp.z
            this.gameObject.velocity.z =  tmp.x 

        } else if (this.keyA){  // A
            tmp.multiplyScalar(speed)
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
        this.camera = camera;
        this.camera.position.set(0,0.7,0)
        this.gameObject.transform.add(this.camera)
        this.yaw        = 0.5 * Math.PI
        this.pitch      = 0

        
        var that = this;
        function mouse_callback(event){
            that.yaw   += (event.movementX * 0.1)
            that.pitch += (event.movementY * 0.1)
            let pitch = -that.pitch;
            if (pitch >  89) pitch =  89
            if (pitch < -89) pitch = -89

            that.gameObject.direction.x = Math.cos(that.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
            that.gameObject.direction.y = Math.sin(pitch*(Math.PI/180))
            that.gameObject.direction.z = Math.sin(that.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
            that.gameObject.direction.normalize()
        }
        

        canvas.requestPointerLock 	= canvas.requestPointerLock || canvas.mozRequestPointerLock;
        document.exitPointerLock 	= document.exitPointerLock  || document.mozExitPointerLock;
        canvas.onclick = function() { canvas.requestPointerLock(); };
        document.addEventListener('pointerlockchange', 	  lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
        function lockChangeAlert() {
            if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
                document.addEventListener("mousemove",    mouse_callback, false);
            } else {
                document.removeEventListener("mousemove", mouse_callback, false);
            }
        }
    }

}

export class Health extends Component {
    constructor(gameObject){
        super(gameObject);
        this.name = "Health";
        this.value = 100;
        this.display = document.querySelector('#health');
        this.display.innerText = this.value;
    }

    reset(){
        this.health = 100;
    }

    set health(val){
        this.value = val;
        this.display.innerText = this.value;
    }

    get health(){
        return this.value;
    }
}
