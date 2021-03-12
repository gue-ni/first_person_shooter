import { Component } from './components.js'
import * as THREE from './three/build/three.module.js';
import { FBXLoader } from './three/examples/jsm/loaders/FBXLoader.js';
import { FullAutoWeapon } from './weapons.js';

export class WASDMovement extends Component {
	constructor(gameObject, hashGrid){
        super(gameObject)
        this.name = "wasd"
        this.hashGrid   = hashGrid;
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
        let tmp = this.gameObject.direction.clone();
        tmp.setY(0);
        tmp.normalize();

        let speed = 7 
        if (this.keyW){         // W
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

        if (this.keySpace){ // SPACE
            let p = this.gameObject.position.clone();
            p.setY(p.y-1.1)

            for (let box of this.hashGrid.possible_point_collisions(p)){
                if (box.box.containsPoint(p)){
                    console.log("standing on something");
                    this.gameObject.velocity.y += 15;
                    break;
                }
            }
        }
	}
}

export class Character extends Component {
    constructor(gameObject){
        super(gameObject);
        this.name = "Character";

        let model1 = './assets/objects/fbx/walking.fbx';
        let model2 = './assets/objects/fbx/Samba Dancing.fbx';
        
        let model = './assets/objects/mixamo/Ch11_nonPBR.fbx'
        let model3 = './assets/objects/mixamo/Walking.fbx'

        this.mixer;
        //let animationActions = [];

        (async () => {
            const loader = new FBXLoader();
            const object = await new Promise((resolve, reject) => {
                loader.load(model, data => resolve(data), null, reject);
            });

            object.scale.set(0.015,0.015,0.015)
            object.translateOnAxis(new THREE.Vector3(0,1,0), -1)

            const animation = await new Promise((resolve, reject) => {
                loader.load(model3, data => resolve(data), null, reject);
            })
            object.animations.push(animation.animations[0])

            console.log(object)
            
            this.mixer = new THREE.AnimationMixer(object);
            const action = this.mixer.clipAction(object.animations[2]);
            action.play()
            object.traverse(function(child ){
                if (child.isMesh) {
                    child.castShadow    = true;
                    child.receiveShadow = false;
                }
            });
 
            this.gameObject.transform.add(object);
            console.log("loaded")

        })();

        /*
        (async () => {
            const loader = new FBXLoader();
            const object = await new Promise((resolve, reject) => {
                loader.load(model, data => resolve(data), null, reject);
            });

            console.log(object)
            object.scale.set(0.01,0.01,0.01)
 
            this.mixer = new THREE.AnimationMixer(object);
            const action = this.mixer.clipAction(object.animations[0]);
            action.play();
            object.traverse(function(child ){
                if (child.isMesh) {
                    child.castShadow    = false;
                    child.receiveShadow = false;
                }
            });
           
            this.gameObject.transform.add(object);
            console.log("loaded")
        })();
        */


        /*

        const loader = new FBXLoader();
        loader.load( 'models/fbx/Samba Dancing.fbx', function ( object ) {
            mixer = new THREE.AnimationMixer( object );
            const action = mixer.clipAction( object.animations[ 0 ] );
            action.play();
            object.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            } );
            scene.add( object );
        } );
        */
    }

    update(dt){
        if (this.mixer) this.mixer.update(dt);
    }
}

export class FirstPersonCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject)
        this.name = "camera";
        this.camera = camera;
        
        this.yaw        = 0.5 * Math.PI
        this.pitch      = 0
        this.transform = new THREE.Object3D();
        
        this.transform.add(this.camera);
        this.gameObject.transform.add(this.transform)
        
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

    get position(){
        return this.camera.position;
    }

    update(dt){
		let look = new THREE.Vector3()
		look.subVectors(this.gameObject.position, this.gameObject.direction)
		this.transform.lookAt(look)
        
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
