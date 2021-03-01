class Box {
	constructor(position, w, h, d){
		this.position = position
		this.h = h
		this.w = w
		this.d = d	
	}

	update(){}

	draw(){
		push()
		translate(this.position.x, this.position.y, this.position.z)
		box(this.w, this.h, this.d)
		pop()
	}	
}