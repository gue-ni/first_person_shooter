import { Component } from './components.js';
import * as THREE from './three/build/three.module.js';

export class PlayerInput extends Component{ // should also move the camera
    constructor(gameObject, network, hashGrid){
        super(gameObject);

        this.network = network;
        this.hashGrid = hashGrid;

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
        this._direction = new THREE.Vector3();
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
        // update velocities
        let direction = this._direction.clone();
        direction.setY(0);
        direction.normalize();

        let speed = 7;

        if (this.keys.forward){         
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x = direction.x
            this.gameObject.velocity.z = direction.z

        } else if(this.keys.backward){   
            direction.multiplyScalar(-speed)
            this.gameObject.velocity.x = direction.x
            this.gameObject.velocity.z = direction.z
           
        } else if (this.keys.right){  
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x = -direction.z
            this.gameObject.velocity.z =  direction.x 

        } else if (this.keys.left){  
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x =  direction.z
            this.gameObject.velocity.z = -direction.x 

        } else { 
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }

        if (this.keys.jump){ // SPACE
            let p = this.gameObject.position.clone();
            p.setY(p.y-1.1)

            for (let aabb of this.hashGrid.possible_point_collisions(p)){
                if (aabb.box.containsPoint(p)){
                    this.gameObject.velocity.y = 10;
                    break;
                }
            }
        }
    }

    _publishData(){
        this.gameObject.publish("input", { keys: this.keys, direction: this._direction });
    }

    _mouseCallback(event){
        this._yaw   += (event.movementX * 0.1);
        this._pitch += (event.movementY * 0.1);

        let pitch = -this._pitch;
        if (pitch >  89) pitch =  89
        if (pitch < -89) pitch = -89

        let yaw = this._yaw;

        this._direction.x = Math.cos(yaw  *(Math.PI/180))*Math.cos(pitch*(Math.PI/180))
        this._direction.y = Math.sin(pitch*(Math.PI/180))
        this._direction.z = Math.sin(yaw  *(Math.PI/180))*Math.cos(pitch*(Math.PI/180))
        this._direction.normalize()

        this._publishData();
   }

    _mouseDownCallback(){
        if (!this.gameObject.active) return;
        this.firing = true;
        this.gameObject.publish("trigger", { firing: true });
    }

    _mouseUpCallback(){
        if (!this.gameObject.active) return;
        this.firing = false;
        this.gameObject.publish("trigger", { firing: false });
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
                this.gameObject.publish("reload", { 'finished': false});
                break;

            case 69: // e
                this.gameObject.publish("toggleGun", "whatever");
        }

        this._publishData();
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
        this._publishData();
    }
}

export class TouchInput extends Component {
    constructor(gameObject, network, hashGrid){
        super(gameObject);

        this.network = network;
        this.hashGrid = hashGrid;

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
        this._direction = new THREE.Vector3();

        let left    = document.querySelector('#left-stick');
        let right   = document.querySelector('#right-stick');
        let fire    = document.querySelector('#fire');
        
        left.addEventListener("touchstart", (event) => this.stick_touchstart(event, left), {passive: false});
        left.addEventListener("touchmove",  (event) => this.stick_move_touchmove(event, left),  {passive: false});
        left.addEventListener("touchend",   (event) => this.stick_move_touchend(event, left),   {passive: false});

        right.addEventListener("touchstart", (event) => this.stick_touchstart(event, right), {passive: false});
        right.addEventListener("touchmove",  (event) => this.stick_look_touchmove(event, right),  {passive: false});
        right.addEventListener("touchend",   (event) => this.stick_touchend(event, right),   {passive: false});

        fire.addEventListener("touchstart", (event) => {
            if (!this.gameObject.active) return;
            this.gameObject.publish("trigger", { firing: true });
        }, false);

        fire.addEventListener("touchend", (event) => {
            if (!this.gameObject.active) return;
            this.gameObject.publish("trigger", { firing: false });
        }, false);
    }

    update(dt){
        let direction = this._direction.clone();
        direction.setY(0);
        direction.normalize();

        let speed = 7;

        if (this.keys.forward){         
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x = direction.x
            this.gameObject.velocity.z = direction.z

        } else if(this.keys.backward){   
            direction.multiplyScalar(-speed)
            this.gameObject.velocity.x = direction.x
            this.gameObject.velocity.z = direction.z
           
        } else if (this.keys.right){  
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x = -direction.z
            this.gameObject.velocity.z =  direction.x 

        } else if (this.keys.left){  
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x =  direction.z
            this.gameObject.velocity.z = -direction.x 

        } else { 
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }
    }

    _publishData(){
        this.gameObject.publish("input", { keys: this.keys, direction: this._direction });
    }

    stick_touchstart(ev, el){
        ev.preventDefault();
    }

    stick_touchend(ev, el){
        ev.preventDefault();
        ev.target.style.transform = `translate(0px, 0px)`;
    }
    stick_move_touchend(ev, el){
        ev.preventDefault();
        ev.target.style.transform = `translate(0px, 0px)`;
        this.keys.left = this.keys.right = false;
        this.keys.forward = this.keys.backward = false;
        console.log("end")
    }


    stick_move_touchmove(ev, el){
        ev.preventDefault();

        let touch = null;
        for (let tmp of ev.touches){
            if (el == tmp.target) touch = tmp;
        }
        
        let x = ev.target.offsetLeft+document.body.scrollLeft+ev.target.clientHeight/2;
        let y = ev.target.offsetTop +document.body.scrollTop +ev.target.clientWidth /2;
        let tx = touch.clientX - x;
        let ty = touch.clientY - y;
        let length = Math.sqrt(tx**2 + ty**2);
        let factor = 1.0, max = 50;
        if (length > max) factor = max / length; 
        tx *= factor;
        ty *= factor;
        ev.target.style.transform = `translate(${tx}px, ${ty}px)`;

        //console.log(tx / ty);
        //console.log(tx)
        //console.log("move")

        if (tx < -10) {
            this.keys.left = true;
            this.keys.right = false;
        } else if (tx >  10) {
            this.keys.right = true;
            this.keys.left = false;
        } else {
            this.keys.right = this.keys.left = false;
        }

        if (ty < -10) {
            this.keys.forward = true;
            this.keys.backward = false;
        } else if (ty >  10) {
            this.keys.backward = true;
            this.keys.forward = false;
        } else {
            this.keys.backward = this.keys.forward = false;
        }


    }

    stick_look_touchmove(ev, el){
        ev.preventDefault();

        let touch = null;
        for (let tmp of ev.touches){
            if (el == tmp.target) touch = tmp;
        }
        
        let x = ev.target.offsetLeft+document.body.scrollLeft+ev.target.clientHeight/2;
        let y = ev.target.offsetTop +document.body.scrollTop +ev.target.clientWidth /2;
        let tx = touch.clientX - x;
        let ty = touch.clientY - y;
        let length = Math.sqrt(tx**2 + ty**2);
        let factor = 1.0, max = 50;
        if (length > max) factor = max / length; 
        tx *= factor;
        ty *= factor;

        this._yaw   += (tx * 0.05);
        this._pitch += (ty * 0.05);
        let pitch = -this._pitch;
        if (pitch >  89) pitch =  89
        if (pitch < -89) pitch = -89
        let yaw = this._yaw;
        this._direction.x = Math.cos(yaw  *(Math.PI/180))*Math.cos(pitch*(Math.PI/180))
        this._direction.y = Math.sin(pitch*(Math.PI/180))
        this._direction.z = Math.sin(yaw  *(Math.PI/180))*Math.cos(pitch*(Math.PI/180))
        this._direction.normalize()
        this._publishData();

        ev.target.style.transform = `translate(${tx}px, ${ty}px)`;
    }
}

export class TestInput extends PlayerInput {
    constructor(gameObject, network, hashGrid){
        super(gameObject, network, hashGrid);

    }

    update(dt){
        // update velocities
        let direction = this._direction.clone();
        
        direction.normalize();

        let speed = 7;

        if (this.keys.forward){         
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x = direction.x
            this.gameObject.velocity.z = direction.z
            this.gameObject.velocity.y = direction.y

        } else if(this.keys.backward){   
            direction.multiplyScalar(-speed)
            this.gameObject.velocity.x = direction.x
            this.gameObject.velocity.z = direction.z
           
        } else if (this.keys.right){  
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x = -direction.z
            this.gameObject.velocity.z =  direction.x 

        } else if (this.keys.left){  
            direction.multiplyScalar(speed)
            this.gameObject.velocity.x =  direction.z
            this.gameObject.velocity.z = -direction.x 

        } else { 
            this.gameObject.velocity.x = 0
            this.gameObject.velocity.z = 0
        }
    }
}

