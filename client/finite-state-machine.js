import { Component } from './components.js';
import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';


export class FiniteStateMachine {
    constructor(gameObject){
        this.gameObject = gameObject;
        this._states = {};
        this._current = null;
        this._loaded = false;

        this.init();
        
       

    }

    init(){
        (async () => {
            const loader = new GLTFLoader();
            const object = await new Promise((resolve, reject) => {
                loader.load('./assets/important/model.glb', data => resolve(data), null, reject);
            });

            this.model = object.scene;
            this.model.scale.set(0.1, 0.1, 0.1);
            this.gameObject.transform.add(this.model);

            const animations = object.animations;
            //console.log(animations)

            this.mixer = new THREE.AnimationMixer(this.model);
            let idle  = this.mixer.clipAction(animations[0]);
            let left  = this.mixer.clipAction(animations[1]);
            let right = this.mixer.clipAction(animations[2]);
            let walk  = this.mixer.clipAction(animations[3]);

            this.actions = [ idle, walk, right, left ];

            this._add("idle", new State("idle", idle))
            this._add("forward", new State("forward", walk))
            this._add("left", new State("left", left))
            this._add("right", new State("right", right))
            
            console.log("loaded")
            this._loaded = true;
        })();
   }

    update(input, dt){
        
        if (this._loaded){

            if (input.forward){
                this._setState("forward");
            } else if(input.backward){
                this._setState("forward");
            } else if(input.left){
                this._setState("left");
            } else if (input.right){
                this._setState("right");
            } else {
                this._setState("idle")
            }

            this._current.update(dt);
            this.mixer.update(dt);
        }
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
        this._current.enter(previous)

        //console.log(this._current)
    }

    _add(name, type){
        this._states[name] = type;
    }
}

export class State {
    constructor(name, animation){
        this.name = name;
        this.animation = animation;
    }

    enter(previous){
        console.log(`enter ${this.name}`);
        
        //run.crossFadeFrom(idle, 0.5, true);
        /*
        this.animation.time = 0.0;
        this.animation.enabled = true;

    
        this.animation.setEffectiveTimeScale(1.0);
        this.animation.setEffectiveWeight(1.0)
        if (previous){
            this.animation.crossFadeFrom(previous.animation, 0.5, true);
        }         
        */
        this.animation.play()
    }

    exit(){
        console.log(`exit ${this.name}`);
        this.animation.stop()
    }

    update(dt){

    }
}