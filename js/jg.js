// scene, camera and clock have to be global variables;

var JG = {REVISION:"2"};

/********************************************************************
 * Network Class													*
 ********************************************************************/

JG.Network = function() {

	// Constructor __________________________________________________


	// Attributes ___________________________________________________
	this.domElement = "";

	// Methods ______________________________________________________
	
};


/********************************************************************
 * Node Class														*
 ********************************************************************/

JG.Node = function(jqueryObject) {
	
	// Constructor __________________________________________________
	var radius = 100;
	var geometry = new THREE.SphereGeometry( radius, 64, 64 );
	var material = new THREE.ShaderMaterial({
	    uniforms: { 
			"c":   { type: "f", value: 0.3 },
			"p":   { type: "f", value: 6.0 },
			color: { type: "c", value: new THREE.Color(0x3e8291) },
			viewVector: { type: "v3", value: camera.position }
		},
		vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
		side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	});
	THREE.Mesh.call(this,geometry,material);
	var x = (2*Math.random()-1)*1000;
	var y = (2*Math.random()-1)*1000;
	var z = (2*Math.random()-1)*1000;
	this.position.set(x,y,z);

	// Attributes ___________________________________________________
	this.defaultColor = 0x3e8291;
	this.highlightColor = 0xf070f0;
	this.selected = false;
	this.animationDelay = 5*Math.random();
	this.jqueryObject = jqueryObject;

	// Methods ______________________________________________________
	this.select = function() {
		console.log("HOVER");
		this.selected = true;
		this.material.uniforms.color.value.setHex(this.highlightColor);
	};
	this.unselect = function() {
		this.selected = false;
		this.material.uniforms.color.value.setHex(this.defaultColor);
		this.scale.setX(1.0);
		this.scale.setY(1.0);
		this.scale.setZ(1.0);
	};
	this.update = function() {
		this.material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, this.position );
		this.scale.multiplyScalar(1.0+0.005*Math.sin(this.animationDelay + clock.getElapsedTime()));
	};

};
JG.Node.prototype = Object.create(THREE.Mesh.prototype);


/********************************************************************
 * Link Class														*
 ********************************************************************/

JG.Link = function(node1, node2) {

	// Constructor __________________________________________________
	var geometry = new THREE.Geometry();
    geometry.vertices.push(node1.position);
    geometry.vertices.push(node2.position);
	var material = new THREE.LineBasicMaterial({color: 0xffffff });
	THREE.Line.call(this,geometry,material);
};
JG.Link.prototype = Object.create(THREE.Line.prototype);