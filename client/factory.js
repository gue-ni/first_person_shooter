import * as THREE from './three/build/three.module.js';

import { SemiAutomaticWeapon, FullAutoWeapon, Inventory, ProjectileWeapon } from './weapons.js'
import { GameObject, GameObjectArray} from './gameobject.js';
import { Box, Physics } from './components.js';
import { WASDMovement, FirstPersonCamera, Health } from './player.js';
import { AABB } from './collision.js';
import { HashGrid } from './hashgrid.js';
import { Smoke } from './particles.js';
import { CharacterController, PlayerInput } from './character.js';

export class Factory {
    constructor(scene, camera, listener, gameObjectArray, hashGrid){
        this.scene = scene;
        this.camera = camera;
        this.listener = listener;
        this.gameObjectArray = gameObjectArray;
        this.hashGrid = hashGrid;
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

    createProjectileRifle(owner, bullets){
        let gun = new ProjectileWeapon(owner, bullets, this.listener, this.gameObjectArray, this.scene);
        gun.smoke = new Smoke(this.scene, new THREE.Vector3(0,0,0));
        gun.smoke.active = false;
        return gun;
    }    

    createPlayer(hitscanBullets, projectiles){
        let player = new GameObject(this.scene)

        
        //player.addComponent(new WASDMovement(player, this.hashGrid))
        player.addComponent(new CharacterController(player, new PlayerInput(), this.hashGrid));
        player.addComponent(new Physics(player))
        player.addComponent(new AABB(player, new THREE.Vector3(1,2,0.5)))
        player.addComponent(new Box(player,  new THREE.Vector3(1,2,0.5), 0x999999, false, false))
        player.health   = player.addComponent(new Health(player));
        player.fpv      = player.addComponent(new FirstPersonCamera(player, this.camera))
        
        let inventory = player.addComponent(new Inventory(player));
        inventory.add(this.createRifle(player, hitscanBullets));
        inventory.add(this.createProjectileRifle(player, hitscanBullets));

        player.position.set(0,0,0)
        this.gameObjectArray.add(player)
        return player;
    }

    createGroundBox(pos, size){
		let testObject 	= new GameObject(this.scene)
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();

		testObject.addComponent(new Box(testObject,  size, 10066329, true, true))
		let aabb = testObject.addComponent(new AABB(testObject, size))
		this.hashGrid.insert(aabb)
        return testObject;
    }    

    createEnvironmentBox(pos, size){
		//let size 		= new THREE.Vector3(2,2,2)
		let testObject 	= new GameObject(this.scene)
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();

		testObject.addComponent(new Box(testObject,  size, 0xD3D3D3, true, false))
		let aabb = testObject.addComponent(new AABB(testObject, size))
		this.hashGrid.insert(aabb)
        return testObject;
    }

    createNetworkPlayer(){}
}



