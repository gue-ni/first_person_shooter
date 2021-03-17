import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";

export class NetworkController {
    constructor(websocket){
        this.websocket = websocket;
        this.id = Math.random() * 1000000;

        // changes to connected objects
        this.connected    = [];
        this.disconnected = [];

        // information concerning everyone
        this.projectile = [];
        this.rays       = [];
        this.w_objects    = {};
        this.r_objects    = {};
        
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

        let data = {
            id : this.id,
            objects: this.w_objects
        }
        
	    if (this.websocket.readyState === WebSocket.OPEN){
            this.websocket.send(JSON.stringify(data));
        }
    }

    write(id, value){
        this.w_objects[id] = value;
    }
}

export class ActiveNetworkComponent extends Component {
    constructor(gameObject, network){
        super(gameObject);
        this.network = network;
    }

    update(_){
        let value = {
		    pd: [  
                this.gameObject.position.x,  this.gameObject.position.y, this.gameObject.player.position.z, 
                this.gameObject.direction.x, this.gameObject.direction.y, this.gameObject.player.direction.z 
            ]
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



