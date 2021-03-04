import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { SemiAutomaticWeapon, FullyAutomaticWeapon } from './weapons.js'
import { AABB, Box, Gravity } from './components.js';
import { GameObject, GameObjectArray} from './gameobject.js'
import { WASDMovement, FPSCamera } from './input.js'
import { Ray } from './ray.js'
import { SpaceHash } from './spacehash.js'

const canvas  = document.querySelector('#c');
const slider1 = document.querySelector('#slider')
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
const boxes 	= []
const bullets 		= []
let network_data = []
const space_hash = new SpaceHash(2)
const gameObjectArray = new GameObjectArray()


for (let i = 0; i < 5; i++){
	let size 		= new THREE.Vector3(2,2,2)
	let testObject 	= new GameObject(scene)
	let aabb 		= testObject.addComponent(new AABB(testObject, size))

	testObject.addComponent(new Box(testObject,  size, 0xff0051, true, false))
	testObject.position.set(Math.floor(Math.random()*map_width)-map_width/2, Math.floor(Math.random()*10), 
							Math.floor(Math.random()*map_depth)-map_depth/2)

	testObject.transform.matrixAutoUpdate = false
	testObject.transform.updateMatrix();

	space_hash.insert(aabb)
	boxes.push(aabb)
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
player.position.set(10,10,0)
console.log(player.id)


gameObjectArray.add(player)

/*
let otherPlayer = new GameObject(scene);
otherPlayer.addComponent(new Gravity(otherPlayer));
otherPlayer.addComponent(new AABB(otherPlayer, new THREE.Vector3(1,2,0.5)))
otherPlayer.addComponent(new Box(otherPlayer,  new THREE.Vector3(1,2,0.5), 0x0A75AD, false, false))
otherPlayer.position.set(15, 10, 14)
gameObjectArray.add(otherPlayer)
*/

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
/*
{
	const light = new THREE.PointLight( 0xff0000, 1, 100 );
	light.position.set( 50, 50, 50 );
	scene.add( light );
}
*/
{
	//const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
	//scene.add( light );
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


let websocket = new WebSocket("ws://localhost:6788/");
let users = document.querySelector('.users')

websocket.onmessage = function (event) {
	let data = JSON.parse(event.data);
	switch (data.type) {

	    case 'state':
	       	//console.log(data.players)

	       	for (let id in data.players){
	       		if (!(id in network_data) && id != player.id){
	       			let newPlayer = data.players[id]
	       			console.log(`new player ${id} joined ${newPlayer}`)

	       			let otherPlayer = new GameObject(scene);
					otherPlayer.addComponent(new Gravity(otherPlayer));
					otherPlayer.addComponent(new AABB(otherPlayer, new THREE.Vector3(1,2,0.5)))
					otherPlayer.addComponent(new Box(otherPlayer,  new THREE.Vector3(1,2,0.5), 0x0A75AD, false, false))
					otherPlayer.position.set(newPlayer[0], newPlayer[1], newPlayer[2])
					otherPlayer.id = id
					gameObjectArray.add(otherPlayer)
	       		}
	       	}

	       	network_data = data.players
	       	users.textContent = Object.keys(network_data).length
	        break;

	    case 'users':
	        users.textContent = (data.count.toString() + (data.count == 1 ? " player" : " players"));
	        break;

	    default:
	        console.error("unsupported event", data);
	}
};

let then = 0, dt = 0
let first = true

const animate = function(now) {
	requestAnimationFrame(animate)

	now *= 0.001;
	dt   = now - then;
	then = now;

	if (first) {
		renderer.shadowMap.needsUpdate = true
		first = false
	} else {
		renderer.shadowMap.needsUpdate = false
	}

	gameObjectArray.forEach(gameObject => {

		
		if (gameObject.id != player.id){
			let pos = network_data[gameObject.id];
			if (pos){
				gameObject.position.set(pos[0], pos[1], pos[2])
			}
		} 

		gameObject.update(dt)

		let aabb = gameObject.getComponent("aabb");

		for (let otherObject of space_hash.find_possible_collisions(aabb)){
			if (otherObject != gameObject){ otherObject.collideAABB(aabb); }
		}
	
		ground_aabb.collideAABB(aabb);

		for (let bullet of bullets){
			if (bullet.owner != gameObject){
				if (bullet.intersect(aabb)){
					console.log("hit")
				}
			}
		}
	})

	//console.log(bullets.length)
	bullets.length = 0;

	if (websocket.readyState === WebSocket.OPEN){
		let data = {
			action: 'update', 
			id: player.id,
			player_data: [player.position.x, player.position.y, player.position.z]
		}
		websocket.send(JSON.stringify(data));
	}

	// debug
	//camera.position.set(player.position.x+5, player.position.y+5, player.z)
	//camera.lookAt(player.position)
	
	stats.update()	
	renderer.render(scene, camera)
}

requestAnimationFrame(animate)



