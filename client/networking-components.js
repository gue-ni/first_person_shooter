import { Component } from "./components";



export class NetworkInput {
    constructor(websocket){
        this.websocket = websocket;
        this.websocket.addEventListener("onmessage", (e) => this.handle(e) ,false);
    }

    handle(message){
        console.log("received message")
    }

    update(dt){
        
    }
}




