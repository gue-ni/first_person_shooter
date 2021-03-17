import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";

export class NetworkController {
    constructor(websocket){
        this.websocket = websocket;

        // changes to connected objects
        this.connected    = [];
        this.disconnected = [];

        // information concerning everyone
        this.projectile = [];
        this.rays       = [];
        this.w_objects    = new Map();
        this.r_objects    = new Map();
        
        // information that only concerns the player
        this.player = {
            id: undefined,
            state: undefined,
            position: undefined,
            direction: undefined
        }

        this.websocket.onmessage = (e) => this.receive(e);
    }

    receive(message){
        //console.log("receive message");
    }

    sync(){
        //console.log(this.w_objects)

        let data = {};

        for (let object of this.w_objects){
            
        }
    }

    write(id, value){
        this.w_objects.set(id, value);
    }
}

export class ActiveNetworkComponent extends Component {
    constructor(gameObject, network){
        super(gameObject);
        this.network = network;
    }

    update(_){
        let value = {
            position: this.gameObject.position,
            direction: this.gameObject.direction
        }

        this.network.write(this.gameObject.id, value)
    }
}

/*
export class PassiveNetworkComponent extends Component {
    constructor(gameObject, network){
        super(gameObject)
        this.network = network;
    }

    update(_){
        this.gameObject.position.copy(
            this.network.r_objects[this.gameObject.id].position
        );
        
        this.gameObject.direction.copy(
            this.network.r_objects[this.gameObject.id].direction
        );
    }
}
*/



