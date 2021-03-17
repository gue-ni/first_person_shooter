
import { Component } from './components.js';
import { State, FiniteStateMachine } from "./finite-state-machine.js";
import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';


export class PlayerInput extends Component{ // should also move the camera
    constructor(gameObject){
        super(gameObject);

        this.keys = {
            forward: false,
            backward: false,
            right: false,
            left: false,
            jump: false,
            reload: false
        }

        this._yaw   = 0.5 * Math.PI;
        this._pitch = 0;
        this.firing = false;

        document.body.addEventListener("mousedown", () => this._mouseDownCallback(), false);
        document.body.addEventListener("mouseup",   () => this._mouseUpCallback(), false);

        document.addEventListener('keydown',   (e) => this._onKeyDown(e),     false);
        document.addEventListener('keyup',     (e) => this._onKeyUp(e),       false);
        
        let callback = (e) => this._mouseCallback(e);
        canvas.requestPointerLock 	= canvas.requestPointerLock || canvas.mozRequestPointerLock;
        document.exitPointerLock 	= document.exitPointerLock  || document.mozExitPointerLock;
        canvas.onclick = function() { canvas.requestPointerLock(); };
        document.addEventListener('pointerlockchange', 	  lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
        function lockChangeAlert() {
            if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
                document.addEventListener("mousemove",    callback, false);
            } else {
                document.removeEventListener("mousemove", callback, false);
            }
        }
    }

    update(dt){
        this.gameObject.publish("input", { keys: this.keys, pitch: this.pitch, yaw: this.yaw })
    }

    get pitch(){
        let p = -this._pitch;
        if (p >  89) p =  89
        if (p < -89) p = -89
        return p;
    }

    get yaw(){
        return this._yaw;
    }

    _mouseCallback(event){
        this._yaw   += (event.movementX * 0.1)
        this._pitch += (event.movementY * 0.1)
   }

   _mouseDownCallback(){
        this.firing = true;
        this.gameObject.publish("trigger", {firing: true});
   }

   _mouseUpCallback(){
        this.firing = false;
        this.gameObject.publish("trigger", {firing: false});
   }

    _onKeyDown(event){
        switch (event.keyCode) {
            case 68:  
                this.keys.right       = true; 
                break;
                
            case 83:  
                this.keys.backward    = true; 
                break;

            case 65:  
                this.keys.left        = true; 
                break;

            case 87:  
                this.keys.forward     = true; 
                break;

            case 32:  
                this.keys.jump        = true; 
                break;

            case 82:  
                this.keys.reload = true; 
                this.gameObject.publish("reload", true);
                break;

            case 69: // e
                this.gameObject.publish("toggleGun", "whatever");
        }
    }

    _onKeyUp(event){
        switch (event.keyCode) {
            case 68:  this.keys.right       = false; break;
            case 83:  this.keys.backward    = false; break;
            case 65:  this.keys.left        = false; break;
            case 87:  this.keys.forward     = false; break;
            case 32:  this.keys.jump        = false; break;
            case 82:  this.keys.reload      = false; break;
        }
    }
}

class AiInput { // TODO sometime in the future
    constructor(){
        this._keys = {};
    }
}

// third person character
export class CharacterController extends Component {
    constructor(gameObject, hashGrid){
        super(gameObject);
        this._hashGrid  = hashGrid;
        this.keys     = null;

        this._state = new FiniteStateMachine(this.gameObject);

        this.gameObject.subscribe("input", (event) => {

            this.keys = event.keys;
            
            let yaw     = event.yaw;
            let pitch   = event.pitch;
            this.gameObject.direction.x = Math.cos(yaw  *(Math.PI/180))*Math.cos(pitch*(Math.PI/180))
            this.gameObject.direction.y = Math.sin(pitch*(Math.PI/180))
            this.gameObject.direction.z = Math.sin(yaw  *(Math.PI/180))*Math.cos(pitch*(Math.PI/180))
            this.gameObject.direction.normalize()
        });
    }

    update(dt){
        // change state if necessary
        this._state.update(this.keys, dt);

        // update velocities
        let tmp = this.gameObject.direction.clone();
        tmp.setY(0);
        tmp.normalize();

        let speed = 7 
        if (this.keys.forward){         
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z

        } else if(this.keys.backward){   
            tmp.multiplyScalar(-speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z
           
        } else if (this.keys.right){  
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = -tmp.z
            this.gameObject.velocity.z =  tmp.x 

        } else if (this.keys.left){  
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x =  tmp.z
            this.gameObject.velocity.z = -tmp.x 

        } else { 
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }

        if (this.keys.jump){ // SPACE
            let p = this.gameObject.position.clone();
            p.setY(p.y-1.1)

            for (let aabb of this._hashGrid.possible_point_collisions(p)){
                if (aabb.box.containsPoint(p)){
                    this.gameObject.velocity.y += 15;
                    break;
                }
            }
        }
    }
}