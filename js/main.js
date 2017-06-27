// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats, projector, graph;
var mouse = { x: 0, y: 0 }, oldMouse = { x: 0, y: 0 }, selectedNode, hoveredNode;
var clock = new THREE.Clock();
var nodeRadius = 100;
var lens = 40, minLens = 10, maxLens = 50;

init();
animate();

window.onpopstate = function() {
	console.log("onpopstate");
	selectNode();
};

function scrollTo(href) {
	var speed = 600;
	$('html, body').animate( { scrollTop: $(href).offset().top - window.innerHeight*15/100 }, speed );
}

function selectNode()
{
	var oldSelectedNode = selectedNode;
	var url = window.location.pathname;
	if(url === "") url = "/";
	selectedNode = graph.getNodeBy("url", url);
	if(selectedNode != null && selectedNode !== oldSelectedNode) {
		if(oldSelectedNode)
			oldSelectedNode.unselect();
		selectedNode.select();
	}
}

// FUNCTIONS
function init()
{
	// SCENE
	scene = new THREE.Scene();

	// CAMERA
	container = document.getElementById( 'network' );
	new ResizeSensor(container, onWindowResize);
	var SCREEN_WIDTH = container.offsetWidth;
	var SCREEN_HEIGHT = container.offsetHeight;
	var VIEW_ANGLE = 45;
	var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
	var NEAR = 1;
	var FAR = 3000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,0,500);
	camera.lookAt(scene.position);
	camera.setLens(lens);

	// RENDERER
	renderer = new THREE.WebGLRenderer( {antialias:true, alpha:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.setClearColor( 0x001D0D, 0);
	container.appendChild( renderer.domElement );

	// NETWORK
	graph = new JG.Graph();
	growTree("/graph.json");

	// CONTROLS
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.rotateSpeed = 2.0;;
	controls.noZoom = true;
	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.2;

	// MOUSE
	document.addEventListener( 'click', onMouseClick, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'resize', onWindowResize , false );

	// STATS
	// stats = new Stats();
	// container.appendChild( stats.dom );
}

function growTree(url) {
	$.getJSON(url, function(data) {
	  growBranchFrom(data.nodes[0]);
		graph.layout.init();
		selectNode();
		controls.target = graph.nodes[0].position;
		$(container).trigger('graphloaded');
	});
}

function growBranchFrom(parentNodeJSON) {
	var parentNode = new JG.Node(parentNodeJSON.id);
	parentNode.title = parentNodeJSON.title
	parentNode.url = parentNodeJSON.url;
	graph.addNode(scene, parentNode);
	var childrenNodesJSON = parentNodeJSON.nodes;
	if(typeof childrenNodesJSON != 'undefined') {
		for(var i = 0; i < childrenNodesJSON.length; i++) {
			addMenuEntry(parentNodeJSON, childrenNodesJSON[i]);
			growBranchFrom(childrenNodesJSON[i]);
			graph.addEdge(scene,
				graph.getNodeBy("htmlId", parentNodeJSON.id),
				graph.getNodeBy("htmlId", childrenNodesJSON[i].id));
		}
	}
}

function addMenuEntry(parent,child) {
	if($('#'+parent.id+'-menu').length == 0) {
		$('#'+parent.id+'-menu-entry').append('<ul id="'+parent.id+'-menu"></ul>');
	}
	$('#'+parent.id+'-menu').append('<li id="'+child.id+'-menu-entry'+'"><a href="'+child.url+'" data-hover="'+child.title+'"><span>'+child.title+'</span></a></li>');
}

function onMouseMove(event) {
	oldMouse = mouse;
	mouse.x =  ( ( event.clientX - $(container).position().left )
		/ $(container).width()  ) * 2 - 1;
	mouse.y = -( ( event.clientY - $(container).position().top + $(window).scrollTop() - parseInt($(container).css('margin-top')) )
		/ $(container).height() ) * 2 + 1;

	// MOUSE HOVERING
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	vector.unproject(camera);
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = ray.intersectObjects( scene.children );
	if(intersects.length>0) {
		for(i=0; i<intersects.length; i++) {
			if(intersects[i].object instanceof JG.Node && intersects[i].object.visible) {
				if(intersects[i].object == hoveredNode) {
				 	return;
				} else {
					if(hoveredNode)
						hoveredNode.unhover();
					hoveredNode = intersects[i].object;
					hoveredNode.hover();
					return;
				}
			}
		}
	}
	if(hoveredNode) {
		hoveredNode.unhover();
		hoveredNode = null;
	}
}

function onMouseClick(event) {
	console.log(event.clientY);
	console.log('onMouseClick');
	mouse.x =  ( ( event.clientX - $(container).position().left )
		/ $(container).width()  ) * 2 - 1;
	mouse.y = -( ( event.clientY - $(container).position().top + $(window).scrollTop() - parseInt($(container).css('margin-top')) )
		/ $(container).height() ) * 2 + 1;
	// MOUSE
	var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	vector.unproject(camera);
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = ray.intersectObjects( scene.children );
	if(intersects.length>0) {
		for(i=0; i<intersects.length; i++) {
			if(intersects[i].object!=selectedNode && intersects[i].object instanceof JG.Node) {
				if(selectedNode)
					selectedNode.unselect();
				selectedNode = intersects[i].object;
				selectedNode.select();
				graph.layout.init();
				console.log("pushState");
				console.log(selectedNode);
				History.pushState({}, selectedNode.htmlId, selectedNode.url);
				// scrollTo('#'+selectedNode.htmlId);
				scrollTo('#container');
				return;
			}
		}
	}
}

function toXYCoords(pos) {
	var vector = pos.clone();
	vector.project(camera);
	vector.x = (vector.x + 1)/2 * $(container).width();
	vector.y = -(vector.y - 1)/2 * $(container).height() + parseInt($(container).css('margin-top'));
	return vector;
}

function onWindowResize(){
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( container.offsetWidth, container.offsetHeight );
}

function animate()
{
	requestAnimationFrame( animate );

	// Update
	graph.update();
	controls.update();

	// Render
	renderer.render( scene, camera );

	// Stats
	// stats.update();
}
