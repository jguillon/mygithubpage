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

function toggleMenu() {
	var div = $('#menu');
	div.toggleClass('closed');
	if(div.hasClass('closed'))
		div.animate({ right: '-50vw' }, 600, 'easeOutElastic');
	else
		div.animate({ right: '-20vw' }, 600, 'easeOutElastic');
}

function selectNode()
{
	oldSelectedNode = selectedNode;
	selectedNode = graph.getNode(window.location.hash.substring(1));
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
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.enableZoom = false;
	controls.minPolarAngle = - Infinity;
	controls.maxPolarAngle = Infinity;
	controls.minDistance = 100;
	controls.maxDistance = 500;

	// NETWORK
	graph = new JG.Graph();
	var nodesToCheck = [$('#root-node')];
	var iParentNode = 0;
	graph.addNode(scene,nodesToCheck[0]);
	do {
		parentNode = nodesToCheck[iParentNode];
		childrenNodes = parentNode.children('.node');
		for(i=0; i<childrenNodes.length; i++) {
			nodesToCheck.push($(childrenNodes[i]));
			graph.addNode(scene,$(childrenNodes[i]));
			graph.addEdge(scene,graph.nodes[iParentNode],graph.nodes[graph.nodes.length-1]);
		}
		iParentNode++;
	} while(iParentNode < nodesToCheck.length);

	graph.layout.init();

	selectNode();

	// MOUSE 
	document.addEventListener( 'click', onMouseClick, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'resize', onWindowResize , false );
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
			if(intersects[i].object instanceof JG.Node) {
				if(hoveredNode)
					hoveredNode.unhover();
				hoveredNode = intersects[ i ].object;
				hoveredNode.hover();
				return;
			}	
		}
	}
	if(hoveredNode) {
		hoveredNode.unhover();
	}
	hoveredNode = null;	
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
				History.pushState({},selectedNode.htmlId,'#'+selectedNode.htmlId);
				return;
			}
		}
	}
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

	// VIEW
	controls.update();

	// CAMERA AUTO-ROTATION ANIMATION
	controls.constraint.rotateLeft(mouse.x/1000);
	controls.constraint.rotateUp(mouse.y/1000);

	hoverNode();

	graph.update();
}

function render() 
{
	renderer.render( scene, camera );
}
