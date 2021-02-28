


class Player  {
    yaw = -0.5 * PI
    pitch = 0;
    id;
    bullets;
    pos;
    center;
    dir;
    nbullets;

    constructor(x,y,z){
		this.id = Math.floor(Math.random() * 100) + 1
        this.pos        = new p5.Vector(x,y,z)
        this.dir        = new p5.Vector(0,0,0)
        this.center     = new p5.Vector(0,0,0)
        this.camera     = createCamera()          
        this.bullets    = []
        this.nbullets   = 0;
    }

    static drawPlayer(x,y,z, yaw){
        push()
        translate(x,y+20,z)
        //rotateY(yaw)
        box(5, 40, 5)
        pop()
        push()
        translate(x,y-5,z)
        //rotateY(yaw)
        box(5)
        pop()
    }

    shoot(){
        //this.bullets[(this.nbullets++) % 10] = new Bullet(this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z)
        this.bullets[(this.nbullets++) % 10] = new Bullet(this.pos, this.dir)
    }

    update(){
        for (let b of this.bullets){
            b.update()
            push()
            translate(b.pos.x, b.pos.y, b.pos.z)
            box(2)
            pop()
        }

        this.yaw += (winMouseX - pwinMouseX) * mouse_sensitivity;
        //this.pitch  = -map(mouseY+(height/2), 0, height, 0, PI);


        this.dir.x = cos(this.yaw) * cos(this.pitch)
        this.dir.y = sin(this.pitch)
        this.dir.z = sin(this.yaw) * cos(this.pitch)

        /*
        if (keyIsDown(37)){
            this.yaw -= 0.1;
        } else if (keyIsDown(39)){
            this.yaw += 0.1;
        }
        */

        if (keyIsDown(87)){         // W
            this.pos.x += this.dir.x * movement_speed * deltaTime;
            this.pos.z += this.dir.z * movement_speed * deltaTime;
        } else if(keyIsDown(83)){   // S
            this.pos.x -= this.dir.x * movement_speed * deltaTime;
            this.pos.z -= this.dir.z * movement_speed * deltaTime;
        } else if (keyIsDown(68)){  // D
            this.pos.x -= this.dir.z * movement_speed * deltaTime;
            this.pos.z += this.dir.x * movement_speed * deltaTime;
        } else if (keyIsDown(65)){  // A
            this.pos.x += this.dir.z * movement_speed * deltaTime;
            this.pos.z -= this.dir.x * movement_speed * deltaTime;
        }

        //console.log(this.pos, this.dir)
        this.center = p5.Vector.add(this.pos, this.dir);

        this.camera.setPosition(this.pos.x, this.pos.y, this.pos.z)
        this.camera.lookAt(this.center.x,this.center.y,this.center.z)
    }
}
