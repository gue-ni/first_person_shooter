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

		this._lastUsedParticle 	= 0;
		this._elapsed  			= 0;
		this._lifetime 			= [];
		this._gravity 			= false;
		this.numParticles 		= numParticles;
		this._duration 			= 1.0 / particlesPerSecond;  
		this._cache 			= new THREE.Vector3(0, -10, 0);
		this._particleLifetime  = particleLifetime;

		const position = [], sizes = [], colors = []
		this._velocities = []

		for ( let i = 0; i < this.numParticles; i++ ) {
			position.push(this._cache.x, this._cache.y, this._cache.z);
			this._lifetime.push(-1);


			this._velocities.push(new THREE.Vector3(0, 0, 0))
			sizes.push(10)

			let color = new THREE.Color();
			colors.push(color.r, color.g, color.b, 1);
		}

		const uniforms = {
			diffuseTexture: {
			    value: new THREE.TextureLoader().load('./assets/textures/fog.png')
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
			blending: THREE.NormalBlending, // THREE.AdditiveBlending for fire
			transparent: 	true,
			vertexColors: 	true
		});

		this._camera = camera;

		this._geometry = new THREE.BufferGeometry();
		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(position,3));
		this._geometry.setAttribute('size',     new THREE.Float32BufferAttribute(sizes,1));
		this._geometry.setAttribute('colour',   new THREE.Float32BufferAttribute(colors,4));
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

    _updateParticle(dt, i, sizes, colors, positions){
        positions[i*3] 	 += this._velocities[i].x * dt; 
        positions[i*3+1] += this._velocities[i].y * dt; 
        positions[i*3+2] += this._velocities[i].z * dt; 
        if (this._gravity)  this._velocities[i].y -= 9.81*dt;

        sizes[i]        += 0.01;
        colors[i*4+3]   -= 0.02;
    }

    _createParticle(i, sizes, colors, positions){
        positions[i*3] 	 = 0;
        positions[i*3+1] = 0;
        positions[i*3+2] = 0;

        sizes[i] 				= 0.1;
        this._lifetime[i] 	    = this._particleLifetime;
        this._velocities[i] 	= new THREE.Vector3(0,1,0);
    }

	update(dt){
		const positions = this._points.geometry.attributes.position.array;
		const sizes 	= this._points.geometry.attributes.size.array;
		const colors 	= this._points.geometry.attributes.colour.array;
		
		this._elapsed += dt;

		if (this._elapsed >= this._duration){
			let numNewParticles = Math.floor(this._elapsed / this._duration);

			for (let i = 0; i < numNewParticles; i++){
                this._createParticle(this._findUnusedParticle(), sizes, colors, positions);
			}		
			this._elapsed = 0
		}

		for (let i = 0; i < this.numParticles; i++){
			if (this._lifetime[i] > 0){

				this._lifetime[i] -= dt;

				if (this._lifetime[i] > 0){
                    this._updateParticle(dt, i, sizes, colors, positions);
				} else {
					positions[i*3]   = this._cache.x;
					positions[i*3+1] = this._cache.y;
					positions[i*3+2] = this._cache.z;
					sizes[i] 		 = 0;
					colors[i*4+3] 	 = 0;
				}
			}
		}

		this._points.geometry.attributes.position.needsUpdate 	= true;
		this._points.geometry.attributes.size.needsUpdate 		= true;
		this._points.geometry.attributes.colour.needsUpdate 	= true;
	}
}

export class Smoke extends ParticleSystem {
    constructor(gameObject, camera){
        super(gameObject, camera, 2000, 10, 3);
    }
}

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration){	
	// note: texture passed by reference, will be updated by the update function.
		
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet. 
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;

	// how long has the current image been displayed?
	this.currentDisplayTime = 0;

	// which image is currently being displayed?
	this.currentTile = 0;
		
	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y = currentRow / this.tilesVertical;
		}
	};
}



