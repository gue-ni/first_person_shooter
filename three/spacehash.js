
class SpaceHash {
	constructor(size){
		this.size = size
		this.space = new Map()
	}

	hash(vec){
		return new THREE.Vector3(Math.floor(vec.x/this.size),Math.floor(vec.y/this.size),Math.floor(vec.z/this.size))
	}

	clear(){
		this.space = new Map()
	}

	insert(obj){
		let min = this.hash(obj.min)
		let max = this.hash(obj.max)

		for (let i = min.x; i <= max.x; i++){
			for (let j = min.y; j <= max.y; j++){
				for (let k = min.z; k <= max.z; k++){

					let key = ""+i+j+k

					if (this.space.has(key)){
						let l = this.space.get(key)
						l.push(obj)
						this.space.set(key, l)
					} else {
						this.space.set(key, [obj])
					}
				}
			}
		}
		//console.log(this.space.size)
		//console.log(this.space)		
	}

	search(obj){
		let min = this.hash(obj.min)
		let max = this.hash(obj.max)
		
		let possible = new Set()

		for (let i = min.x; i <= max.x; i++){
			for (let j = min.y; j <= max.y; j++){
				for (let k = min.z; k <= max.z; k++){

					let key = "" + i + j + k
					if (this.space.has(key)){
						for (let item of this.space.get(key)){
							if (item != obj){
								possible.add(item)
							}
						}
					}
				}
			}
		}
		return possible
	}
}