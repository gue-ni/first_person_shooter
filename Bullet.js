class Bullet{
    speed = 1;
    constructor(pos, dir){
        this.pos = Object.assign({}, pos);
        this.dir = Object.assign({}, dir);
    }

    update(){
        this.pos.x += this.dir.x * this.speed * deltaTime 
        this.pos.y += this.dir.y * this.speed * deltaTime
        this.pos.z += this.dir.z * this.speed * deltaTime

        //this.pos = p5.Vector.add(this.pos, this.dir.mult(this.speed))
    }
}