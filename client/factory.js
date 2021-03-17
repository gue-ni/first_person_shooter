import * as THREE from './three/build/three.module.js';

import { GameObject, GameObjectArray} from './game-object.js';
import { Box, EventRelay, HUD, Physics, SimpleGLTFModel } from './components.js';
import { WASDMovement, FirstPersonCamera, Health } from './player.js';
import { AABB } from './collision.js';
import { HashGrid } from './hashgrid.js';
import { Smoke } from './particles.js';
import { CharacterController, PlayerInput } from './player-components.js';
import { HitscanEmitter, ProjectileEmitter, MuzzleFlash, WeaponController, Inventory } from './weapon-components.js';

export class Factory {
    constructor(scene, camera, listener, gameObjectArray, hashGrid){
        this.scene = scene;
        this.camera = camera;
        this.listener = listener;
        this.gameObjectArray = gameObjectArray;
        this.hashGrid = hashGrid;
    }

    createProjectile(){
        let projectile = new GameObject(this.scene);
        projectile.addComponent(new Box(projectile, new THREE.Vector3(0.25,0.25,0.25), 13882323, false, false));
        projectile.addComponent(new Physics(projectile));
        return projectile;
    }

    createPlayer(rays, projectiles){
        let player = new GameObject(this.scene)
        
        let hud = new HUD();

        player.addComponent(new PlayerInput(player))
        player.addComponent(new CharacterController(player, this.hashGrid));

        player.addComponent(new Physics(player))
        player.addComponent(new AABB(player, new THREE.Vector3(1,2,0.5)))
        //player.addComponent(new Box(player, new THREE.Vector3(1,2,1), 10066329,false, false))
        
        player.health   = player.addComponent(new Health(player));
        player.fpv      = player.addComponent(new FirstPersonCamera(player, this.camera))
       
        /*
        let primary = new GameObject(player.fpv.transform);
        primary.addComponent(new HitscanEmitter(primary, rays));
        primary.addComponent(new WeaponController(primary, hud, 620, 30));
        primary.addComponent(new EventRelay(primary, player, ["trigger", "reload"]));
        primary.addComponent(new MuzzleFlash(primary, new THREE.Vector3(0.1,-0.4,-1.2), this.listener, new Smoke(this.scene)));
        primary.addComponent(new SimpleGLTFModel(primary, './assets/AUG2.glb', {
            position: new THREE.Vector3(0.1,-0.4,-0.1),
            scale: new THREE.Vector3(0.1,0.1,0.1),
            rotation: new THREE.Vector3(0,-Math.PI,0)
        }));
        this.gameObjectArray.add(primary);

        let secondary = new GameObject(player.fpv.transform);
        secondary.addComponent(new WeaponController(secondary, hud, 200, 10));
        secondary.addComponent(new MuzzleFlash(secondary, new THREE.Vector3(0.1,-0.4,-1.2), this.listener, new Smoke(this.scene)));
        secondary.addComponent(new ProjectileEmitter(secondary, projectiles, this.gameObjectArray));
        secondary.addComponent(new EventRelay(secondary, player, ["trigger", "reload"]));
        secondary.addComponent(new Box(secondary, {
            size: new THREE.Vector3(0.25,0.25,1), 
            color: 13882323, 
            receiveShadow: false, 
            castShadow: false,
            position: new THREE.Vector3(0.1, -0.4, -0.1)
        }))
        this.gameObjectArray.add(secondary);
        
        player.addComponent(new Inventory(player, primary, secondary));
        */

        player.position.set(0,0,0)
        this.gameObjectArray.add(player)
        return player;
    }

    createGroundBox(pos, size){
		let testObject 	= new GameObject(this.scene)
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();

		//testObject.addComponent(new Box(testObject,  size, 10066329, true, true))
		testObject.addComponent(new Box(testObject,  {
            size: size, 
            color: 10066329,
            receiveShadwo: true,
            castShadow: true
        }));

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

		//testObject.addComponent(new Box(testObject,  size, 0xD3D3D3, true, false))
		testObject.addComponent(new Box(testObject,  {
            size: size, 
            color: 0xD3D3D3,
            receiveShadow: false,
            castShadow: true
        }));

		let aabb = testObject.addComponent(new AABB(testObject, size))
		this.hashGrid.insert(aabb)
        return testObject;
    }

    createNetworkPlayer(){}
}



