import * as THREE from './three/build/three.module.js';

import { GameObject, GameObjectArray } from './game-object.js';
import { Box, EventRelay, HUD, Physics, SimpleGLTFModel, SimpleGunModel } from './components.js';
import { AABB } from './collision.js';
import { Smoke } from './particles.js';
import { FirstPersonCamera, Health, PlayerInput } from './player-components.js';
import { HitscanEmitter, ProjectileEmitter, MuzzleFlash, WeaponController, Inventory, Explosive } from './weapon-components.js';
import { LocalCC, NetworkCC } from './character-controller.js';
import { ActiveNetworkComponent, PassiveNetworkComponent } from './networking.js';
import { AmmoDisplay, HealthDisplay, HitDisplay } from './ui.js';

export class Factory {
    constructor(scene, camera, listener, gameObjectArray, hashGrid, network){
        this.scene = scene;
        this.camera = camera;
        this.listener = listener;
        this.gameObjectArray = gameObjectArray;
        this.hashGrid = hashGrid;
        this.network = network
    }

    createProjectile(network){
        let projectile = new GameObject(this.scene);

        let size = new THREE.Vector3(0.1, 0.1, 0.1);
        projectile.addComponent(new Box(projectile, {
            color: 0xffff00,
            size: size
        }));

        projectile.addComponent(new Physics(projectile));
        projectile.addComponent(new AABB(projectile, size));
        projectile.addComponent(new Explosive(projectile, network.explosions));
        projectile.lifetime = 2;
        
        this.gameObjectArray.add(projectile);
        return projectile;
    }

    createNetworkPlayer(network, params){
        let player = new GameObject(this.scene);
        player.id = params.id;
        player.addComponent(new NetworkCC(player))
        player.addComponent(new PassiveNetworkComponent(player, network));
        this.gameObjectArray.add(player);
    }

    createPlayer(network){
        let player = new GameObject(this.scene)

        // hud
        player.addComponent(new HealthDisplay(player));
        player.addComponent(new HitDisplay(player));

        player.addComponent(new PlayerInput(player, network, this.hashGrid))
        player.addComponent(new LocalCC(player));
        player.addComponent(new ActiveNetworkComponent(player, network, "player"));
        player.addComponent(new Health(player))
        player.addComponent(new Physics(player))
        player.addComponent(new AABB(player, new THREE.Vector3(1,2,1)))
        player.addComponent(new FirstPersonCamera(player, this.camera))       
        
        this.createPrimaryWeapon(player, network)
        this.createSecondaryWeapon(player, network)
        
        player.position.set(0,0,0)
        player.publish("spawn", {});
        this.gameObjectArray.add(player)
        return player;
    }

    createPrimaryWeapon(player, network){

        let fpv = player.getComponent("FirstPersonCamera");
 
        let primary = new GameObject(fpv.transform);
        primary.addComponent(new HitscanEmitter(primary, network.rays, player.id));
        primary.addComponent(new AmmoDisplay(primary));
        primary.addComponent(new WeaponController(primary, 620, 30));
        primary.addComponent(new EventRelay(primary, player, ["trigger", "reload", "toggleGun", "spawn"]));
        primary.addComponent(new MuzzleFlash(primary, new THREE.Vector3(0.1, -0.2, -0.5), this.listener, new Smoke(this.scene)));
        primary.addComponent(new SimpleGunModel(primary, './assets/objects/AUG2.glb', {
            position: new THREE.Vector3(0.1,-0.4,-0.1),
            scale: new THREE.Vector3(0.1,0.1,0.1),
            rotation: new THREE.Vector3(0,-Math.PI,0)
        }));
        this.gameObjectArray.add(primary);
        return primary;
    }

    createSecondaryWeapon(player, network){
        let fpv = player.getComponent("FirstPersonCamera");
        
        let secondary = new GameObject(fpv.transform);
        secondary.transform.visible = secondary.active = false;
        secondary.addComponent(new AmmoDisplay(secondary));
        secondary.addComponent(new WeaponController(secondary, 200, 10));
        secondary.addComponent(new MuzzleFlash(secondary, new THREE.Vector3(0.1,-0.4,-1.2), this.listener, new Smoke(this.scene)));
        secondary.addComponent(new ProjectileEmitter(secondary, network.projectiles, this));
        secondary.addComponent(new EventRelay(secondary, player, ["trigger", "reload", "toggleGun", "spawn"]));
        secondary.addComponent(new Box(secondary, {
            size: new THREE.Vector3(0.25,0.25,1), 
            color: 13882323, 
            receiveShadow: false, 
            castShadow: false,
            position: new THREE.Vector3(0.1, -0.4, -0.1)
        }))
        this.gameObjectArray.add(secondary);
        return secondary;
    }

    createGroundBox(pos, size){
		let testObject 	= new GameObject(this.scene)
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();

		testObject.addComponent(new Box(testObject,  {
            size: size, 
            color: 10066329,
            receiveShadow: true,
            castShadow: true
        }));

		let aabb = testObject.addComponent(new AABB(testObject, size))
		this.hashGrid.insert(aabb)
        return testObject;
    }    

    createEnvironmentBox(pos, size){
		let testObject 	= new GameObject(this.scene)
		testObject.position.set(pos.x, pos.y, pos.z);
		testObject.transform.matrixAutoUpdate = false
		testObject.transform.updateMatrix();

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
}



