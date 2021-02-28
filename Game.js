
const movement_speed = 0.1
const mouse_sensitivity = 0.01
const gravity = 0.0007


let player;
let ground;
let players;
let objects = [];
let space_hash

/*
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
*/

function setup() {
    createCanvas(640, 480, WEBGL)
    requestPointerLock();

    debugMode(AXES)


    perspective(PI / 3.0, width / height, 0.1, 1500);

    player   = new Character(0, -100, 0)
    ground   = new BoundingBox(createVector(0, 50, 0), 1000, 100, 1000)
    space_hash = new SpaceHash(300)

    objects[0] = player
    objects[1] = new PhysicsBox(createVector( 300, -300,  0), 100, 100, 100) 
    objects[2] = new PhysicsBox(createVector(300, -700, 10), 100, 100, 100) 

    for (var i = 3; i < 3; i++){
        let r = createVector(Math.floor(Math.random()*1000)-500, Math.floor(Math.random()*100)-140, Math.floor(Math.random()*1000)-500)
        objects[i] = new PhysicsBox(r, 70, 70, 70)
    }


    for (var obj of objects) space_hash.insert(obj)
    
}

function mouseClicked(){
    //player.shoot()
    //objects.push(new Box(player.position.x, player.position.y, player.position.z, 100, 100, 100))
}



function draw() {
    background(155)

    ambientLight(100)
    pointLight(250, 250, 250, 100, 100, 50);

    player.input() 

    space_hash.clear()
    objects.forEach(obj => space_hash.insert(obj))

    for (let object of objects){
        object.update()

        let possible_collisions = space_hash.search(object)
        possible_collisions.forEach(obj => obj.collide(object))

        ground.collide(object)
    }

    objects.forEach(obj => obj.draw())
    ground.draw()

}


