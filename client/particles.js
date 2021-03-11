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
	constructor(parent, numParticles, particlesPerSecond, particleLifetime, texturePath){
		this._lastUsedParticle 	= 0;
		this._elapsed  			= 0;
		this._gravity 			= false;
        this._particlePerSec    = particlesPerSecond;
		this._duration 			= 1.0 / particlesPerSecond;  
		this._cache 			= new THREE.Vector3(0, 0, 0);

		this.numParticles 		= numParticles;
        this.startSize          = 0.1;
		this.particleLifetime   = particleLifetime;
        this.active             = true;
        this.alphaDegrading     = 0.2;
        this.scaleValue         = 0.1;

        this._particles = []

		for ( let i = 0; i < this.numParticles; i++ ) {
            this._particles.push({
                position: new THREE.Vector3(0,0,0),
                lifetime: -1,
                size: this.startSize,
                rotation: Math.random() * 2.0 * Math.PI,
                color: new THREE.Color(),
                velocity: new THREE.Vector3(),
                alpha: 0
            })
		}

		const uniforms = {
			diffuseTexture: {
			    value: new THREE.TextureLoader().load(texturePath)
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
		this._geometry.computeBoundingSphere()
		this._geometry.boundingSphere.set(this._cache, 100);
		this._points = new THREE.Points(this._geometry, this._material);
        this._updateGeometry();
		parent.add(this._points);
	}

    remove(){
        this._points.material.dispose();
        this._points.geometry.dispose();
        this._points.parent.remove(this._points);
    }

	_findUnusedParticle(){
		for (let i = this._lastUsedParticle; i < this.numParticles; i++){
			if (this._particles[i].lifetime <= 0){
				this._lastUsedParticle = i; 
				return i;
			} 
		}
		for (let i = 0; i < this._lastUsedParticle; i++){
			if (this._particles[i].lifetime <= 0){
				this._lastUsedParticle = i;
				return i;
			}
		}
        this._lastUsedParticle = 0;
		return 0;
    }

    _updateGeometry(){
        const positions = [];
        const sizes = [];
        const colours = [];
        const angles = [];

        for (let p of this._particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.color.r, p.color.g, p.color.b, p.alpha);
            sizes.push(p.size);
            angles.push(p.rotation);
        }

		this._points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
		this._points.geometry.setAttribute('size',     new THREE.Float32BufferAttribute(sizes,1));
		this._points.geometry.setAttribute('angle',    new THREE.Float32BufferAttribute(angles,1));
		this._points.geometry.setAttribute('colour',   new THREE.Float32BufferAttribute(colours,4));
        this._points.geometry.attributes.position.needsUpdate = true;
        this._points.geometry.attributes.size.needsUpdate = true;
        this._points.geometry.attributes.colour.needsUpdate = true;
        this._points.geometry.attributes.angle.needsUpdate = true;
    }

    _createParticle(unused){
        this._particles[unused].position.set(0,1,0);
        this._particles[unused].velocity.set(0,1,0);
        this._particles[unused].lifetime = this.particleLifetime;
        this._particles[unused].size = this.startSize;
        this._particles[unused].color = new THREE.Color();
        this._particles[unused].alpha = 1;
    }

    _updateParticles(dt){
		for (let i = 0; i < this.numParticles; i++){
			if (this._particles[i].lifetime > 0){

                this._particles[i].lifetime -= dt;

				if (this._particles[i].lifetime > 0){

                    this._particles[i].position.x += this._particles[i].velocity.x * dt;
                    this._particles[i].position.y += this._particles[i].velocity.y * dt;
                    this._particles[i].position.z += this._particles[i].velocity.z * dt; 
                    if (this._gravity)  this._particles[i].velocity.y -= 9.81*dt;

                    this._particles[i].size  += this.scaleValue  * dt;
                    this._particles[i].alpha -= this.alphaDegrading * dt;

                } else {
                    this._particles[i].position.copy(this._cache);
                    this._particles[i].alpha = 0;
                }
			}
		}
    }

	update(dt){
		this._elapsed += dt;

		if (this._elapsed >= this._duration && this.active){
            let numNewParticles = Math.floor(this._elapsed / this._duration);
            if (numNewParticles > this._particlePerSec) numNewParticles = this._particlePerSec;

            for (let i = 0; i < numNewParticles; i++){
                this._createParticle(this._findUnusedParticle());
            }		
            this._elapsed = 0
		}
        this._updateParticles(dt);
        this._updateGeometry();
	}
}

export class BulletImpact extends ParticleSystem {
    constructor(parent){
        super(parent, 100, 1, 1,'./assets/textures/spark.png');
        this._gravity = true;
        this.alphaDegrading = 1;
        this.scaleValue = 0.05
    }

    impact(pos){
        for (let i = 0; i < 5; i++){
            let unused = this._findUnusedParticle();
            this._particles[unused].position.copy(pos);

            let t1 = 10, t2 = 5;

            this._particles[unused].velocity.set(t1*Math.random()-t2, t1*Math.random()-t2, t1*Math.random()-t2);

            this._particles[unused].lifetime = this.particleLifetime;
            this._particles[unused].size = 0.1;
            this._particles[unused].color = new THREE.Color();
            this._particles[unused].alpha = 1;
       }		
    }

	update(dt){
        this._updateParticles(dt);
        this._updateGeometry();
	}
}

export class Smoke extends ParticleSystem {
    constructor(parent, source){
        super(parent, 1000, 10, 5,'./assets/textures/smoke.png');
        this._source = source;
    }

    _createParticle(unused){
        this._particles[unused].position.x = this._source.x + 0.25 * Math.random() - 0.125;
        this._particles[unused].position.y = this._source.y + 0.25 * Math.random() - 0.125;
        this._particles[unused].position.z = this._source.z + 0.25 * Math.random() - 0.125;

        this._particles[unused].velocity.set(0.25, 0.75, 0);
        this._particles[unused].lifetime = this.particleLifetime;
        this._particles[unused].size = this.startSize;
        this._particles[unused].color = new THREE.Color();
        this._particles[unused].alpha = 1;
    }
    /*
    _updateParticle(dt, i){
        this.particles[i].position.x += this.particles[i].velocity.x * dt;
        this.particles[i].position.y += this.particles[i].velocity.y * dt;
        this.particles[i].position.z += this.particles[i].velocity.z * dt; 
        this.particles[i].size  += 0.1  * dt;
        this.particles[i].alpha -= 0.2 * dt;
    }
    */
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



