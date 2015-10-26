// scene, camera, container and clock have to be global variables;

var JG = {
	REVISION: "2",
	DEFAULT_COLOR: 0x55777f,
	HOVER_COLOR: 0x3e8291,
	SELECTION_COLOR: 0xFFAE75,
	HOVER_SELECTION_COLOR: 0xFF7C1D,
	HOVERED_TITLE: $("div#node-title-box h1")
};

/********************************************************************
 * Graph Class														*
 ********************************************************************/

 JG.Graph = function() {

	// Constructor __________________________________________________

	// Attributes ___________________________________________________
	this.nodes = [];
	this.edges = [];
	this.layout = new JG.Layout(this);

	// Methods ______________________________________________________
	this.addEdge = function(scene,node1,node2) {
		var edge = new JG.Edge(node1,node2);
		scene.add(edge);
		this.edges.push(edge);
	};
	this.addNode = function(scene,jqueryObject) {
		var node = new JG.Node(jqueryObject);
		node.jqueryObject.appendTo("#content");
		node.jqueryObject.hide();
		scene.add(node);
		this.nodes.push(node);
	};
	this.update = function() {
		this.layout.update();
		this.nodes.forEach(function(node, i) {
			node.update();
		});
		this.edges.forEach(function(edge, i) {
			edge.update();
		});
	};
	this.getNode = function(id) {
		var n = null;
		this.nodes.forEach(function(node, i) {
			if(node.htmlId === id)
				n = node;
		});
		return n;
	};
	
};


/********************************************************************
 * Node Class														*
 ********************************************************************/

 JG.Node = function(jqueryObject) {

	// Constructor __________________________________________________
	var radius = 10;
	var geometry = new THREE.SphereGeometry( radius, 32, 32 );
	var material = new THREE.ShaderMaterial({
		uniforms: { 
			"c":   { type: "f", value: 0.25 },
			"p":   { type: "f", value: 6.0 },
			color: { type: "c", value: new THREE.Color(JG.DEFAULT_COLOR) },
			viewVector: { type: "v3", value: camera.position }
		},
		vertexShader:   document.getElementById( 'vertexShaderNode'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderNode' ).textContent,
		side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true
	});
	THREE.Mesh.call(this,geometry,material);
	var x = Math.random();
	var y = Math.random();
	var z = Math.random();
	this.position.set(x,y,z);
	var map = THREE.ImageUtils.loadTexture( "img/education.png" );
	var spriteMaterial = new THREE.SpriteMaterial( { map: map, color: 0x3D5857, fog: true } );
	var sprite = new THREE.Sprite( spriteMaterial ); 
	sprite.scale.set(5,5,5);
	sprite.visible = false;
	scene.add(sprite);

	// Attributes ___________________________________________________
	this.htmlId = jqueryObject.attr('id');
	this.selected = false;
	this.animationDelay = Math.PI*Math.random();
	this.jqueryObject = jqueryObject;
	this.material = material;
	this.geometry = geometry;
	this.icon = sprite;
	this.hovered = false;

	// Methods ______________________________________________________
	this.select = function() {
		this.selected = true;
		this.material.uniforms.color.value.setHex(JG.SELECTION_COLOR);
		this.jqueryObject.show();
		$("#content").css("display","block");
	};
	this.unselect = function() {
		this.selected = false;
		this.material.uniforms.color.value.setHex(JG.DEFAULT_COLOR);
		this.scale.setX(1.0);
		this.scale.setY(1.0);
		this.scale.setZ(1.0);
		this.jqueryObject.hide();
	};
	this.hover = function() {
		this.hovered = true;
		this.icon.visible = true;
		JG.HOVERED_TITLE.html(this.jqueryObject.attr("title"));
		JG.HOVERED_TITLE.attr('data-letters',this.jqueryObject.attr("title"));
		JG.HOVERED_TITLE.addClass('kukuri-hover');
		if(this.selected)
			this.material.uniforms.color.value.setHex(JG.HOVER_SELECTION_COLOR);
		else
			this.material.uniforms.color.value.setHex(JG.HOVER_COLOR);
	};
	this.unhover = function() {
		this.hovered = false;
		this.icon.visible = false;
		JG.HOVERED_TITLE.removeClass('kukuri-hover');
		if(this.selected)
			this.material.uniforms.color.value.setHex(JG.SELECTION_COLOR);
		else
			this.material.uniforms.color.value.setHex(JG.DEFAULT_COLOR);
	};
	this.update = function() {
		this.icon.position.set(this.position.x,this.position.y,this.position.z);
		this.material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, this.position );
	};

};
JG.Node.prototype = Object.create(THREE.Mesh.prototype);


/********************************************************************
 * Edge Class														*
 ********************************************************************/

 JG.Edge = function(node1, node2) {

	// Constructor __________________________________________________
	var geometry = new THREE.Geometry();
	var nLines = 4;
	for (var i = 0; i<nLines; i++) {
		geometry.vertices.push(new THREE.Vector3());
		geometry.vertices.push(new THREE.Vector3());
	}
	// var material = new THREE.LineBasicMaterial({color: 0xffffff });
	var attributes = {
		displacement: {	type: 'v3', value: [] },
		customColor: {	type: 'c', value: [] }
	};
	var uniforms = {
		amplitude: { type: "f", value: 5.0 },
		opacity:   { type: "f", value: 0.3 },
		color:     { type: "c", value: new THREE.Color(0xffffff) }
	};
	var material = new THREE.ShaderMaterial( {
		uniforms:       uniforms,
		attributes:     attributes,
		vertexShader:   document.getElementById( 'vertexShaderEdge' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderEdge' ).textContent,
		blending:       THREE.AdditiveBlending,
		depthTest:      false,
		transparent:    true,
		linewidth: 		2
	});
	THREE.Line.call(this,geometry,material,THREE.LineStrip);

	// Attributes ___________________________________________________
	this.geometry = geometry;
	this.material = material;
	this.source = node1;
	this.target = node2;

	// Methods ______________________________________________________
	this.update = function() {
		this.material.uniforms.amplitude.value = 5 * Math.sin( 0.5 * clock.getElapsedTime() );
		this.material.needsUpdate = true;
		for( var i = 0; i < this.geometry.vertices.length; i ++ ) {
			if(i%2 == 0) {
				this.material.attributes.customColor.value[i] = this.source.material.uniforms.color.value;
				this.geometry.vertices[i] = this.source.position;
			} else {
				this.material.attributes.customColor.value[i] = this.target.material.uniforms.color.value;
				this.geometry.vertices[i] = this.target.position;
			}
			this.material.attributes.displacement.value[i] = new THREE.Vector3(0.5 - Math.random(),
				0.5 - Math.random(),
				0.5 - Math.random());
		}
		this.geometry.verticesNeedUpdate = true;
		this.material.attributes.customColor.needsUpdate = true;
		this.material.attributes.displacement.needsUpdate = true;
	};

};
JG.Edge.prototype = Object.create(THREE.Line.prototype);


/********************************************************************
 * Layout Class														*
 ********************************************************************/

 JG.Layout = function(graph, options) {

	// Constructor __________________________________________________
	var options = options || {};
	var EPSILON = 0.0000001;
	var attraction_constant;
	var repulsion_constant;
	var forceConstant;
	var it = 0;
	var temperature = 0;
	var nodes_length;
	var edges_length;

	// Attributes ___________________________________________________
	this.attraction_multiplier = options.attraction || 5;
	this.repulsion_multiplier = options.repulsion || 0.75;
	this.max_iterations = options.iterations || 2000;
	this.graph = graph;
	this.width = options.width || 50;
	this.height = options.height || 50;
	this.finished = false;
	this.pause = true;


	// Methods ______________________________________________________
	this.init = function() {
		this.finished = false;
		temperature = this.width / 10.0;
		nodes_length = this.graph.nodes.length;
		edges_length = this.graph.edges.length;
		forceConstant = Math.sqrt(this.height * this.width / nodes_length);
		attraction_constant = this.attraction_multiplier * forceConstant;
		repulsion_constant = this.repulsion_multiplier * forceConstant;
	};
	this.update = function() {
		if(it < this.max_iterations && temperature > 0.000001 && !this.pause) {
			// calculate repulsion
			for(var i=0; i < nodes_length; i++) {
				var node_v = graph.nodes[i];
				node_v.layout = node_v.layout || {};
				if(i==0) {
					node_v.layout.offset_x = 0;
					node_v.layout.offset_y = 0;
					node_v.layout.offset_z = 0;
				}
				node_v.layout.force = 0;
				node_v.layout.tmp_pos_x = node_v.layout.tmp_pos_x || node_v.position.x;
				node_v.layout.tmp_pos_y = node_v.layout.tmp_pos_y || node_v.position.y;
				node_v.layout.tmp_pos_z = node_v.layout.tmp_pos_z || node_v.position.z;
				for(var j=i+1; j < nodes_length; j++) {
					var node_u = graph.nodes[j];
					if(i != j) {
						node_u.layout = node_u.layout || {};
						node_u.layout.tmp_pos_x = node_u.layout.tmp_pos_x || node_u.position.x;
						node_u.layout.tmp_pos_y = node_u.layout.tmp_pos_y || node_u.position.y;
						node_u.layout.tmp_pos_z = node_u.layout.tmp_pos_z || node_u.position.z;

						var delta_x = node_v.layout.tmp_pos_x - node_u.layout.tmp_pos_x;
						var delta_y = node_v.layout.tmp_pos_y - node_u.layout.tmp_pos_y;
						var delta_z = node_v.layout.tmp_pos_z - node_u.layout.tmp_pos_z;

						var delta_length = Math.max(EPSILON, Math.sqrt((delta_x * delta_x) 
							+ (delta_y * delta_y) 
							+ (delta_z * delta_z)));

						var force = (repulsion_constant * repulsion_constant) / delta_length;

						node_v.layout.force += force;
						node_u.layout.force += force;

						node_v.layout.offset_x += (delta_x / delta_length) * force;
						node_v.layout.offset_y += (delta_y / delta_length) * force;
						node_v.layout.offset_z += (delta_z / delta_length) * force;

						if(i==0) {
							node_u.layout.offset_x = 0;
							node_u.layout.offset_y = 0;
							node_u.layout.offset_z = 0;
						}
						node_u.layout.offset_x -= (delta_x / delta_length) * force;
						node_u.layout.offset_y -= (delta_y / delta_length) * force;
						node_u.layout.offset_z -= (delta_z / delta_length) * force;
					}
				}
			}
			// calculate attraction
			for(var i=0; i < edges_length; i++) {
				var edge = graph.edges[i];
				var delta_x = edge.source.layout.tmp_pos_x - edge.target.layout.tmp_pos_x;
				var delta_y = edge.source.layout.tmp_pos_y - edge.target.layout.tmp_pos_y;
				var delta_z = edge.source.layout.tmp_pos_z - edge.target.layout.tmp_pos_z;

				var delta_length = Math.max(EPSILON, Math.sqrt((delta_x * delta_x) 
					+ (delta_y * delta_y) 
					+ (delta_z * delta_z)));

				var force = (delta_length * delta_length) / attraction_constant;

				// edge.source.layout.force -= force;
				// edge.target.layout.force += force;

				edge.source.layout.offset_x -= (delta_x / delta_length) * force;
				edge.source.layout.offset_y -= (delta_y / delta_length) * force;
				edge.source.layout.offset_z -= (delta_z / delta_length) * force;

				edge.target.layout.offset_x += (delta_x / delta_length) * force;
				edge.target.layout.offset_y += (delta_y / delta_length) * force;
				edge.target.layout.offset_z += (delta_z / delta_length) * force;
			}
			// calculate positions
			for(var i=0; i < nodes_length; i++) {
				var node = graph.nodes[i];
				var delta_length = Math.max(EPSILON, Math.sqrt(node.layout.offset_x * node.layout.offset_x 
					+ node.layout.offset_y * node.layout.offset_y 
					+ node.layout.offset_z * node.layout.offset_z));

				node.layout.tmp_pos_x += (node.layout.offset_x / delta_length) * Math.min(delta_length, temperature);
				node.layout.tmp_pos_y += (node.layout.offset_y / delta_length) * Math.min(delta_length, temperature);
				node.layout.tmp_pos_z += (node.layout.offset_z / delta_length) * Math.min(delta_length, temperature);

				var updated = true;
				node.position.x -=  (node.position.x-node.layout.tmp_pos_x)/10;
				node.position.y -=  (node.position.y-node.layout.tmp_pos_y)/10;
				node.position.z -=  (node.position.z-node.layout.tmp_pos_z)/10;
			}
			temperature *= (1 - (it / this.max_iterations));
			it++;
		} else if(it >= this.max_iterations && temperature <= 0.000001) {
			this.finished = true;
			return false;
		}
		return true;
	};
	this.play = function() {
		this.pause = false;
	};
	this.pause = function() {
		this.pause = true;
	};
	this.stop = function() {
		it = this.max_iterations;
	};

};
