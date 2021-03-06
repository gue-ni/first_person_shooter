import * as THREE from './three/build/three.module.js';
import { Component } from './components.js'

const _VS = `
uniform float pointMultiplier;

attribute float size;

void main(){
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = size * pointMultiplier / gl_Position.w;
}`;

const _FS = `

uniform sampler2D diffuseTexture;

void main() {
	gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
}`;

export class ParticleSystem extends Component {
	constructor(gameObject, camera, numParticles, particlesPerSecond, particleLifetime){
		super(gameObject);
		this.numParticles 		= numParticles;
		this._particleLifetime  = particleLifetime;
		this._lifetime 			= [];
		this._lastUsedParticle 	= 0;
		this._duration 			= 1 / particlesPerSecond;  
		this._elapsed  			= 0;
		this._cache 			= new THREE.Vector3(0, -5, 0);

		const position 	= [], sizes = [];

		for ( let i = 0; i < this.numParticles; i++ ) {

			position.push(this._cache.x, this._cache.y, this._cache.z);
			this._lifetime.push(-1);
			sizes.push(2)

		}

		const uniforms = {
			diffuseTexture: {
			    value: new THREE.TextureLoader().load('./three/examples/textures/sprites/spark1.png')
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
			transparent: 	true,
			vertexColors: 	true
		});

		this._camera = camera;

		this._geometry = new THREE.BufferGeometry();
		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(position,3));
		this._geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes,1));
		this._geometry.computeBoundingSphere()
		this._geometry.boundingSphere.set(this._cache, 100);

		//console.log(this._geometry)
		//console.log(this._geometry.boundingSphere);


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
		
		this._elapsed += dt;
		if (this._elapsed >= this._duration){
			let newParticle = this._findUnusedParticle();

			this._lifetime[newParticle] = this._particleLifetime;

			positions[newParticle*3] 	= 10 * Math.random() - 5;
			positions[newParticle*3+1] 	=  4;
			positions[newParticle*3+2]  = 10 * Math.random() - 5;

			sizes[newParticle] = 1

			this._elapsed = 0
		}

		for (let i = 0; i < this.numParticles; i++){

			if (this._lifetime[i] > 0){
				this._lifetime[i] -= dt;

				if (this._lifetime[i] > 0){
					positions[i*3+1] += 2 * dt; // y

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


