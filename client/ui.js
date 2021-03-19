import { Component } from "./components.js";

export class HealthDisplay extends Component {
    constructor(gameObject){
        super(gameObject);

        this.display = document.querySelector('#health');
        this.display.innerText = 100;

        this.gameObject.subscribe("damage", (event) => {
            this.display.innerText -= event;
        })

        this.gameObject.subscribe("spawn", (event) => {
            this.display.innerText = 100;
        })
    }
}

export class AmmoDisplay extends Component {
    constructor(gameObject){
        super(gameObject);

        this.display = document.querySelector('#ammo');

        this.gameObject.subscribe("ammo", (event) => {
            this.display.innerText = event;
        })

        this.gameObject.subscribe("reload", (event) => {
            this.display.innerText = event.finished ? event.ammo : "reloading";
        })
    }
}

export class HitDisplay extends Component {
    constructor(gameObject){
        super(gameObject);
       
        this._duration = 0.2;
		this._elapsed  = 0;
        this.display = document.querySelector('#crosshair');

        this.gameObject.subscribe("hit", (event) => {
            this.display.innerText = "x";
        })
    }

    update(dt){
        this._elapsed += dt;
		if (this._elapsed >= this._duration){
            this.display.innerText = "+";
            this._elapsed = 0
		}
    }
}

