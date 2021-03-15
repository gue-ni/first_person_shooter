import { Component } from "./components";

class NetworkController extends Component {
    constructor(gameObject, websocket){
        super(gameObject);
        this.websocket = websocket;
    }
}

class PassiveNetworkController extends NetworkController {
    constructor(gameObject, websocket){
        super(gameObject, websocket);

    }
}

class ActiveNetworkController extends NetworkController {
    constructor(gameObject, websocket){
        super(gameObject, websocket);

    }
}


