import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { SemiAutomaticWeapon, FullyAutomaticWeapon } from './weapons.js'
import { GameObject, GameObjectArray} from './gameobject.js'
import { AABB, Box, Gravity } from './components.js';
import { WASDMovement, FPSCamera } from './input.js'
import { SpaceHash } from './spacehash.js'
import { Ray } from './ray.js'

const canvas  = document.querySelector('#c');
const slider1 = document.querySelector('#slider')
const hit = document.querySelector('#hit')
const crosshair = document.querySelector('#crosshair')
const taking_hits = document.querySelector('#taking_hits')

const window_width 	= canvas.width
const window_height = canvas.height

const scene 	= new THREE.Scene()
const camera 	= new THREE.PerspectiveCamera(77, window_width / window_height, 0.1, 100)
const renderer 	= new THREE.WebGLRenderer({canvas: canvas, antialias: true,  powerPreference: "high-performance"})

renderer.setClearColor("#222222")

const stats = new Stats()
document.body.appendChild(stats.dom)


renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap
//renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.autoUpdate = false

window.addEventListener('resize', () => {
	let width = window_width
	let height = window_height
	renderer.setSize(width, height)
	camera.aspect = width / height
	camera.updateProjectionMatrix()
})
canvas.requestPointerLock 	= canvas.requestPointerLock || canvas.mozRequestPointerLock;
document.exitPointerLock 	= document.exitPointerLock  || document.mozExitPointerLock;
canvas.onclick = function() { canvas.requestPointerLock(); };
document.addEventListener('pointerlockchange', 	  lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
function lockChangeAlert() {
	if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
		document.addEventListener("mousemove", mouse, false);
	} else {
		document.removeEventListener("mousemove", mouse, false);
	}
}

const debug = document.querySelector('#debug')
const map_width = 50, map_depth = 50
const bullets 	 = []
let network_data = []
const space_hash = new SpaceHash(2)
const gameObjectArray = new GameObjectArray()

for (let i = 0; i < 50; i++){
	let size 		= new THREE.Vector3(2,2,2)
	let testObject 	= new GameObject(scene)
	let aabb 		= testObject.addComponent(new AABB(testObject, size))

	testObject.addComponent(new Box(testObject,  size, 0xff0051, true, false))
	testObject.position.set(Math.floor(Math.random()*map_width)-map_width/2, Math.floor(Math.random()*10)-2, 
							Math.floor(Math.random()*map_depth)-map_depth/2)

	testObject.transform.matrixAutoUpdate = false
	testObject.transform.updateMatrix();

	space_hash.insert(aabb)
}

// Create the Ground

let ground 		= new GameObject(scene)
let ground_aabb = ground.addComponent(new AABB(ground, new THREE.Vector3(map_width,10,map_depth)))
ground.addComponent(new Box(ground, new THREE.Vector3(map_width,10,map_depth), 0x90b325, false, true))
ground.position.set(0,-10,0)
ground.transform.matrixAutoUpdate = false
ground.transform.updateMatrix();

// Create the Player

let player = new GameObject(scene)
let fpv = player.addComponent(new FPSCamera(player, camera))
player.addComponent(new WASDMovement(player))
player.addComponent(new FullyAutomaticWeapon(player, bullets, 600))
//player.addComponent(new SemiAutomaticWeapon(player, bullets))
player.addComponent(new Gravity(player))
player.addComponent(new AABB(player, new THREE.Vector3(1,2,0.5)))
player.addComponent(new Box(player,  new THREE.Vector3(1,2,0.5), 0xff0051, false, false))
player.position.set(Math.floor(Math.random()*map_width)-map_width/2, 
					Math.floor(Math.random()*5), 
					Math.floor(Math.random()*map_depth)-map_depth/2)
console.log(player.id)

gameObjectArray.add(player)

function mouse(event){
	fpv.yaw   += (event.movementX * 0.1)
	fpv.pitch += (event.movementY * 0.1)

	let pitch = -fpv.pitch;
	if (pitch >  89) pitch =  89
	if (pitch < -89) pitch = -89

	player.direction.x = Math.cos(fpv.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
	player.direction.y = Math.sin(pitch*(Math.PI/180))
	player.direction.z = Math.sin(fpv.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
	player.direction.normalize()
}


{
	scene.add(new THREE.AmbientLight(0xffffff, 0.5))
}
{
	const light = new THREE.DirectionalLight(0xffffff, 1, 100);
	light.position.set(0, 50, 50); 
	light.castShadow 			=  true; 
	light.shadow.mapSize.width 	=  512; 
	light.shadow.mapSize.height =  512; 
	light.shadow.camera.near 	=  0.5; 
	light.shadow.camera.far 	=  100; 
	light.shadow.camera.left 	= -100
	light.shadow.camera.bottom 	= -100
	light.shadow.camera.top  	=  100
	light.shadow.camera.right	=  100
	scene.add(light)
}

let websocket = new WebSocket(false ? "ws://localhost:5000/" : "ws://bezirksli.ga/game/ws/");
let users = document.querySelector('.users')

websocket.onmessage = function (event) {
	let data = JSON.parse(event.data);

	//console.log(data.hit)
	
	if (data.hit){
		crosshair.innerText = "x"
	} else {
		crosshair.innerText = `+`
	}

	if (data.players){
       	network_data = data.players
	}

	if (data.connected){
		//console.log(`${data.connected.length} players connected`)
		//console.log(data)
		
		for (let player of data.connected){
			console.log(`player ${player.id} connected`);

			let newGameObject = new GameObject(scene);
			newGameObject.addComponent(new Gravity(newGameObject));
			newGameObject.addComponent(new AABB(newGameObject, new THREE.Vector3(1,2,0.5)));
			newGameObject.addComponent(new Box(newGameObject,  new THREE.Vector3(1,2,0.5), 0x0A75AD, false, false));

			newGameObject.position.set( player.player_data[0], player.player_data[1], player.player_data[2]);
			newGameObject.direction.set(player.player_data[3], player.player_data[4], player.player_data[5]);

			newGameObject.id = player.id;

			gameObjectArray.add(newGameObject);
		}
	}

	if (data.disconnected){ // TODO implement
		console.log(`player ${data.disconnected} disconnected`)
		let gameObject = gameObjectArray.get(data.disconnected)
		gameObject.remove(scene);
		gameObjectArray.remove(gameObject)
	}

	if (data.hit_by){
		console.log("you were hit")
		taking_hits.style.display = 'block'
	} else {
		taking_hits.style.display  = 'none'
	}
};

let then = 0, dt = 0
let first = true

const animate = function(now) {
	requestAnimationFrame(animate);

	now *= 0.001;
	dt   = now - then;
	then = now;

	if (first) {
		renderer.shadowMap.needsUpdate = true;
		first = false
	} else {
		renderer.shadowMap.needsUpdate = false;
	}

	gameObjectArray.forEach(gameObject => {
		
		if (gameObject.id != player.id){ 
			let pos_and_dir = network_data[gameObject.id];
			if (pos_and_dir){
				gameObject.position.set( pos_and_dir[0], pos_and_dir[1], pos_and_dir[2]);
				gameObject.direction.set(pos_and_dir[3], pos_and_dir[4], pos_and_dir[5]);

				let look = new THREE.Vector3();
				look.subVectors(gameObject.position, gameObject.direction);
				gameObject.transform.lookAt(look);
			}
		} else { 

			// should also be done for other non networking objects, not just player

			gameObject.update(dt);

			let aabb = gameObject.getComponent("aabb");

			for (let otherObject of space_hash.find_possible_collisions(aabb)){
				if (otherObject != gameObject){ otherObject.collideAABB(aabb); }
			}
		
			ground_aabb.collideAABB(aabb);

			/*
			// TODO remove
			for (let bullet of bullets){
				if (bullet.owner != gameObject){
					if (bullet.intersect(aabb)){
						console.log("hit")
					}
				}
			}
			*/
		}
	})

	//console.log(`${player.velocity.length()}`)

	if (websocket.readyState === WebSocket.OPEN){
		let data = {}

		if (Math.abs(player.velocity.length()) > 0.1){
			data['player_data'] = [  player.position.x, player.position.y, player.position.z, player.direction.x, player.direction.y, player.direction.z ];
		}

		if (bullets.length > 0){
			let b = [];

			bullets.forEach(el => {
				b.push([ el.origin.x,el.origin.y,el.origin.z, el.direction.x,el.direction.y,el.direction.z ]);
			});

			data['bullets'] = b
		}
		
		if (data.player_data || data.bullets){
			data['id'] = player.id
			
			//if (data.bullets) console.log(data)
			websocket.send(JSON.stringify(data));
		}
	}

	bullets.length = 0;

	// debug
	//camera.position.set(player.position.x+5, player.position.y+5, player.z)
	//camera.lookAt(player.position)
	
	stats.update()	
	renderer.render(scene, camera)
}

requestAnimationFrame(animate)



