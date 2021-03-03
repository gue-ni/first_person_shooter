import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { SemiAutomaticWeapon } from './weapons.js'
import { AABB, Box, Gravity  } from './components.js';
import { GameObject} from './gameobject.js'
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

const objects 	= []
const boxes = []
const rays 		= []
const space_hash = new SpaceHash(2)


for (let i = 0; i < 100; i++){
	let testObject = new GameObject(scene)
	//testObject.addComponent(new Gravity(testObject))
	let aabb = testObject.addComponent(new AABB(testObject, new THREE.Vector3(2,2,2)))
	testObject.addComponent(new Box(testObject,  new THREE.Vector3(2,2,2), 0xff0051, true, false))

	testObject.position.set(Math.floor(Math.random()*map_width)-map_width/2, 
							Math.floor(Math.random() * 10), 
							Math.floor(Math.random()*map_depth)-map_depth/2)

	testObject.transform.matrixAutoUpdate = false
	testObject.transform.updateMatrix();

	space_hash.insert(aabb)
	boxes.push(aabb)
}

// Create the Ground
let ground 		= new GameObject(scene)
let ground_aabb = ground.addComponent(new AABB(ground, new THREE.Vector3(map_width,2,map_depth)))
ground.addComponent(new Box(ground, new THREE.Vector3(map_width,2,map_depth), 0x90b325, false, true))
ground.position.set(0,-2,0)

// Create the Player
let player = new GameObject(scene)
player.addComponent(new WASDMovement(player))
//let gun = player.addComponent(new SemiAutomaticWeapon(player, rays))
let fpv = player.addComponent(new FPSCamera(player, camera))
player.addComponent(new Gravity(player))
player.addComponent(new AABB(player, new THREE.Vector3(1,2,0.5)))
player.addComponent(new Box(player,  new THREE.Vector3(1,2,0.5), 0xff0051, true, false))
player.position.set(10,10,0)
objects.push(player)

/*
let g = new GameObject(scene)
g.addComponent(new SemiAutomaticWeapon(g, rays))
g.position.set(0,0,0)
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


// create ligths
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


//player.transform.add(camera)

let then = 0, dt = 0
let first = true
function animate(now) {

	now *= 0.001;
	dt   = now - then;
	then = now;


	if (first) {
		renderer.shadowMap.needsUpdate = true
		first = false
	} else {
		renderer.shadowMap.needsUpdate = false
	}

//	space_hash.clear()
//    objects.forEach(object => space_hash.insert(object.getComponent("aabb")))
	
	for (let i = 0; i < objects.length; i++){
		objects[i].update(dt);
		let aabb = objects[i].getComponent("aabb")

		for (let other of space_hash.find_possible_collisions(aabb)){
			if (other != objects[i]){ other.collideAABB(aabb) }
		}

		ground_aabb.collideAABB(aabb)
		/*
		for (let ray of rays){
			if (ray.intersect(aabb) && objects[i] != player){
				console.log("hit")
			}
		}
		*/
	}

	//rays.length = 0


	// debug
	//camera.position.set(player.position.x+5, player.position.y+5, player.z)
	//camera.lookAt(player.position)

	
	stats.update()	
	/*console.log("Scene polycount:", renderer.info.render.triangles)
	console.log("Active Drawcalls:", renderer.info.render.calls)
	console.log("Textures in Memory", renderer.info.memory.textures)
	console.log("Geometries in Memory", renderer.info.memory.geometries)*/
	renderer.render(scene, camera)
	requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

