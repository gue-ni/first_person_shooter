import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { GameObject, GameObjectArray} from './gameobject.js';
import { Box, Gravity } from './components.js';
import { AABB } from './collide.js';
import { SpaceHash } from './spacehash.js';
import { Factory } from './factory.js';
import { ParticleSystem, Smoke } from './particles.js';
import { AABB2 } from './collide.js';

const canvas  		= document.querySelector('#canvas');
const slider1 		= document.querySelector('#slider1');
const slider2 		= document.querySelector('#slider2');
const slider3 		= document.querySelector('#slider3');
const hit 			= document.querySelector('#hit');
const crosshair 	= document.querySelector('#crosshair');
const taking_hits 	= document.querySelector('#taking_hits');
const users 		= document.querySelector('#users');
const debug         = document.querySelector('#debug')
const checkbox      = document.querySelector('#state');
const respawnBtn    = document.querySelector('#respawn');
const hud           = document.querySelector('#hud');
const menuEl           = document.querySelector('#menu');
const button        = document.querySelector('#button');

//canvas.height = window.innerHeight;
//canvas.width 	= window.innerWidth;
const window_width 	= canvas.width
const window_height = canvas.height

const scene 	= new THREE.Scene();
const camera 	= new THREE.PerspectiveCamera(77, window_width / window_height, 0.01, 100);
const menuCamera 	= new THREE.PerspectiveCamera(77, window_width / window_height, 0.01, 100);
const renderer 	= new THREE.WebGLRenderer({
    canvas: canvas, 
    antialias: true,  
    powerPreference: "high-performance"
});

const listener = new THREE.AudioListener();
camera.add(listener);

menuCamera.position.set(20,20,20);
menuCamera.lookAt(0,0,0);

renderer.setClearColor("#6AB9D9");

const stats = new Stats();
document.body.appendChild(stats.dom);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.shadowMap.autoUpdate = false;

window.addEventListener('resize', () => {
	let width = window_width
	let height = window_height
	renderer.setSize(width, height)
	camera.aspect = width / height
	camera.updateProjectionMatrix()
})

const map_width = 50, map_depth = 50, map_height = 50
const bullets 	        = []
const boxes             = []
let network_data        = []
const spaceHash         = new SpaceHash(2)
const gameObjectArray   = new GameObjectArray()
const factory           = new Factory(scene, camera, listener, gameObjectArray, spaceHash);
const websocket         = new WebSocket(true ? "ws://localhost:5000/" : "ws://bezirksli.ga/game/ws/");
var player              = undefined;
let player_id           = undefined;
var gameData            = undefined;
let playerAABB          = undefined;
let testAABB            = undefined;

const killPlayer = function(){
    dead = true;
    hud.style.display       = 'none';
    menuEl.style.display    = 'block';
    gameObjectArray.remove(player);
    player.position.set(0,-10, 0);
}

const respawnPlayer = function(){
    player.position.set(Math.random()*20-10, 5, Math.random()*20-10);
    player.health.reset()
    gameObjectArray.add(player);
    hud.style.display       = 'block';
    menuEl.style.display    = 'none';
    dead = false;
}

const init = async function(){
	let json = await fetch('./assets/game_data.json');
	gameData = await json.json();
   
    // create player
    player = factory.createPlayer(bullets)
    //playerAABB = player.addComponent(new AABB2(player, new THREE.Vector3(1,2,1)));
    console.log(player.id);
    player_id = player.id;

    respawnBtn.addEventListener("click", () => {
        respawnPlayer();
    });

    button.addEventListener("click", () => {
        console.log("button");
    });

    // create map skybox
    let geometry 	= new THREE.BoxBufferGeometry(map_width, map_height, map_depth);
    let material 	= new THREE.MeshPhongMaterial({ 
        color: gameData.colorscheme.dark_grey, 
        flatShading: true,
        side: THREE.BackSide 
    })
    let mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(0,24,0);
	mesh.receiveShadow = true;
    scene.add(mesh);

    // create boxes
    for (let pos of gameData.boxes){
        let box = factory.createEnvironmentBox(pos);
        //boxes.push(box.getComponent("aabb"));
	}

    // testing
    //let testObject = new GameObject(scene);
    //testAABB = testObject.addComponent(new AABB2(testObject, new THREE.Vector3(2,2,2)));
    //gameObjectArray.add(testObject);

    // create lights
    const pinkLight = new THREE.PointLight(gameData.colorscheme.pink, 6, 100, 2);
    pinkLight.position.set(-25, 50, -25);
    scene.add(pinkLight);
    
    const blueLight = new THREE.PointLight(gameData.colorscheme.blue, 6, 100, 2);
    blueLight.position.set(25, 50, 25);
    scene.add(blueLight);
  
    scene.add(new THREE.AmbientLight(gameData.colorscheme.white, 0.2))
   
    const light = new THREE.DirectionalLight(gameData.colorscheme.white, 0.5, 100);
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

/*
    const pointlight = new THREE.PointLight(gameData.colorscheme.pink, 3, 100, 2);
    pointlight.position.set(0, 50, -25);
    scene.add(pointlight);
    scene.add(new THREE.AmbientLight(gameData.colorscheme.purple, 0.4))
    const light = new THREE.DirectionalLight(gameData.colorscheme.blue, 2, 100);
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
*/

    // prebake shadows
	renderer.shadowMap.needsUpdate = true;
	renderer.render(scene, camera)
	renderer.shadowMap.needsUpdate = false;

	requestAnimationFrame(game)
}

const menu = function(dt){
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
        }
    });

	if (websocket.readyState === WebSocket.OPEN){
        let data = {'id': player.id};
		data['player_data'] = [  player.position.x, player.position.y, player.position.z, player.direction.x, player.direction.y, player.direction.z ];
	    websocket.send(JSON.stringify(data));
    }

    stats.update()	
	renderer.render(scene, menuCamera)
}

const play = function(dt) {

    //console.log(playerAABB.box.min.x);

	gameObjectArray.forEach(gameObject => {
		if (!gameObject.local){ 
			let pos_and_dir = network_data[gameObject.id];
			if (pos_and_dir){
				gameObject.position.set( pos_and_dir[0], pos_and_dir[1], pos_and_dir[2]);
				gameObject.direction.set(pos_and_dir[3], pos_and_dir[4], pos_and_dir[5]);

				//let look = new THREE.Vector3();
				//look.subVectors(gameObject.position, gameObject.direction);
				//gameObject.transform.lookAt(look);
			}
		} else { 
			gameObject.update(dt);

			let aabb = gameObject.getComponent("aabb2");

			if (aabb){
				for (let otherObject of spaceHash.possible_collisions(aabb)){
					if (otherObject != gameObject) otherObject.collide(aabb); 
				}
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
	});

    

    //testAABB.collide(playerAABB);

    /*
    let origin = player.fpv.position.clone();
    origin = player.fpv.camera.localToWorld(origin);
    //console.log(origin);

    //console.log(player.direction)

    let ray = new THREE.Ray(origin, player.direction);
    if (ray.intersectsBox(testAABB.box)){
        console.log("hit")
    }
    */

	if (websocket.readyState === WebSocket.OPEN){
		let data = {}

		if (Math.abs(player.velocity.length()) > 0.1){
			data['player_data'] = [  player.position.x, player.position.y, player.position.z, player.direction.x, player.direction.y, player.direction.z ];
		}

		if (bullets.length > 0){
			let b = [];

			bullets.forEach(el => {
				b.push([ 
                    el.origin.x,el.origin.y,el.origin.z, 
                    el.direction.x,el.direction.y,el.direction.z,
                    el.damage
                ]);
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

let dead = false;
let then = 0, dt = 0
const game = function(now){
    requestAnimationFrame(game)

	now *= 0.001; // convert to seconds
	dt   = now - then;
	then = now;
	if (dt > 0.1) dt = 0.1;

    if (!dead){
        play(dt);
    } else {
        menu(dt);
    }
}

websocket.onmessage = function (event) {
	let data = JSON.parse(event.data);

	if (data.hit){
        console.log("hit")
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
			newGameObject.addComponent(new AABB(newGameObject, new THREE.Vector3(1,2,1)));
			newGameObject.addComponent(new Box(newGameObject,  new THREE.Vector3(1,2,0.5), gameData.colorscheme.dark_grey, false, false));
			newGameObject.position.set( player.player_data[0], player.player_data[1], player.player_data[2]);
			newGameObject.direction.set(player.player_data[3], player.player_data[4], player.player_data[5]);

			gameObjectArray.add(newGameObject);
		}
	}

	if (data.disconnected){ // TODO implement
		console.log(`player ${data.disconnected} disconnected`)
		let gameObject = gameObjectArray.get(data.disconnected)
        if (gameObject){
            gameObject.remove(scene);
            gameObjectArray.remove(gameObject)
        }
	}

	if (data.hit_by){
        //console.log(data);
		taking_hits.style.display = 'block'
        player.health.health -= data.damage;

        if (player.health.health <= 0){
            //player.position.set(0,-5,0);

            killPlayer(player);
        }
	} else {
		taking_hits.style.display = 'none'
	}
};

init();
