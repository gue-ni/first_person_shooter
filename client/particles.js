import * as THREE from './three/build/three.module.js';
import { Component } from './components.js'

const _VS = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;
varying vec4 vColour;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;
  vColour = colour;

}`;

const _FS = `
uniform sampler2D diffuseTexture;
varying vec4 vColour;

void main() {
  gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vColour;
}`;

export class ParticleSystem extends Component {
	constructor(gameObject, camera, numParticles, particlesPerSecond, particleLifetime){
		super(gameObject);

		this.numParticles 		= numParticles;
		this._lifetime 			= [];
		this._lastUsedParticle 	= 0;
		this._duration 			= 1 / particlesPerSecond;  
		this._elapsed  			= 0;
		this._cache 			= new THREE.Vector3(0, -10, 0);

		this._gravity = false;

		this._particleLifetime  = function(){
			return particleLifetime;
		};
		this._particleOrigin = function(){
			return new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
		}

		this._particleSize = function(){
			return 1;
		}

		this._particleVelocity = function(){
			let dir = new THREE.Vector3(0,1,0);
			dir.normalize();
			return dir.multiplyScalar(1 + Math.random() * 5);		
		}

		const position = [], sizes = [], colors = []
		this._velocities = []

		for ( let i = 0; i < this.numParticles; i++ ) {
			position.push(this._cache.x, this._cache.y, this._cache.z);
			this._lifetime.push(-1);

			sizes.push(10)
			this._velocities.push( new THREE.Vector3(0, 0, 0))

			let color = new THREE.Color();
			colors.push(color.r, color.g, color.b, 1);
		}

		const uniforms = {
			diffuseTexture: {
			    value: new THREE.TextureLoader().load('./assets/fire.png')
			},
			pointMultiplier: {
			    value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
			}
		};

		this._material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: 	_VS,
			fragmentShader: _FS,
			depthTest: 		true,
			depthWrite: 	false,
			blending: THREE.AdditiveBlending,
			transparent: 	true,
			vertexColors: 	true
		});

		this._camera = camera;

		this._geometry = new THREE.BufferGeometry();
		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(position,3));
		this._geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes,1));
		this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colors,4));

		this._geometry.computeBoundingSphere()
		this._geometry.boundingSphere.set(this._cache, 100);

		this._points = new THREE.Points(this._geometry, this._material);

		this.gameObject.transform.add(this._points);
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
		const positions = this._points.geometry.attributes.position.array;
		const sizes 	= this._points.geometry.attributes.size.array;
		const colors 	= this._points.geometry.attributes.colour.array;
		
		this._elapsed += dt;
		if (this._elapsed >= this._duration){
			let numNewParticles = Math.floor(this._elapsed / this._duration);

			for (let i = 0; i < numNewParticles; i++){
				let newParticle = this._findUnusedParticle();

				let origin = this._particleOrigin();
				positions[newParticle*3] 	= origin.x;
				positions[newParticle*3+1] 	= origin.y;
				positions[newParticle*3+2]  = origin.z;

				sizes[newParticle] 				= this._particleSize();
				this._lifetime[newParticle] 	= this._particleLifetime();
				this._velocities[newParticle] 	= this._particleVelocity();
			}			
			this._elapsed = 0
		}

		for (let i = 0; i < this.numParticles; i++){

			if (this._lifetime[i] > 0){

				this._lifetime[i] -= dt;

				if (this._lifetime[i] > 0){
					positions[i*3] 	 += this._velocities[i].x * dt; 
					positions[i*3+1] += this._velocities[i].y * dt; 
					positions[i*3+2] += this._velocities[i].z * dt; 

					if (this._gravity) this._velocities[i].setY(this._velocities[i].y - 9.81 * dt);


					if (colors[i*4+3] > 0) colors[i*4+3] -= 0;

				} else {
					positions[i*3]   = this._cache.x;
					positions[i*3+1] = this._cache.y;
					positions[i*3+2] = this._cache.z;
					sizes[i] = 2;
				}
			}
		}
		this._points.geometry.attributes.position.needsUpdate 	= true;
		this._points.geometry.attributes.size.needsUpdate 		= true;
		this._points.geometry.attributes.colour.needsUpdate 		= true;
	}
}


export class MuzzleFlash extends ParticleSystem {
	//numParticles, particlesPerSecond, particleLifetime
	constructor(gameObject, camera){
		super(gameObject, camera, 1000, 0.25, 5);
		
		this._particleBurstSize = 10;

		this._particleVelocity = function(){
			let dir = new THREE.Vector3(10 * Math.random() - 5, 50 * Math.random(), 10 * Math.random() - 5);
			dir.normalize();
			return dir.multiplyScalar(15 + Math.random() * 5);
		}
		this._particleOrigin = function(){
			return new THREE.Vector3(0,1,0);
		}
	}

	update(dt){
		const positions = this._points.geometry.attributes.position.array;
		const sizes 	= this._points.geometry.attributes.size.array;
		
		this._elapsed += dt;
		if (this._elapsed >= this._duration){
			let numNewParticles = Math.floor(this._elapsed / this._duration);

			for (let i = 0; i < this._particleBurstSize; i++){
				let newParticle = this._findUnusedParticle();

				let origin = this._particleOrigin();
				positions[newParticle*3] 	= origin.x;
				positions[newParticle*3+1] 	= origin.y;
				positions[newParticle*3+2]  = origin.z;

				sizes[newParticle] = this._particleSize();
				this._lifetime[newParticle] = this._particleLifetime();
				this._velocities[newParticle] = this._particleVelocity();
			}			
			this._elapsed = 0
		}

		for (let i = 0; i < this.numParticles; i++){

			if (this._lifetime[i] > 0){

				this._lifetime[i] -= dt;

				if (this._lifetime[i] > 0){
					positions[i*3] 	 += this._velocities[i].x * dt; // y
					positions[i*3+1] += this._velocities[i].y * dt; // y
					positions[i*3+2] += this._velocities[i].z * dt; // y
					this._velocities[i].setY(this._velocities[i].y - 9.81 * dt);

				} else {
					positions[i*3]   = this._cache.x;
					positions[i*3+1] = this._cache.y;
					positions[i*3+2] = this._cache.z;
					sizes[i] = 2;
				}
			}
		}
		this._points.geometry.attributes.position.needsUpdate 	= true;
		this._points.geometry.attributes.size.needsUpdate 		= true;
	}
}

