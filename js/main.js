// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats, projector;
var mouse = { x: 0, y: 0 }, selectedNode;
var nodes = [];
var clock = new THREE.Clock();
var nodeRadius = 100;

init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();

	// CAMERA
	container = document.getElementById( 'network' );
	var SCREEN_WIDTH = container.offsetWidth;
	var SCREEN_HEIGHT = container.offsetHeight;
	var VIEW_ANGLE = 45;
	var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
	var NEAR = 0.1;
	var FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,1000,0);
	camera.lookAt(scene.position);	

	// RENDERER
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container.appendChild( renderer.domElement );

	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render );

	// NETWORK
	var nodesToCheck = [$('#root-node')];
	var iParentNode = 0;
	addNode(scene,nodesToCheck[0]);
	do {
		parentNode = nodesToCheck[iParentNode];
		childrenNodes = parentNode.children('.node');
		for(i=0; i<childrenNodes.length; i++) {
			nodesToCheck.push($(childrenNodes[i]));
			addNode(scene,$(childrenNodes[i]));
			addLink(scene,nodes[iParentNode],nodes[nodes.length-1]);
		}
		iParentNode++;
	} while(iParentNode < nodesToCheck.length);

	// MOUSE 
	// projector = new THREE.Projector();
	document.addEventListener( 'mousemove', onMouseMove, false );
	
}

function onMouseMove(event) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function addLink(scene,node1,node2) {
	var link = new JG.Link(node1,node2);
	scene.add(link);
}

function addNode(scene,jqueryObject) {
	var node = new JG.Node(jqueryObject);
	scene.add(node);
	nodes.push(node);
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{
	// MOUSE
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	vector.unproject(camera);
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = ray.intersectObjects( scene.children );
	if(intersects.length>0) {
		if(intersects[0].object!=selectedNode && intersects[0].object instanceof JG.Node) {
			if(selectedNode)
				selectedNode.unselect();
			selectedNode = intersects[ 0 ].object;
			selectedNode.select();
		}
	} else {	
		if(selectedNode) {
			selectedNode.unselect();
		}
		selectedNode = null;
	}

	// VIEW
	// console.log(0.1*Math.sin(clock.getElapsedTime()));
	// controls.rotateUp(0.01*Math.sin(clock.getElapsedTime()));
	// camera.position.x = 1000*Math.cos(2*Math.PI * Math.sin(clock.getElapsedTime()));
	// camera.position.y = 1000*Math.sin(2*Math.PI * Math.sin(clock.getElapsedTime()));
	controls.update();

	// NODES GLOW MATERIAL
	nodes.forEach(function(node, i) {
		node.update();
	});
}

function render() 
{
	renderer.render( scene, camera );
}
