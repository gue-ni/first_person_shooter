
const canvas = document.querySelector('#c');
const window_width 	= canvas.width
const window_height = canvas.height

const scene 	= new THREE.Scene()
const camera 	= new THREE.PerspectiveCamera(75, window_width / window_height, 0.1, 1000)
const renderer 	= new THREE.WebGLRenderer({canvas})
renderer.setClearColor("#222222")

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

const map_width = 50
const map_depth = 50

const objects = []
const rays = []

for (let i = 0; i < 10; i++){
	let testObject = new GameObject(scene);
	testObject.addComponent(new Gravity(testObject));
	testObject.addComponent(new AABB(testObject, new THREE.Vector3(2,2,2)))
	testObject.addComponent(new Box(testObject, new THREE.Vector3(2,2,2), 0xff0051))
	testObject.position.set(Math.floor(Math.random()*map_width)-map_width/2, 30, Math.floor(Math.random()*map_depth)-map_depth/2)
	objects.push(testObject)
}

// Create the Ground
let ground = new GameObject(scene);
let ground_aabb = new AABB(ground, new THREE.Vector3(map_width,2,map_depth))
ground.addComponent(ground_aabb)
ground.addComponent(new Box(ground, new THREE.Vector3(map_width,2,map_depth), 0x90b325))
ground.position.set(0,0,0)

// Create the Player
let playerObject = new GameObject(scene);
let player = new Player(playerObject)
playerObject.addComponent(player)
let gun = new SemiAutomaticWeapon(playerObject, rays)
playerObject.addComponent(gun)
playerObject.addComponent(new Gravity(playerObject))
playerObject.addComponent(new AABB(playerObject, new THREE.Vector3(1,2,1)))
playerObject.addComponent(new Box(playerObject,  new THREE.Vector3(1, 2, 1), 0xff0051))
playerObject.position.set(5,2,10)
objects.push(playerObject)

function mouse(event){
	player.yaw   += (event.movementX * 0.1)
    player.pitch += (event.movementY * 0.1)

    let pitch = -player.pitch;
    if (pitch >  89) pitch =  89
    if (pitch < -89) pitch = -89

    player.direction.x = Math.cos(player.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
    player.direction.y = Math.sin(pitch*(Math.PI/180))
    player.direction.z = Math.sin(player.yaw  *(Math.PI/180)) * Math.cos(pitch*(Math.PI/180))
    player.direction.normalize()
}

let space_hash = new SpaceHash(200)


let ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)

let pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(25, 50, 25);
scene.add(pointLight);

camera.position.copy(playerObject.position)

let then = 0, dt = 0
function animate(now) {
	now *= 0.001;
	dt   = now - then;
	then = now;

	space_hash.clear()
    objects.forEach(object => space_hash.insert(object.getComponent("aabb")))

	for (let object of objects){
		object.update(dt);
		let aabb = object.getComponent("aabb")

		for (let other of space_hash.search(aabb)){
			if (other != object){
				other.collideAABB(aabb)
			}
		}

		ground_aabb.collideAABB(aabb)
		
		for (let ray of rays){
			if (ray.intersect(aabb) && object != playerObject){
				console.log("hit")
			}
		}
	}
	rays.length = 0

	camera.position.copy(playerObject.position)
	camera.lookAt(player.cameraCenter)
	playerObject.transform.lookAt(player.cameraCenter)
	
	renderer.render(scene, camera)
	requestAnimationFrame(animate)
}

requestAnimationFrame(animate)


