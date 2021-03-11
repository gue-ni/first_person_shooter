import * as THREE from './three/build/three.module.js';

import { SemiAutomaticWeapon, FullAutoWeapon, Inventory } from './weapons.js'
import { GameObject, GameObjectArray} from './gameobject.js';
import { Box, Gravity } from './components.js';
import { WASDMovement, FPSCamera, Health } from './player.js';
import { AABB2 } from './collide.js';
import { SpaceHash } from './spacehash.js';
import { Smoke } from './particles.js';

export class Factory {
    constructor(scene, camera, listener, gameObjectArray, spaceHash){
        this.scene = scene;
        this.camera = camera;
        this.listener = listener;
        this.gameObjectArray = gameObjectArray;
        this.spaceHash = spaceHash;
    }

    createPistol(owner, bullets){
        let gun = new SemiAutomaticWeapon(owner, bullets, this.listener);
        gun.smoke = new Smoke(this.scene, new THREE.Vector3(0,0,0));
        gun.smoke.active = false;
        return gun;

    }

    createRifle(owner, bullets){
        let gun = new FullAutoWeapon(owner, bullets, this.listener, 625);
        gun.smoke = new Smoke(this.scene, new THREE.Vector3(0,0,0));
        gun.smoke.active = false;
        return gun;
    }

    createFullInventory(owner, bullets){
        let inventory = owner.addComponent(new Inventory(owner));
        inventory.weapons.push(this.createRifle( owner, bullets));
        //inventory.weapons.push(this.createPistol(owner, bullets));
        return inventory;
    }

    createPlayer(bullets){
        let player = new GameObject(this.scene)
        
        player.fpv = player.addComponent(new FPSCamera(player, this.camera))

        //let inventory = player.addComponent(this.createFullInventory(player, bullets));
        //inventory.weapons.push(this.createRifle(player, bullets));

        player.rifle = player.addComponent(this.createRifle(player, bullets))


        player.addComponent(new WASDMovement(player))
        player.addComponent(new Gravity(player))
        player.health = player.addComponent(new Health(player));
        player.addComponent(new AABB2(player, new THREE.Vector3(1,2,0.5)))
        player.addComponent(new Box(player,  new THREE.Vector3(1,2,0.5), 0x999999, false, false))
        //player.position.set(Math.floor(Math.random()*50)-50/2,Math.floor(Math.random()*5),Math.floor(Math.random()*50)-50/2)
        player.position.set(0,0,0)
        
        this.gameObjectArray.add(player)
       
        return player;
    }

    

    createEnvironmentBox(pos){
		let size 		= new THREE.Vector3(2,2,2)
		let testObject 	= new GameObject(this.scene)
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();

		testObject.addComponent(new Box(testObject,  size, 0xD3D3D3, true, false))
		let aabb = testObject.addComponent(new AABB2(testObject, size))
		this.spaceHash.insert(aabb)
        return testObject;
    }

    createNetworkPlayer(){}
}



