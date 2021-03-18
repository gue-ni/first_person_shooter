import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";

export class NetworkController {
    constructor(websocket){
        this.websocket = websocket;
        this.id = Math.floor(Math.random() * 1000000000) // not really a good idea

        console.log(`Network Id: ${this.id}`);

        // changes to connected objects
        this.connected    = {};
        this.disconnected = [];

        // information concerning everyone
        this.projectile = [];
        this.rays       = [];
        this.explosions = [];

        this.w_objects    = {};
        this.r_objects    = {};
        
        this.websocket.onmessage = (e) => this.receive(e);
    }

    receive(message){
        let data = JSON.parse(message.data);

        if (data.disconnected){
            console.log(`lost connection: ${data.disconnected.id}`)

            this.disconnected = data.disconnected.objects;

            for (let id of this.disconnected){
                console.log(`need to remove ${id}`)
            }
        }
    
        if (data.connected){
            for (let id of data.connected.ids){
                console.log(`new connection: ${id}`)
            }

            this.connected = data.connected.objects;

            for (let [_, object] of Object.entries(this.connected)){
                //console.log(object)
            }
        }

        if (data.objects){
            this.r_objects = data.objects;
        }
    }

    sync(){

        let data = {
            id : this.id,
            objects: this.w_objects
        }
        
	    if (this.websocket.readyState === WebSocket.OPEN){
            //console.log(data.objects)
            this.websocket.send(JSON.stringify(data));
        }
    }

    write(id, value){
        this.w_objects[id] = value;
    }

    read(id){
        return this.r_objects[id];
    }
}

/*
value = {
    'pd': [x,y,z, x,y,z],  // position and direction
    's': ['forward'],     // character state
    'h': 95,              // player health   
}
*/

export class ActiveNetworkComponent extends Component {
    constructor(gameObject, network, type){
        super(gameObject);
        this.network = network;
        this.value = { type: type };
        this.type = type;

        this.gameObject.subscribe("input", (event) => {
            let state = [];

            for (let [k, v] of Object.entries(event.keys)){
                if (v) state.push(k);
            }

            this.value.s = state;
        })
    }

    update(_){
        this.value.pd = [
            this.gameObject.position.x,  this.gameObject.position.y, this.gameObject.position.z, 
            this.gameObject.direction.x, this.gameObject.direction.y, this.gameObject.direction.z 
        ];
        this.network.write(this.gameObject.id, this.value)
    }
}

export class PassiveNetworkComponent extends Component {
    constructor(gameObject, network){
        super(gameObject)
        this.network = network;
        this.value = {};
    }

    update(_){
        this.value = this.network.read(this.gameObject.id);

        if (this.value){

            this.gameObject.position.set( this.value.pd[0], this.value.pd[1], this.value.pd[2])
            this.gameObject.direction.set(this.value.pd[3], this.value.pd[4], this.value.pd[5])

            this.gameObject.transform.rotation.y = Math.atan2(
                -this.gameObject.direction.z,
                 this.gameObject.direction.x
            )

            if (this.value.s){
                let keys = {};
                for (let state of this.value.s) keys[state] = true;
                this.gameObject.publish("input", { 'keys': keys, 'direction': this.gameObject.direction.clone() })
            }
        }
    }
}




