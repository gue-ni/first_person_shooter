import * as THREE from './three/build/three.module.js';
import { Component } from './components.js'

export class ParticleSystem extends Component {
	constructor(gameObject, numParticles){
		super(gameObject);
		this.numParticles = numParticles;

		const geometry = new THREE.BufferGeometry();
		const vertices = [];

		const sprite = new THREE.TextureLoader().load( './three/examples/textures/sprites/disc.png' );

		for ( let i = 0; i < this.numParticles; i ++ ) {
			const x = 20 * Math.random() - 10;
			const y = 20 * Math.random() - 10;
			const z = 20 * Math.random() - 10;
			vertices.push( x, y, z );
		}

		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

		let material = new THREE.PointsMaterial({ 
			size: 1, 
			sizeAttenuation: true, 
			map: sprite, 
			alphaTest: 0.5, 
			transparent: true 
		});
		
		material.color.setHSL(1.0, 0.3, 0.7);

		this.particles = new THREE.Points( geometry, material );
		this.gameObject.transform.add( this.particles );

	}

	update(dt){
		const positions = this.particles.geometry.attributes.position.array;

		for (let i = 0; i < this.numParticles; i++){
			positions[i*3+1] += 0.01;
		}

		this.particles.geometry.attributes.position.needsUpdate = true;
	}
}




export class ParticleSystem2 extends Component {
	constructor(gameObject, numParticles, perSecond){
		super(gameObject);
		this.numParticles = numParticles;
		this._lifetime = [];
		this._lastUsedParticle = 0;
		this._duration =  1 / (perSecond) // 
		this._elapsed  = 0
		this._cache = new THREE.Vector3(20, 1, 0);

		const geometry = new THREE.BufferGeometry();
		const vertices = [];
		const sprite = new THREE.TextureLoader().load( './three/examples/textures/sprites/disc.png' );

		for ( let i = 0; i < this.numParticles; i ++ ) {
			vertices.push(this._cache.x, this._cache.y, this._cache.z);
			this._lifetime.push(-1);
		}

		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		let material = new THREE.PointsMaterial({ 
			size: 1, 
			sizeAttenuation: true, 
			map: sprite, 
			alphaTest: 0.5, 
			transparent: true 
		});
		
		material.color.setHSL(1.0, 0.3, 0.7);
		this.particles = new THREE.Points( geometry, material );
		this.gameObject.transform.add( this.particles );
	}

	_findUnusedParticle(){
		for (let i = this._lastUsedParticle; i < this.numParticles; i++){
			if (this._lifetime[i] < 0){
				this._lastUsedParticle = i; 
				return i;
			}
		}

		for (let i = 0; i < this._lastUsedParticle; i++){
			if (this._lifetime[i] < 0){
				this._lastUsedParticle = i;
				return i;
			}
		}
		return 0;
	}

	update(dt){
		const positions = this.particles.geometry.attributes.position.array;
		
		this._elapsed += dt;
		if (this._elapsed >= this._duration){
			let newParticle = this._findUnusedParticle();

			//console.log(`create new particle ${newParticle}`)

			this._lifetime[newParticle] = 15;
			positions[newParticle*3] 	= 10 * Math.random() - 5;
			positions[newParticle*3+1] 	=  4 * Math.random() - 2;
			positions[newParticle*3+2]  = 10 * Math.random() - 5;

			this._elapsed = 0
		}
		


		for (let i = 0; i < this.numParticles; i++){

			if (this._lifetime[i] > 0){

				this._lifetime[i] -= dt;

				if (this._lifetime[i] > 0){

					positions[i*3+1] += 2 * dt; // y

				} else {
					/*	
					positions[i*3]   = 0;
					positions[i*3+1] = 0;
					positions[i*3+2] = 0;
					*/
					positions[i*3]   = this._cache.x;
					positions[i*3+1] = this._cache.y;
					positions[i*3+2] = this._cache.z;


				}
			}
		}
		this.particles.geometry.attributes.position.needsUpdate = true;
	}
}



