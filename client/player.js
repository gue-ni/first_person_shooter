import { Component } from './components.js'
import * as THREE from './three/build/three.module.js';
import { FBXLoader } from './three/examples/jsm/loaders/FBXLoader.js';

export class Character extends Component {
    constructor(gameObject){
        super(gameObject);
        this.name = "Character";

        let model = './assets/objects/mixamo/Ch11_nonPBR.fbx'

        let animations = [
            './assets/objects/mixamo/Walking.fbx',
            './assets/objects/mixamo/Run Forward.fbx',
            './assets/objects/mixamo/Idle.fbx'
        ]

        this.actions = []

        this.mixer;

        (async () => {
            const loader = new FBXLoader();
            const object = await new Promise((resolve, reject) => {
                loader.load(model, data => resolve(data), null, reject);
            });

            object.scale.set(0.015,0.015,0.015)
            object.translateOnAxis(new THREE.Vector3(0,1,0), -1)

            console.log(object.children)

            for (let path of animations){
                const animation = await new Promise((resolve, reject) => {
                    loader.load(path, data => resolve(data), null, reject);
                })
                object.animations.push(animation.animations[0])
            }

            this.mixer = new THREE.AnimationMixer(object);

            let run = this.mixer.clipAction(object.animations[3]); 
            let idle = this.mixer.clipAction(object.animations[4]);

            this.actions = [idle, run];
            idle.play()

            this.rightArm = object.getObjectByName('mixamorigRightArm');
            this.leftArm  = object.getObjectByName('mixamorigLeftArm');
            //console.log(this.rightArm)

            this.gameObject.transform.add(object);
            console.log("loaded")

            let btn = document.querySelector('#button');

            //let that = this;
            btn.onclick = function(){
                run.time = 0.0;
                run.setEffectiveTimeScale(1.0);
                run.setEffectiveWeight(1.0)
                run.crossFadeFrom(idle, 0.5, true);
                run.play()
            }

        })();

        this.slider1 = document.querySelector('#slider1');
    }

    update(dt){
        console.log(this.slider1.value)
        if (this.mixer){
            this.mixer.update(dt);
            //this.rightArm.rotation.y = this.slider1.value / 100;
            this.rightArm.rotation.y = THREE.MathUtils.degToRad(this.slider1.value);
            this.leftArm.rotation.y = THREE.MathUtils.degToRad(this.slider1.value);

        }
    }
}

export class FirstPersonCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject)
        this.name = "camera";
        this.camera = camera;
		this._look = new THREE.Vector3()
        this.transform = new THREE.Object3D();
        this.transform.translateY(0.5)
        this.transform.add(this.camera);
        this.gameObject.transform.add(this.transform)
    }

    get position(){
        return this.camera.position;
    }

    update(dt){
		this._look.subVectors(this.gameObject.position, this.gameObject.direction)
		this.transform.lookAt(this._look)
    }
}
