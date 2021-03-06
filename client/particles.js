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
		this._duration 			= 1 / particlesPerSecond;  
		this._cache 			= new THREE.Vector3(0, -10, 0);


		this._particleLifetime  = function(){
			return particleLifetime;
		};

		this._particleOrigin = function(){
			return new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
		}

		this._particleSize = function(){
			return 1;
		};

		this._particleVelocity = function(){
			let dir = new THREE.Vector3(0,1,0);
			dir.normalize();
			return dir.multiplyScalar(1 + Math.random() * 5);		
		}

		const position = [], sizes = [], colors = []
		this._velocities = []
		this._sub_alpha = []

		for ( let i = 0; i < this.numParticles; i++ ) {
			position.push(this._cache.x, this._cache.y, this._cache.z);
			this._lifetime.push(-1);
			this._sub_alpha.push(0)
			this._velocities.push( new THREE.Vector3(0, 0, 0))
			sizes.push(10)
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

				this._sub_alpha[newParticle] = 1.0 / this._lifetime[newParticle];

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
					if (this._gravity)  this._velocities[i].y -= 9.81*dt;

					//colors[i*4+3] -= this._sub_alpha[i] * dt;

				} else {
					positions[i*3]   = this._cache.x;
					positions[i*3+1] = this._cache.y;
					positions[i*3+2] = this._cache.z;
					sizes[i] 		= 0;
					colors[i*4+3] 	= 0;
				}
			}
		}

		this._points.geometry.attributes.position.needsUpdate 	= true;
		this._points.geometry.attributes.size.needsUpdate 		= true;
		this._points.geometry.attributes.colour.needsUpdate 	= true;
	}
}

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{	
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

export class MuzzleFlash extends Component {
	constructor(gameObject){
		super(gameObject);
		this.name = "MuzzleFlash";

		/*
		this.on = true;
		this.light = new THREE.PointLight( 0xff0000, 0.5, 100 );
		//this.light.position.set(0, 2, 0);
		this.light.position.set(1,0.2,-2)
		this.gameObject.transform.add(this.light)
		*/

		/*
		let texture = new THREE.TextureLoader().load('./explosion.jpg');
		texture.repeat.set(4,4)
		const material = new THREE.SpriteMaterial( { map: texture } );
		const sprite = new THREE.Sprite( material )
		sprite.position.set(0,1,0);
		sprite.scale.set(5,5,5);
		this.gameObject.transform.add(sprite);
		*/

		var explosionTexture = new THREE.TextureLoader().load( './explosion.jpg' );
		this.boomer = new TextureAnimator( explosionTexture, 4, 4, 16, 55 ); // texture, #horiz, #vert, #total, duration.
		var explosionMaterial = new THREE.SpriteMaterial( { map: explosionTexture } );
		var cube = new THREE.Sprite( explosionMaterial );
		cube.position.set(0,2,0);
		cube.scale.set(5,5,5);
		this.gameObject.transform.add(cube);

	}

	update(dt){
		this.boomer.update(dt * 1000);
	}

	/*
	update(dt){

		this._elapsed += dt;
		if (this._elapsed >= this._duration){

			if (this.on){
				//console.log("on");
				this.light.color.setHex( 0xffffff );
					
			} else {
				//console.log("off");
				this.light.color.setHex( 0x000000 );
			}

			this.on = !this.on;
			this._elapsed = 0;
		}
	}
	*/


}

