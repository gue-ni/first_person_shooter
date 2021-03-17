import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

import { GameObject} from './game-object.js'

export class Component {
	constructor(gameObject){
		this.gameObject = gameObject
		this.name = this.constructor.name;
	}
	update(dt){}
	destroy(){}
}

export class HUD {
    constructor(){
        this.ammoDisplay = document.querySelector('#ammo');

        this.ammo = -1;
    }

    set ammo(value){
        this.ammoDisplay.innerText = value;
    }

    reloading(){
        this.ammoDisplay.innerText = "reloading";
    }
}

// allows a gameObject to subscribe to the events of another gameobject
export class EventRelay extends Component {
    constructor(gameObject, hostObject, eventTypes){
        super(gameObject);

        this.hostObject = hostObject;
        
        for (let eventType of eventTypes){
            this.hostObject.subscribe(eventType, (event) => {
                this.gameObject.publish(eventType, event);
            });
        }
    }
}

export class SimpleGLTFModel extends Component {
    constructor(gameObject, path, params){
        super(gameObject);


        let rotation = params.rotation ? params.rotation : new THREE.Vector3();
        let position = params.position ? params.position : new THREE.Vector3();
        let scale    = params.scale    ? params.scale : new THREE.Vector3(1,1,1);

        (async () => {
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(path, data => resolve(data), null, reject);
            });
            this.model = gltf.scene;
            this.model.position.copy(position);
            this.model.rotateX(rotation.x);
            this.model.rotateY(rotation.y);
            this.model.rotateZ(rotation.z);
            this.model.scale.copy(scale)
            this.gameObject.transform.add(this.model)
        })();
    }
}

export class Box extends Component {
	constructor(gameObject, params){
		super(gameObject)
		this.name = "box"

        let rotation        = params.rotation       ? params.rotation : new THREE.Vector3();
        let position        = params.position       ? params.position : new THREE.Vector3();
        let size            = params.size           ? params.size : new THREE.Vector3(1,1,1);
        let castShadow      = params.castShadow     ? params.castShadow : false;
        let receiveShadow   = params.receiveShadow  ? params.receiveShadow : false;
        let color           = params.color          ? params.color : 0xD9D9D9;

		let geometry 	= new THREE.BoxBufferGeometry(size.x, size.y, size.z)
		let material 	= new THREE.MeshStandardMaterial({ 
			color: color, 
			flatShading: true, 
			emissive: 0xffffff, 
			emissiveIntensity: 0,
			roughness: 0.5
		});
		this.model 		= new THREE.Mesh(geometry, material)
		
        this.model.castShadow 	= castShadow
		this.model.receiveShadow = receiveShadow
        
        this.model.rotateX(rotation.x);
        this.model.rotateY(rotation.y);
        this.model.rotateZ(rotation.z);
    
        this.model.position.copy(position);

		this.gameObject.transform.add(this.model)
	}

	destroy(){
		this.model.geometry.dispose()
		this.model.material.dispose()
		this.model.parent.remove(this.model)
	}
}

export class Physics extends Component {
	constructor(gameObject){
		super(gameObject)
		this.name = "gravity"
	}

	update(dt){
		this.gameObject.position.add(this.gameObject.velocity.clone().multiplyScalar(dt))
		this.gameObject.velocity.add(new THREE.Vector3(0, -9.81*dt, 0))
	}
}


