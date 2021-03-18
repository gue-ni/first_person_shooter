import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { GameObject, GameObjectArray} from './game-object.js';
import { HashGrid } from './hashgrid.js';
import { Factory } from './factory.js';
import { BulletImpact, ParticleSystem, Smoke } from './particles.js';
import { NetworkController } from './networking.js';

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
const menuEl        = document.querySelector('#menu');
const button        = document.querySelector('#button');

//canvas.height = window.innerHeight;
//canvas.width 	= window.innerWidth;
const window_width 	= canvas.width
const window_height = canvas.height

const scene 	= new THREE.Scene();
scene.name = "Scene";
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

const map_width = 50, map_depth = 50, map_height = 80
const rays         	    = []
const projectiles       = []
let network_data        = []
const hashGrid          = new HashGrid(2)
const gameObjectArray   = new GameObjectArray()
const websocket         = new WebSocket(true ? "ws://localhost:5000/" : "ws://bezirksli.ga/game/ws/");
const network           = new NetworkController(websocket);
const factory           = new Factory(scene, camera, listener, gameObjectArray, hashGrid);
var player              = undefined;
var gameData            = undefined;
let particleSystem      = new BulletImpact(scene,'./assets/textures/spark.png')
let impactPoint         = new THREE.Vector3();
let dead                = false;
let then = 0, dt = 0;

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
    player = factory.createPlayer(network)
    console.log(player.id);

    respawnBtn.addEventListener("click", () => {
        respawnPlayer();
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
        factory.createEnvironmentBox(pos, new THREE.Vector3(2,2,2));
	}
    factory.createGroundBox(new THREE.Vector3(0,-4,0), new THREE.Vector3(60,2,60))

    // testing
    //let testObject = new GameObject(scene);
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

    // TODO: add network objects
    for (const [id, object] of Object.entries(network.connected)){
        console.log(`creating object ${id}`)
        factory.createNetworkPlayer(network, {'id': id});
    }
    network.connected = {};

    // TODO: remove network objects

	gameObjectArray.forEach(gameObject => {
        gameObject.update(dt);

        let aabb = gameObject.getComponent("aabb");
        if (aabb){
            for (let otherObject of hashGrid.possible_aabb_collisions(aabb)){
                if (otherObject != gameObject) aabb.collide2(otherObject); 
            }
        }

        if (gameObject.lifetime){
            gameObject.lifetime -= dt;
            if (gameObject.lifetime <= 0){
                console.log("removing gameObject");
                gameObjectArray.remove(gameObject);
            }
        }
	});

    for (let ray of network.rays){
        for (let aabb of hashGrid.possible_ray_collisions(ray)){
            let intersection = ray.intersectBox(aabb.box, impactPoint)
            if (intersection) particleSystem.impact(impactPoint)
        }
    }

    particleSystem.update(dt);
    network.sync();
	network.rays.length = 0;
    network.explosions.length = 0;

	// debug
	//let dir = player.direction.normalize().clone()
	//camera.position.set(player.position.x+dir.x, player.position.y+5, player.position.z+dir.z)
	//camera.lookAt(player.position)
	
	stats.update()	
	renderer.render(scene, camera)
}

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

init();
