import * as THREE from './three/build/three.module.js';
import { Component } from './components.js'

const _VS = `
uniform float pointMultiplier;
attribute float size;
attribute float angle;
attribute vec4 colour;
varying vec4 vColour;
varying vec2 vAngle;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * pointMultiplier / gl_Position.w;
    vAngle = vec2(cos(angle), sin(angle));
    vColour = colour;
}`;

const _FS = `
uniform sampler2D diffuseTexture;
varying vec4 vColour;
varying vec2 vAngle;

void main() {
    vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
    gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

export class ParticleSystem {
	constructor(parent, numParticles, particlesPerSecond, particleLifetime){

		this._lastUsedParticle 	= 0;
		this._elapsed  			= 0;
		this._lifetime 			= [];
		this._gravity 			= false;
		this._numParticles 		= numParticles;
        this._particlePerSec    = particlesPerSecond;
		this._duration 			= 1.0 / particlesPerSecond;  
		this._cache 			= new THREE.Vector3(0, -10, 0);
		this._particleLifetime  = particleLifetime;
        this._startSize         = 0.1;
        this.active             = true;

		const position = [], sizes = [], colors = [], rotation = []
		this._velocities = []

		for ( let i = 0; i < this._numParticles; i++ ) {
			position.push(this._cache.x, this._cache.y, this._cache.z);
			this._lifetime.push(-1);
			this._velocities.push(new THREE.Vector3(0, 0, 0))
			sizes.push(this._startSize)
            rotation.push(Math.random() * 2.0 * Math.PI)
			colors.push(1,1,1,1);
		}

		const uniforms = {
			diffuseTexture: {
			    value: new THREE.TextureLoader().load('./assets/textures/smoke.png')
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

		this._geometry = new THREE.BufferGeometry();
		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(position,3));
		this._geometry.setAttribute('size',     new THREE.Float32BufferAttribute(sizes,1));
		this._geometry.setAttribute('angle',    new THREE.Float32BufferAttribute(rotation,1));
		this._geometry.setAttribute('colour',   new THREE.Float32BufferAttribute(colors,4));
		this._geometry.computeBoundingSphere()
		this._geometry.boundingSphere.set(this._cache, 100);

		this._points = new THREE.Points(this._geometry, this._material);

        //console.log(gameObject)
		parent.add(this._points);
	}

    remove(){
        this._points.material.dispose();
        this._points.geometry.dispose();
        this._points.parent.remove(this._points);
    }

	_findUnusedParticle(){
		for (let i = this._lastUsedParticle; i < this._numParticles; i++){
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

    _updateParticle(dt, i, sizes, colors, positions, rotation){
        positions[i*3] 	 += this._velocities[i].x * dt; 
        positions[i*3+1] += this._velocities[i].y * dt; 
        positions[i*3+2] += this._velocities[i].z * dt; 
        if (this._gravity)  this._velocities[i].y -= 9.81*dt;

        rotation[i]     += 0.1  * dt;
        sizes[i]        += 0.1  * dt;
        colors[i*4+3]   -= 0.02 * dt;
    }

    _createParticle(i, sizes, colors, positions){
        positions[i*3] 	 = 0;
        positions[i*3+1] = 0;
        positions[i*3+2] = 0;

        sizes[i] 				= this._startSize;
        this._lifetime[i] 	    = this._particleLifetime;
        this._velocities[i] 	= new THREE.Vector3(0,1,0);
    }

	update(dt){
		const positions = this._points.geometry.attributes.position.array;
		const sizes 	= this._points.geometry.attributes.size.array;
		const colors 	= this._points.geometry.attributes.colour.array;
		const rotation 	= this._points.geometry.attributes.angle.array;
		
		this._elapsed += dt;

		if (this._elapsed >= this._duration && this.active){
            let numNewParticles = Math.floor(this._elapsed / this._duration);

            if (numNewParticles > this._particlePerSec) numNewParticles = this._particlePerSec;

            for (let i = 0; i < numNewParticles; i++){
                this._createParticle(this._findUnusedParticle(), sizes, colors, positions);
            }		
			this._elapsed = 0
		}

		for (let i = 0; i < this._numParticles; i++){
			if (this._lifetime[i] > 0){

				this._lifetime[i] -= dt;

				if (this._lifetime[i] > 0){
                    this._updateParticle(dt, i, sizes, colors, positions, rotation);
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
		this._points.geometry.attributes.angle.needsUpdate 	    = true;
	}
}

export class Smoke extends ParticleSystem {
    constructor(parent, source){
        super(parent, 1000, 10, 5);
        this._source = source;
    }

    _updateParticle(dt, i, sizes, colors, positions){

        positions[i*3] 	 += this._velocities[i].x * dt; 
        positions[i*3+1] += this._velocities[i].y * dt; 
        positions[i*3+2] += this._velocities[i].z * dt; 
        if (this._gravity)  this._velocities[i].y -= 9.81*dt;

        sizes[i]        += 0.1 * dt;
        colors[i*4+3]   -= 0.2 * dt;
    }

    _createParticle(i, sizes, colors, positions, rotation){
        positions[i*3] 	 = this._source.x + 0.25 * Math.random() - 0.125;
        positions[i*3+1] = this._source.y + 0.25 * Math.random() - 0.125;
        positions[i*3+2] = this._source.z + 0.25 * Math.random() - 0.125;

        sizes[i] 				= 0.1;
        this._lifetime[i] 	    = this._particleLifetime;
        this._velocities[i] 	= new THREE.Vector3(0.25,0.75,0);
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



