import * as THREE from './three/build/three.module.js';

import { SemiAutomaticWeapon, FullAutoWeapon, Inventory } from './weapons.js'
import { GameObject, GameObjectArray} from './gameobject.js';
import { Box, Gravity } from './components.js';
import { WASDMovement, FPSCamera, Health } from './player.js';
import { AABB } from './collide.js';
import { SpaceHash } from './spacehash.js';
import { Ray } from './ray.js';

export class Factory {
    constructor(scene, camera, listener, gameObjectArray, spaceHash){
        this.scene = scene;
        this.camera = camera;
        this.listener = listener;
        this.gameObjectArray = gameObjectArray;
        this.spaceHash = spaceHash;
    }

    createPlayer(bullets){
        let player = new GameObject(this.scene)
        
        player.fpv = player.addComponent(new FPSCamera(player, this.camera))

        let inventory = player.addComponent(new Inventory(player));
        //inventory.weapons.push(new SemiAutomaticWeapon(player, bullets, this.listener));
        inventory.weapons.push(new FullAutoWeapon(player, bullets, this.listener, 625));

        player.addComponent(new WASDMovement(player))
        player.addComponent(new Gravity(player))
        player.health = player.addComponent(new Health(player));
        player.addComponent(new AABB(player, new THREE.Vector3(1,2,0.5)))
        player.addComponent(new Box(player,  new THREE.Vector3(1,2,0.5), 0x999999, false, false))
        player.position.set(Math.floor(Math.random()*50)-50/2,Math.floor(Math.random()*5),Math.floor(Math.random()*50)-50/2)
        
        this.gameObjectArray.add(player)
       
        return player;
    }

    createEnvironmentBox(pos){
		let size 		= new THREE.Vector3(2,2,2)
		let testObject 	= new GameObject(this.scene)
		let aabb 		= testObject.addComponent(new AABB(testObject, size))
		testObject.addComponent(new Box(testObject,  size, 0xD3D3D3, true, false))
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();
		this.spaceHash.insert(aabb)
        return testObject;
    }

    createNetworkPlayer(){}
}



