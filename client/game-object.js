import * as THREE from './three/build/three.module.js';

export class GameObject {
	constructor(parent){
		this.id         = this._generateId();
		this.local      = true; // updating is done locally
		this.components = []
        this.subscribers = {};

		this.transform 	= new THREE.Object3D()
		parent.add(this.transform)

		this.velocity   = new THREE.Vector3();
		this.direction  = new THREE.Vector3(1,0,0);
        this.active     = true;
        this.lifetime   = undefined;
	}

    _generateId(){
        return Math.floor(Math.random() * 1000000) // not really a good idea
    }

    subscribe(event, callback){
        
        if (!this.subscribers[event]){
             this.subscribers[event] = [];
        }

        let index = this.subscribers[event].push(callback) - 1;

        return {
            unsubscribe: () => {
                // not optimal, but works if no big changes with subscribers
                this.subscribers[event][index] = () => {}; 
            }
        }
    }

    publish(event, data){
        if (this.subscribers["all"]){
            this.subscribers["all"].forEach(callback => callback({event: event, data: data}));
        }

        if (!this.subscribers[event]) return;
        this.subscribers[event].forEach(callback => callback(data));
    }

	addComponent(component) {
		this.components.push(component);
		return component;
	}

    removeComponent(name){
        let component = this.getComponent(name);

        this.components = this.components.filter( c => { c.name != name});

        if (component){
            component.destroy();
        }
    }

	getComponent(name) {
		return this.components.find(c => c.name == name);
	}

	update(dt){
		for (const component of this.components){
			component.update(dt)
		}
	}

    keepInBounds(map_width, map_height, map_depth){
        if (this.position.x > map_width/2-1){
            this.position.x = map_width/2-1;
        } else if (this.position.x < -map_width/2+1){
            this.position.x 		 = -map_width/2+1;
        }

        if (this.position.z > map_depth/2-1){
            this.position.z = map_depth/2-1;
        } else if (this.position.z < -map_depth/2+1){
            this.position.z 		 = -map_depth/2+1;
        }

        if (this.position.y > map_height-3){
            this.position.y = map_height-3;
        } else if (this.position.y < -5){
            this.position.y = -5;
            this.velocity.y = -5;
        }
    }

	destroy(){
		for (let component of this.components){
			component.destroy()
		}
		//this.transform.parent.remove(this.transform)
	}

    set position(p){ this.transform.position.set(p.x, p.y, p.z); }	
	
    get position() { return this.transform.position; }
    
    get root(){
        let tmp = this.transform;
        while (tmp.parent !== null){
            tmp = tmp.parent;
        }
        return tmp;
    }
}

export class GameObjectArray {
	constructor(){
		this.array = []
		this.toAdd = []
		this.toRemove = new Set()
	}

	get isEmpty(){
		return this.toAdd.length + this.array.length > 0;
	}

	add(element){
		this.toAdd.push(element)
	}

	remove(element){
		this.toRemove.add(element)
	}

	get(id){
		for (let element of this.array){
			if (element.id === id) return element;
		}
		return undefined
	}

	forEach(f) {
		this._addQueued();
		this._removeQueued();

		for (const element of this.array) {
			
			if (this.toRemove.has(element)) {
				continue;
			}

			f(element);
		}
		this._removeQueued();
	}
	
	_addQueued() {
		if (this.toAdd.length) {
			this.array.splice(this.array.length, 0, ...this.toAdd);
			this.toAdd = [];
		}
	}

	_removeQueued() {
		if (this.toRemove.size) {
			this.array = this.array.filter(element => !this.toRemove.has(element));
			this.toRemove.clear();
		}
	}
}

