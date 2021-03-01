
const movement_speed = 0.1
const mouse_sensitivity = 0.01
const gravity = 0.0007


let player;
let ground;
let rays        = [];
let objects     = [];
let space_hash


function setup() {
    createCanvas(640, 480, WEBGL)
    requestPointerLock();
    //noCursor()
    debugMode(AXES)


    perspective(PI / 3.0, width / height, 0.1, 1500);

    player      = new Character(0, -100, 0)
    ground      = new AABB(createVector(0, 50, 0), 1000, 100, 1000)
    space_hash  = new SpaceHash(200)

    objects[0] = player
    objects[1] = new GravityObject(createVector( 300, -300,  0), 100, 100, 100) 
    objects[2] = new GravityObject(createVector(300, -700, 10), 100, 100, 100) 

    for (var i = 3; i < 3; i++){
        let r = createVector(Math.floor(Math.random()*1000)-500, Math.floor(Math.random()*100)-140, Math.floor(Math.random()*1000)-500)
        objects[i] = new GravityObject(r, 70, 70, 70)
    }


    for (var obj of objects) space_hash.insert(obj)
    
}


function shooting(){
    if (mouseIsPressed){
        rays.push(player.cameraRay())
    }
}

function mouseClicked(){

}



function draw() {
    background(155)

    ambientLight(100)
    pointLight(250, 250, 250, 100, 100, 50);

    player.input() 
    shooting()

   
    space_hash.clear()
    objects.forEach(obj => space_hash.insert(obj))

    // object collisions
    for (let object of objects){
        object.update()

        let possible_collisions = space_hash.search(object)
        possible_collisions.forEach(obj => obj.collide(object))

        ground.collide(object)

        for (let ray of rays){
            if (ray.intersect(object)){
               console.log("ray collision")
            }           
        }

    }




    let ray = player.cameraRay()
    let b = new Box(p5.Vector.add(ray.origin, p5.Vector.mult(ray.direction, 100)), 10, 10, 10)

   
    objects.forEach(obj => obj.draw())
    ground.draw()
    b.draw()

    rays = []

}


