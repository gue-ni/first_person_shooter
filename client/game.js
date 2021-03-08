import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { SemiAutomaticWeapon, FullAutoWeapon, FullyAutomaticWeapon, Inventory } from './weapons.js'
import { GameObject, GameObjectArray} from './gameobject.js';
import { Box, Gravity } from './components.js';
import { WASDMovement, FPSCamera } from './input.js';
import { AABB } from './collide.js';
import { SpaceHash } from './spacehash.js';
import { Ray } from './ray.js';
import { ParticleSystem, MuzzleFlash } from './particles.js';
import { Factory } from './factory.js';

const canvas  		= document.querySelector('#c');
const slider1 		= document.querySelector('#slider1');
const slider2 		= document.querySelector('#slider2');
const slider3 		= document.querySelector('#slider3');
const hit 			= document.querySelector('#hit');
const crosshair 	= document.querySelector('#crosshair');
const taking_hits 	= document.querySelector('#taking_hits');
const users 		= document.querySelector('#users');

const clear_color 	= "#8009E8";
const DARK_GRAY 	= 0x999999;
const LIGHT_GRAY	= 0xD3D3D3;
const PINK 			= 0xD70270;
const BLUE 			= 0x0038A8;
const PURPLE 		= 0x734F96;
const WHITE         = 0xffffff;

//canvas.height = window.innerHeight;
//canvas.width 	= window.innerWidth;
const window_width 	= canvas.width
const window_height = canvas.height

const scene 	= new THREE.Scene()
const camera 	= new THREE.PerspectiveCamera(77, window_width / window_height, 0.01, 100)
const renderer 	= new THREE.WebGLRenderer({canvas: canvas, antialias: true,  powerPreference: "high-performance"})
const listener = new THREE.AudioListener();
camera.add(listener);

renderer.setClearColor("#6AB9D9")

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
		document.addEventListener("mousemove", mouse_callback, false);
	} else {
		document.removeEventListener("mousemove", mouse_callback, false);
	}
}

const debug = document.querySelector('#debug')
const map_width = 50, map_depth = 50, map_height = 50
const bullets 	 = []
let network_data = []
const spaceHash = new SpaceHash(2)
const gameObjectArray = new GameObjectArray()


// Create the Player

const factory = new Factory(scene, camera, listener, gameObjectArray, spaceHash);
let player = factory.createPlayer(bullets)


let testObject = new GameObject(scene);
//let ps = new ParticleSystem(testObject, camera, 100, 1, 5);
//testObject.addComponent(new SemiAutomaticWeapon(testObject, bullets, listener));
gameObjectArray.add(testObject);


let geometry 	= new THREE.BoxBufferGeometry(map_width, map_height, map_depth);
let material 	= new THREE.MeshPhongMaterial({ color: DARK_GRAY, flatShading: true,side: THREE.BackSide })
let mesh 		= new THREE.Mesh(geometry, material)
mesh.position.set(0,20,0);
scene.add(mesh);

function mouse_callback(event){
	player.fpv.yaw   += (event.movementX * 0.1)
	player.fpv.pitch += (event.movementY * 0.1)
	let pitch = -player.fpv.pitch;
	if (pitch >  89) pitch =  89
	if (pitch < -89) pitch = -89

	player.direction.x = Math.cos(player.fpv.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
	player.direction.y = Math.sin(pitch*(Math.PI/180))
	player.direction.z = Math.sin(player.fpv.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
	player.direction.normalize()
}


const pinkLight = new THREE.PointLight(PINK, 3, 100, 2);
pinkLight.position.set(-25, 50, -25);
scene.add(pinkLight);
const blueLight = new THREE.PointLight(BLUE, 3, 100, 2);
blueLight.position.set(25, 50, 25);
scene.add(blueLight);
scene.add(new THREE.AmbientLight(WHITE, 0.2))
const light = new THREE.DirectionalLight(WHITE, 0.5, 100);
light.position.set(0, 50, 25)
light.castShadow 			=  true; 
light.shadow.mapSize.width 	=  512; 
light.shadow.mapSize.height =  512; 
light.shadow.camera.near 	=  0.5; 
light.shadow.camera.far 	=  100;
light.shadow.camera.left 	= -50;
light.shadow.camera.bottom 	= -50;
light.shadow.camera.top  	=  50;
light.shadow.camera.right	=  50;
scene.add(light)
//scene.add(new THREE.CameraHelper(light.shadow.camera))


let websocket = new WebSocket(true ? "ws://localhost:5000/" : "ws://bezirksli.ga/game/ws/");
websocket.onmessage = function (event) {
	let data = JSON.parse(event.data);

	//console.log(data.hit)
	
	if (data.hit){
		crosshair.innerText = "x"
	} else {
		crosshair.innerText = `+`
	}

	if (data.players){ network_data = data.players }

	if (data.connected){
		for (let player of data.connected){
			console.log(`player ${player.id} connected`);
			let newGameObject = new GameObject(scene);
			newGameObject.id = player.id;
			newGameObject.local = false;
			newGameObject.addComponent(new Gravity(newGameObject));
			newGameObject.addComponent(new AABB(newGameObject, new THREE.Vector3(1,2,0.5)));
			newGameObject.addComponent(new Box(newGameObject,  new THREE.Vector3(1,2,0.5), LIGHT_GRAY, false, false));
			newGameObject.position.set( player.player_data[0], player.player_data[1], player.player_data[2]);
			newGameObject.direction.set(player.player_data[3], player.player_data[4], player.player_data[5]);

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
		taking_hits.style.display = 'block'
	} else {
		taking_hits.style.display  = 'none'
	}
};

const init = async function(){
	let resp = await fetch('./game_data.json');
	let json = await resp.json();

	for (let pos of json.boxes){
        factory.createEnvironmentBox(pos);
	}

    // bake shadows
	renderer.shadowMap.needsUpdate = true;
	renderer.render(scene, camera)
	renderer.shadowMap.needsUpdate = false;
	requestAnimationFrame(animate)
}

let then = 0, dt = 0
const animate = function(now) {
	requestAnimationFrame(animate);

	now *= 0.001;
	dt   = now - then;
	then = now;
	if (dt > 0.1) dt = 0.1;
	
	gameObjectArray.forEach(gameObject => {

		if (!gameObject.local){ 
			let pos_and_dir = network_data[gameObject.id];
			if (pos_and_dir){
				gameObject.position.set( pos_and_dir[0], pos_and_dir[1], pos_and_dir[2]);
				gameObject.direction.set(pos_and_dir[3], pos_and_dir[4], pos_and_dir[5]);

				let look = new THREE.Vector3();
				look.subVectors(gameObject.position, gameObject.direction);
				gameObject.transform.lookAt(look);
			}
		} else { 
			gameObject.update(dt);
			let aabb = gameObject.getComponent("aabb");

			if (aabb){
				for (let otherObject of spaceHash.find_possible_collisions(aabb)){
					if (otherObject != gameObject) otherObject.collideAABB(aabb); 
				}
				//ground_aabb.collideAABB(aabb);
			}

			if (gameObject.position.x > map_width/2-0.5){
				gameObject.position.x = map_width/2-0.5;

			} else if (gameObject.position.x < -map_width/2+0.5){
				gameObject.position.x 		 = -map_width/2+0.5;
			}
			if (gameObject.position.z > map_depth/2-0.5){
				gameObject.position.z = map_depth/2-0.5;

			} else if (gameObject.position.z < -map_depth/2+0.5){
				gameObject.position.z 		 = -map_depth/2+0.5;
			}

			if (gameObject.position.y > map_height-3){
				gameObject.position.y = map_height-3;
			} else if (gameObject.position.y < 0){
                gameObject.position.y = 0;
                gameObject.velocity.y = 0;
            }
		}
	})

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
			websocket.send(JSON.stringify(data));
		}
	}

	bullets.length = 0;

	// debug
	//let dir = player.direction.normalize().clone()
	//camera.position.set(player.position.x+dir.x, player.position.y+5, player.position.z+dir.z)
	//camera.lookAt(player.position)
	
	stats.update()	
	renderer.render(scene, camera)
}

init()
