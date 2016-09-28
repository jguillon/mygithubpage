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
	selectNode();
};

function scrollTo(href) {
	var speed = 600;
	$('html, body').animate( { scrollTop: $(href).offset().top - window.innerHeight*15/100 }, speed );
}

function toggleMenu() {
	var div = $('#menu');
	div.toggleClass('closed');
	if(div.hasClass('closed')) { // Closing menu
		if(svgicon.toggled)
			svgicon.toggle(true)
		div.animate({ right: '-70vmin' }, 600, 'easeOutElastic');
	} else { // Opened menu
		if(!svgicon.toggled)
			svgicon.toggle(true)
		div.animate({ right: '-20vmin' }, 600, 'easeOutElastic');
	}
}

function selectNode()
{
	var oldSelectedNode = selectedNode;
	var nodeId = window.location.hash.substring(1);
	if(nodeId === "") nodeId = "root-node";
	var selectedNode = graph.getNode(nodeId);
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

	// CONTROLS
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.rotateSpeed = 2.0;;
	controls.noZoom = true;
	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.2;

	// NETWORK
	graph = new JG.Graph();
	addSubTreeFrom(document.getElementById("root-node"));
	graph.layout.init();
	selectNode();

	// MOUSE
	document.addEventListener( 'click', onMouseClick, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'resize', onWindowResize , false );
}

function addSubTreeFrom(parentNode) {
	graph.addNode(scene, parentNode);
	var childrenNodes = $(parentNode).children('.node');
	for(var i=0; i<childrenNodes.length; i++) {
		addMenuEntry(parentNode, childrenNodes[i]);
		addSubTreeFrom(childrenNodes[i]);
		graph.addEdge(scene, graph.getNode(parentNode.id), graph.getNode(childrenNodes[i].id));
	}
}

function addMenuEntry(parent,child) {
	if($('#'+$(parent).attr('id')+'-menu').length == 0) {
		$('#'+$(parent).attr('id')+'-menu-entry').append('<ul id="'+$(parent).attr('id')+'-menu"></ul>');
	}
	$('#'+$(parent).attr('id')+'-menu').append('<li id="'+$(child).attr('id')+'-menu-entry'+'"><a href="#'+$(child).attr('id')+'" data-hover="'+$(child).attr('title')+'"><span>'+$(child).attr('title')+'</span></a></li>');
}

function onMouseMove(event) {
	oldMouse = mouse;
	mouse.x = ( (event.clientX - $(container).position().left) / $(container).width() ) * 2 - 1;
	mouse.y = -( ( event.clientY - ($(container).offset().top - $(window).scrollTop())) / $(container).height() ) * 2 + 1;
	hoverNode();
}

function hoverNode() {
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
	mouse.x = ( (event.clientX - $(container).position().left) / $(container).width() ) * 2 - 1;
	mouse.y = -( ( event.clientY - ($(container).offset().top - $(window).scrollTop())) / $(container).height() ) * 2 + 1;
	// MOUSE
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
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
				History.pushState({},selectedNode.htmlId,'#'+selectedNode.htmlId);
				scrollTo('#'+selectedNode.htmlId);
				return;
			}
		}
	}
}

function toXYCoords(pos) {
	var vector = pos.clone();
	vector.project(camera);
	vector.x = (vector.x + 1)/2 * window.innerWidth;
	vector.y = -(vector.y - 1)/2 * window.innerHeight;
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
	update();
	render();
}

function update()
{

	// CAMERA AUTO-ROTATION ANIMATION
	// controls.constraint.rotateLeft(mouse.x/1000);
	// controls.constraint.rotateUp(mouse.y/1000);
	controls.update();
	graph.update();
}

function render()
{

	// VIEW
	renderer.render( scene, camera );
}
