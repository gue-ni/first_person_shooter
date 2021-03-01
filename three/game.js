const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
const renderer = new THREE.WebGLRenderer({ antialias: true})

renderer.setSize( window.innerWidth, window.innerHeight )
renderer.setClearColor("#222222")

document.body.appendChild( renderer.domElement )

var canvas = renderer.domElement

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
canvas.onclick = function() { canvas.requestPointerLock(); };
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

var player = new Player(0, 3, 10)

function mouse(event){
	//console.log(event.movementY)
	player.yaw   += (event.movementX * 0.1)
    player.pitch += (event.movementY * 0.1)

    //console.log(-player.pitch)



    player.direction.x = Math.cos( player.yaw  *(Math.PI/180)) * Math.cos(-player.pitch*(Math.PI/180))
    player.direction.y = Math.sin(-player.pitch*(Math.PI/180))
    player.direction.z = Math.sin( player.yaw  *(Math.PI/180)) * Math.cos(-player.pitch*(Math.PI/180))
    player.direction.normalize()
}

function lockChangeAlert() {
	if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
		console.log('The pointer lock status is now locked');
		document.addEventListener("mousemove", mouse, false);
	} else {
		console.log('The pointer lock status is now unlocked');  
		document.removeEventListener("mousemove", mouse, false);
	}
}


window.addEventListener( 'resize', () => {
	let width = window.innerWidth
	let height = window.innerHeight
	renderer.setSize( width, height )
	camera.aspect = width / height
	camera.updateProjectionMatrix()
})

document.addEventListener("keydown", (event) => {
	var keyCode = event.keyCode;
	switch (keyCode) {
		case 68: //d
			player.keyD = true;
			break;
		case 83: //s
			player.keyS = true;
			break;
		case 65: //a
			player.keyA = true;
			break;
		case 87: //w
			player.keyW = true;
			break;
		case 32:
			player.keySpace = true
			break
	}
})


document.addEventListener("keyup", (event) => {
	var keyCode = event.keyCode;

	switch (keyCode) {
		case 68: //d
			player.keyD = false;
			break;
		case 83: //s
			player.keyS = false;
			break;
		case 65: //a
			player.keyA = false;
			break;
		case 87: //w
			player.keyW = false;
			break;
		case 32:
			player.keySpace = false
			break
	}
})


var objects = []
objects.push(player)

var ground = new AABB(new THREE.Vector3(0, 0, 0), 100, 0.1, 100, 0x3bb446)
scene.add(ground.mesh)

for (var i = 0; i < 10; i++){
	let pos = new THREE.Vector3(Math.floor(Math.random()*100)-50, 10, Math.floor(Math.random()*100)-50)
	var box = new GravityObject(pos, 1, 1, 1, 0xff0051)
	scene.add(box.mesh)
	objects.push(box)
}


var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.2)
scene.add( ambientLight )

var pointLight = new THREE.PointLight( 0xffffff, 1 );
pointLight.position.set( 25, 50, 25 );
scene.add( pointLight );

let then = 0
let cnt = 0


function animate(now) {
	cnt++;
	now *= 0.001;
	const dt = now - then;
	then = now;
	console.log()



	for (let object of objects){
		object.update(dt)	
		ground.collide(object)
	}

	camera.position.set(player.position.x, player.position.y+player.h/2, player.position.z)
	camera.lookAt(player.cameraCenter)

	requestAnimationFrame(animate)
	renderer.render(scene, camera)
}

requestAnimationFrame(animate)


