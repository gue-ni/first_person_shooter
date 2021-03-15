
import { Component } from './components.js';
import * as THREE from './three/build/three.module.js';


class FiniteStateMachine {
    constructor(){
        this._states = {};
        this._current = null;
    }

    update(input){
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
        console.log(`enter ${this.name}`);
    }

    exit(){
        console.log(`exit ${this.name}`);
    }

    update(dt){

    }
}

class PlayerInput { // should also move the camera
    constructor(){
        this.keys = {
            forward: false,
            backward: false,
            right: false,
            left: false,
            jump: false
        }

        document.addEventListener('keydown',   (e) => this._onKeyDown(e),     false);
        document.addEventListener('keyup',     (e) => this._onKeyUp(e),       false);
        document.addEventListener("mousemove", (e) => this._mouseCallback(e), false);
    }

    _mouseCallback(event){
        console.log("mouse moved")
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

export class CharacterController extends Component {
    constructor(gameObject){
        super(gameObject);

        this._input = new PlayerInput();

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
        this._state.update(this._input);

        // update velocities
        // update view direction
    }
}