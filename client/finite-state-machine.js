import { Component } from './components.js';
import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';


export class FiniteStateMachine {
    constructor(){
        this._states = {};
        this._current = null;
        this._loaded = false;
    }

    update(input, dt){}

    //syncNetwork(network){}

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
    }

    _add(name, type){
        this._states[name] = type;
    }
}

export class NetworkFSM extends FiniteStateMachine {
    constructor(gameObject){
        super();
        this.gameObject = gameObject;
        this.init();
    }

    init(){
        (async () => {
            const loader = new GLTFLoader();
            const object = await new Promise((resolve, reject) => {
                loader.load('./assets/important/combine3.glb', data => resolve(data), null, reject);
            });

            this.model = object.scene;
            this.model.rotateY(Math.PI/2)
            this.model.scale.set(0.4, 0.4, 0.4);
            this.gameObject.transform.add(this.model);

            const animations = object.animations;
            console.log(animations)

            this.mixer = new THREE.AnimationMixer(this.model);
            let idle   = this.mixer.clipAction(animations[2]);
            let left   = this.mixer.clipAction(animations[3]);
            let right  = this.mixer.clipAction(animations[4]);
            let back   = this.mixer.clipAction(animations[0])
            let front  = this.mixer.clipAction(animations[1]);

            this._add("idle", new AnimationState("idle", idle))
            this._add("forward", new AnimationState("forward", front))
            this._add("backward", new AnimationState("backward", back))
            this._add("left", new AnimationState("left", left))
            this._add("right", new AnimationState("right", right))
            
            console.log("loaded")
            this._loaded = true;
        })();
    }
    /*
    syncNetwork(network){
        // TODO
        if (this._loaded){
            this._setState()        
        }
    }
    */


    update(input, dt){

        if (this._loaded){
            
            if (input){
                if (input.forward){         this._setState("forward");
                } else if(input.backward){  this._setState("backward");
                } else if(input.left){      this._setState("left");
                } else if (input.right){    this._setState("right");
                } else {                    this._setState("idle")
                }
            }
            this.mixer.update(dt);
        }
    }
}

export class LocalFSM extends FiniteStateMachine {
    constructor(gameObject){
        super();
        this.gameObject = gameObject;
        this.init();
    }

    init(){
        this._add("idle",       new State("idle"))
        this._add("forward",    new State("forward"))
        this._add("backward",   new State("backward"))
        this._add("left",       new State("left"))
        this._add("right",      new State("right"))
    }

    update(input, dt){
        if (input){
            if (input.forward){         this._setState("forward");
            } else if(input.backward){  this._setState("backward");
            } else if(input.left){      this._setState("left");
            } else if (input.right){    this._setState("right");
            } else {                    this._setState("idle")
            }       
        }
    }

    /*syncNetwork(network){
        network.player.state = this._current.name;
    }*/
}

export class State {
    constructor(name){
        this.name = name;
    }
    enter(previous){
        //console.log(`enter ${this.name}`);
    }

    exit(){
        //console.log(`exit ${this.name}`);
    }
}

export class AnimationState extends State{
    constructor(name, animation){
        super(name); 
        this.animation = animation;
        this._fade = 0.2;
    }

    enter(previous){
        //console.log(`enter ${this.name}`);
        this.animation.reset();
        this.animation.setEffectiveTimeScale(1);
        this.animation.setEffectiveWeight(1);
        this.animation.fadeIn(this._fade);
        this.animation.play()
    }

    exit(){
        //console.log(`exit ${this.name}`);
        this.animation.fadeOut(this._fade);
    }
}