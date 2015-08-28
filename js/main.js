// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats, projector, graph;
var mouse = { x: 0, y: 0 }, oldMouse = { x: 0, y: 0 }, selectedNode;
var clock = new THREE.Clock();
var nodeRadius = 100;

init();
animate();

// window.onpopstate = function(){
// 	selectNode();
// };

History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
	selectNode();
});

function selectNode()
{
	urlElems = window.location.pathname.split('/');
	if(selectedNode)
		selectedNode.unselect();
	selectedNode = graph.getNode(urlElems[urlElems.length-1]);
	if(selectedNode)
		selectedNode.select();	
}

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
	var NEAR = 1000;
	var FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,3000,0);
	camera.lookAt(scene.position);	

	// RENDERER
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container.appendChild( renderer.domElement );

	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render );
	controls.minDistance = NEAR*2;
	controls.maxDistance = FAR/2;

	// NETWORK
	graph = new JG.Graph();
	var nodesToCheck = [$('#root-node.html')];
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

	// SKYDOME
	var urlPrefix = "/img/skybox_";
	var urls = [ urlPrefix + "right1.png", urlPrefix + "left2.png",
		urlPrefix + "top3.png", urlPrefix + "bottom4.png",
		urlPrefix + "front5.png", urlPrefix + "back6.png" ];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls );
	var shader = THREE.ShaderLib["cube"];
	shader.uniforms['tCube'].value = textureCube;   // textureCube has been init before
	var material = new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		depthwrite : false,
		side: THREE.BackSide
	});
	skybox = new THREE.Mesh( new THREE.BoxGeometry( 10000, 10000, 10000), material );
	scene.add(skybox);

	// MOUSE 
	document.addEventListener( 'click', onMouseClick, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'resize', onWindowResize , false );
	
}

function onMouseMove(event) {
	oldMouse = mouse;
	mouse.x = ( (event.clientX - $(container).position().left) / $(container).width() ) * 2 - 1;
	mouse.y = - ( event.clientY / $(container).height() ) * 2 + 1;
	// MOUSE HOVERING
	// var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	// vector.unproject(camera);
	// var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	// var intersects = ray.intersectObjects( scene.children );
	// if(intersects.length>0) {
	// 	if(intersects[0].object!=selectedNode && intersects[0].object instanceof JG.Node) {
	// 		if(selectedNode)
	// 			selectedNode.unselect();
	// 		selectedNode = intersects[ 0 ].object;
	// 		// selectedNode.select();
	// 	}
	// } else {	
	// 	if(selectedNode) {
	// 		// selectedNode.unselect();
	// 	}
	// 	selectedNode = null;
	// }
}

function onMouseClick(event) {
	mouse.x = ( (event.clientX - $(container).position().left) / $(container).width() ) * 2 - 1;
	mouse.y = - ( event.clientY / $(container).height() ) * 2 + 1;
	// MOUSE
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	vector.unproject(camera);
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = ray.intersectObjects( scene.children );
	if(intersects.length>0) {
		for(i=0; i<intersects.length; i++) {
			if(intersects[i].object!=selectedNode && intersects[0].object instanceof JG.Node) {
				if(selectedNode)
					selectedNode.unselect();
				selectedNode = intersects[i].object;
				selectedNode.select();
				return;
			}
		}
	} else {	
		if(selectedNode) {
			selectedNode.unselect();
		}
		selectedNode = null;
	}
}

function onWindowResize(){
	container = document.getElementById( 'network' );
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( container.offsetWidth, container.offsetHeight );
}

function animate() 
{
	requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{

	// VIEW
	controls.update();

	// CAMERA AUTO-ROTATION ANIMATION
	controls.rotateLeft(mouse.x/1000);
	controls.rotateUp(mouse.y/1000);

	graph.update();
}

function render() 
{
	renderer.render( scene, camera );
}
