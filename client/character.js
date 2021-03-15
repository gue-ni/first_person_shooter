
import { Component } from './components.js';
import * as THREE from './three/build/three.module.js';


class FiniteStateMachine {
    constructor(){
        this._states = {};
        this._current = null;
    }

    update(input, dt){
        // update states according to user input
        if (input.keys.forward){
            this._setState("forward");

        } else if (input.keys.backward){
            this._setState("backward");

        } else if (input.keys.right){
            this._setState("right");

        } else if (input.keys.left){
            this._setState("left");

        } else if (input.keys.jump){
            this._setState("jump");

        } else {
            this._setState("idle")
        }

        this._current.update(dt);

    }

    _setState(state){
        if (this._current !== null && this._current.name === state){
            return
        }

        const previous = this._current;

        if (previous){
            previous.exit()
        }

        this._current = this._states[state];
        this._current.enter()
    }

    _add(name, type){
        this._states[name] = type;
    }
}

class State {
    constructor(name){
        this.name = name;
    }

    enter(previous){
        //console.log(`enter ${this.name}`);
    }

    exit(){
        //console.log(`exit ${this.name}`);
    }

    update(dt){

    }
}

export class PlayerInput { // should also move the camera
    constructor(){
        this.keys = {
            forward: false,
            backward: false,
            right: false,
            left: false,
            jump: false,
            r: false
        }

        this._yaw = 0.5 * Math.PI;
        this._pitch = 0;

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
        console.log("mouse moved")
        this._yaw   += (event.movementX * 0.1)
        this._pitch += (event.movementY * 0.1)
   }

    _onKeyDown(event){
        switch (event.keyCode) {
            case 68: //d
                this.keys.right = true;
                break;
            case 83: //s
                this.keys.backward = true;
                break;
            case 65: //a
                this.keys.left = true;
                break;
            case 87: //w
                this.keys.forward = true;
                break;
            case 32: // space
                this.keys.jump = true;
                break
        }
    }

    _onKeyUp(event){
        switch (event.keyCode) {
            case 68: //d
                this.keys.right = false;
                break;
            case 83: //s
                this.keys.backward = false;
                break;
            case 65: //a
                this.keys.left = false;
                break;
            case 87: //w
                this.keys.forward = false;
                break;
            case 32: // space
                this.keys.jump = false;
                break
        }
    }
}

class AiInput { // TODO sometime in the future
    constructor(){
        this._keys = {};
    }
}

export class NetworkInput {
    constructor(websocket){
        this.websocket = websocket;
        this.websocket.addEventListener("onmessage", (e) => this.handle(e) ,false);
    }

    handle(message){
        console.log("received message")
    }
}

export class CharacterController extends Component {
    constructor(gameObject, input, hashGrid){
        super(gameObject);
        this._hashGrid  = hashGrid;
        this._input     = input;

        this._state = new FiniteStateMachine();
        this._state._add("idle", new State("idle"))
        this._state._add("forward", new State("forward"))
        this._state._add("backward", new State("backward"))
        this._state._add("right", new State("right"))
        this._state._add("left", new State("left"))
        this._state._add("jump", new State("jump"))
        this._state._setState("idle");
    }

    update(dt){
        // change state if necessary
        this._state.update(this._input, dt);

        // update view direction
        let yaw     = this._input.yaw;
        let pitch   = this._input.pitch;
        this.gameObject.direction.x = Math.cos(yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
        this.gameObject.direction.y = Math.sin(pitch *(Math.PI/180))
        this.gameObject.direction.z = Math.sin(yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
        this.gameObject.direction.normalize()
 
        // update velocities
        let tmp = this.gameObject.direction.clone();
        tmp.setY(0);
        tmp.normalize();

        let speed = 7 
        if (this._input.keys.forward){         
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z

        } else if(this._input.keys.backward){   
            tmp.multiplyScalar(-speed)
            this.gameObject.velocity.x = tmp.x
            this.gameObject.velocity.z = tmp.z
           
        } else if (this._input.keys.right){  
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x = -tmp.z
            this.gameObject.velocity.z =  tmp.x 

        } else if (this._input.keys.left){  
            tmp.multiplyScalar(speed)
            this.gameObject.velocity.x =  tmp.z
            this.gameObject.velocity.z = -tmp.x 

        } else { 
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }

        if (this._input.keys.jump){ // SPACE
            let p = this.gameObject.position.clone();
            p.setY(p.y-1.1)

            for (let aabb of this._hashGrid.possible_point_collisions(p)){
                if (aabb.box.containsPoint(p)){
                    console.log("standing on something");
                    this.gameObject.velocity.y += 15;
                    break;
                }
            }
        }
    }
}