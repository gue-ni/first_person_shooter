import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'

import { GameObject, GameObjectArray} from './game-object.js';
import { HashGrid } from './hashgrid.js';
import { Factory } from './factory.js';
import { BulletImpact, Explosion, ParticleSystem, Smoke } from './particles.js';
import { NetworkController } from './networking.js';
import { SimpleGLTFModel } from './components.js';
import { RectAreaLightUniformsLib } from './three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from './three/examples/jsm/helpers/RectAreaLightHelper.js';

const canvas  		= document.querySelector('#canvas');
const respawnBtn    = document.querySelector('#respawn');
const hudEl           = document.querySelector('#hud');
const menuEl        = document.querySelector('#menu');

//canvas.height  = window.innerHeight;
//canvas.width   = window.innerWidth;
let window_width 	= canvas.width = window.innerWidth
let window_height = canvas.height = window.innerHeight;

const scene 	= new THREE.Scene();
scene.name = "Scene";
const camera 	= new THREE.PerspectiveCamera(77, window_width / window_height, 0.01, 100);

const menuCamera 	= new THREE.PerspectiveCamera(77, window_width / window_height, 0.01, 100);
const renderer 	= new THREE.WebGLRenderer({
    canvas: canvas, 
    antialias: true,  
    powerPreference: "high-performance"
});

renderer.setClearColor("#2A1559");
renderer.physicallyCorrectLights = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.shadowMap.autoUpdate = false;

const listener = new THREE.AudioListener();
camera.add(listener);

menuCamera.position.set(20,20,20);
menuCamera.lookAt(0,0,0);

const stats = new Stats();
document.body.appendChild(stats.dom);

function resize(){
    window_width = canvas.width = window.innerWidth
    window_height = canvas.height = window.innerHeight;

    renderer.setSize(window_width, window_height)

    camera.aspect = window_width / window_height
    camera.updateProjectionMatrix()

    menuCamera.aspect = window_width / window_height
    menuCamera.updateProjectionMatrix()
}

window.addEventListener('resize', resize, false);

document.addEventListener("touchstart", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        resize();
    }
}, false);



const map_width = 50, map_depth = 50, map_height = 80
const rays         	    = []
const projectiles       = []
let network_data        = []
const hashGrid          = new HashGrid(2)
const gameObjectArray   = new GameObjectArray()
const websocket         = new WebSocket(false ? "ws://localhost:5000/" : "ws://bezirksli.ga/game/ws/");
const network           = new NetworkController(websocket);
const factory           = new Factory(scene, camera, listener, gameObjectArray, hashGrid, network);
var player              = undefined;
var gameData            = undefined;
let particleSystem      = new BulletImpact(scene,'./assets/textures/spark.png')
let explosions          = new Explosion(scene,'./assets/textures/explosion2.png', listener)
let impactPoint         = new THREE.Vector3();
let dead                = true;
let then = 0, dt = 0;

const killPlayer = function(){
    player.publish("killed", {})
    dead = true;
    hudEl.style.display       = 'none';
    menuEl.style.display    = 'block';
    player.transform.visible = player.active = false;
    gameObjectArray.remove(player);
}

const spawnPlayer = function(){
    console.log("respawn")
    player.publish("spawn", {})
    dead = false;
    player.transform.visible = player.active = true;
    hudEl.style.display     = 'block';
    menuEl.style.display    = 'none';
    gameObjectArray.add(player);
}

const init = async function(){
	let json = await fetch('./assets/game_data.json');
	gameData = await json.json();
   
    // create player
    player = factory.createPlayer(network)
    console.log(player.id);

    respawnBtn.addEventListener("click", () => {
        spawnPlayer();
    });

    // create map skybox
    /*
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
    */

    // create boxes
    for (let pos of gameData.boxes){
        factory.createEnvironmentBox(pos, new THREE.Vector3(2,2,2));
	}
    factory.createGroundBox(new THREE.Vector3(0,-2,0), new THREE.Vector3(60,2,60))

    // testing
    /*
    let testObject = new GameObject(scene);
    testObject.addComponent(new SimpleGLTFModel(testObject, './assets/objects/concrete_cube.glb', {}))
    gameObjectArray.add(testObject);
    */

    let r = 0xd90452;
    let p = 0x0476D9;

    let colors = {
        c1: 0xd9048e,
        c2: 0x8c035c,
        c3: 0x40012a,
        c4: 0x2964d9,
        c5: 0x0597f2
    }

    {
        const light = new THREE.HemisphereLight(colors.c1, colors.c5, 0.3);
        //scene.add(light);
    }
    {
        const light = new THREE.PointLight(colors.c1, 1, 100, 2)
        light.position.set(0, 4.5, 4.5);
        scene.add(light);
    }
    {
        const light = new THREE.DirectionalLight(colors.c5, 1, 100, 2);
        light.position.set(0, 50, 15)
        light.castShadow 			=  true; 
        light.shadow.mapSize.width 	=  1024; 
        light.shadow.mapSize.height =  1024; 
        light.shadow.camera.near 	=  0.5; 
        light.shadow.camera.far 	=  100;
        light.shadow.camera.left 	= -50;
        light.shadow.camera.bottom 	= -50;
        light.shadow.camera.top  	=  50;
        light.shadow.camera.right	=  50;
        scene.add(light)
    }
    {
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
    }

    // prebake shadows
	renderer.shadowMap.needsUpdate = true;
	renderer.render(scene, camera)
	renderer.shadowMap.needsUpdate = false;

	requestAnimationFrame(game)
}

const play = function(dt) {

    // TODO: add network objects
    for (const [id, object] of Object.entries(network.connected)){
        console.log(`creating object ${id}`)
        console.log(object);

        switch (object.type){
            case "player":
                //console.log("creating player")
                factory.createNetworkPlayer(network, {'id': id});
                break;
            case "projectile":
                //console.log("creating projectile")
                factory.createNetworkProjectile(network, {'id': id});
                break;
        }
    }
    network.connected = {};

	gameObjectArray.forEach(gameObject => {

        if (network.disconnected.includes(gameObject.id)){
            gameObject.lifetime = 0;
        }

        gameObject.update(dt);

        let aabb = gameObject.getComponent("aabb");
        if (aabb){
            for (let otherObject of hashGrid.possible_aabb_collisions(aabb)){
                if (otherObject != gameObject) aabb.collide(otherObject); 
            }
        }

        if (gameObject.lifetime != undefined){
            gameObject.lifetime -= dt;
            if (gameObject.lifetime <= 0){
                gameObjectArray.remove(gameObject);
                gameObject.publish("destroy", {});
                gameObject.destroy();
            }
        }
	});

    let health = player.getComponent("Health");
    if (health){
        if (health.value <= 0 && !dead){
            player.publish("killed", {});
            killPlayer();
        }
    }

    for (let explosion of network.explosions){
        explosions.impact(explosion);
        let v = new THREE.Vector3();
        v.subVectors(player.position, explosion)

        let d = v.length();
        if (d < 10){
            let damage = Math.floor((10 - d) * 5);
            player.publish("damage", damage);
        }
    }

    for (let ray of network.rays){
        for (let aabb of hashGrid.possible_ray_collisions(ray)){
            let intersection = ray.intersectBox(aabb.box, impactPoint)
            if (intersection) particleSystem.impact(impactPoint)
        }
    }
    particleSystem.update(dt);
    explosions.update(dt);

    network.sync();
	network.rays.length = network.explosions.length = 0;
    network.disconnected = [];

	// debug
	//let dir = player.direction.normalize().clone()
	//camera.position.set(player.position.x+dir.x, player.position.y+5, player.position.z+dir.z)
	//camera.lookAt(player.position)
	
	stats.update()	
	renderer.render(scene, dead ? menuCamera : camera)
}

const game = function(now){
    requestAnimationFrame(game)

	now *= 0.001; // convert to seconds
	dt   = now - then;
	then = now;
	if (dt > 0.1) dt = 0.1;

    play(dt);
}

init();
