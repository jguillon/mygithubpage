/**
@author David Piegza

Implements a force-directed layout, the algorithm is based on Fruchterman and Reingold and
the JUNG implementation.

Needs the graph data structure Graph.js:
https://github.com/davidpiegza/Graph-Visualization/blob/master/Graph.js

Parameters:
graph - data structure
options = {
attraction: <float>, attraction value for force-directed layout
repulsion: <float>, repulsion value for force-directed layout
iterations: <int>, maximum number of iterations
width: <int>, width of the viewport
height: <int>, height of the viewport

positionUpdated: <function>, called when the position of the node has been updated
}

Examples:

create:
layout = new JG.Layout(graph, {width: 2000, height: 2000, iterations: 1000, layout: "3d"});

call init when graph is loaded (and for reset or when new nodes has been added to the graph):
layout.init();

call update in a render method, returns true if it's still calculating and false if it's finished
layout.update();


Feel free to contribute a new layout!

*/

JG.Layout = function(graph, options) {
	var options = options || {};

	this.layout = options.layout || "2d";
	this.attraction_multiplier = options.attraction || 5;
	this.repulsion_multiplier = options.repulsion || 0.75;
	this.max_iterations = options.iterations || 1000;
	this.graph = graph;
	this.width = options.width || 200;
	this.height = options.height || 200;
	this.finished = false;

	var EPSILON = 0.000001;
	var attraction_constant;
	var repulsion_constant;
	var forceConstant;
	var it = 0;
	var temperature = 0;
	var nodes_length;
	var edges_length;
	var that = this;

	/**
	* Initialize parameters used by the algorithm.
	*/
	this.init = function() {
		this.finished = false;
		temperature = this.width / 10.0;
		nodes_length = this.graph.nodes.length;
		edges_length = this.graph.edges.length;
		forceConstant = Math.sqrt(this.height * this.width / nodes_length);
		attraction_constant = this.attraction_multiplier * forceConstant;
		repulsion_constant = this.repulsion_multiplier * forceConstant;
	};

	/**
	* Generates the force-directed layout.
	*
	* It finishes when the number of max_iterations has been reached or when
	* the temperature is nearly zero.
	*/
	this.update = function() {
		if(it < this.max_iterations && temperature > 0.000001) {

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

						var delta_length = Math.max(EPSILON, Math.sqrt((delta_x * delta_x) + (delta_y * delta_y)));
						var delta_length_z = Math.max(EPSILON, Math.sqrt((delta_z * delta_z) + (delta_y * delta_y)));

						var force = (repulsion_constant * repulsion_constant) / delta_length;
						var force_z = (repulsion_constant * repulsion_constant) / delta_length_z;

						node_v.layout.force += force;
						node_u.layout.force += force;

						node_v.layout.offset_x += (delta_x / delta_length) * force;
						node_v.layout.offset_y += (delta_y / delta_length) * force;

						if(i==0) {
							node_u.layout.offset_x = 0;
							node_u.layout.offset_y = 0;
							node_u.layout.offset_z = 0;
						}
						node_u.layout.offset_x -= (delta_x / delta_length) * force;
						node_u.layout.offset_y -= (delta_y / delta_length) * force;

						node_v.layout.offset_z += (delta_z / delta_length_z) * force_z;
						node_u.layout.offset_z -= (delta_z / delta_length_z) * force_z;
					}
				}
			}

			// calculate attraction
			for(var i=0; i < edges_length; i++) {
				var edge = graph.edges[i];
				var delta_x = edge.source.layout.tmp_pos_x - edge.target.layout.tmp_pos_x;
				var delta_y = edge.source.layout.tmp_pos_y - edge.target.layout.tmp_pos_y;
				var delta_z = edge.source.layout.tmp_pos_z - edge.target.layout.tmp_pos_z;

				var delta_length = Math.max(EPSILON, Math.sqrt((delta_x * delta_x) + (delta_y * delta_y)));
				var delta_length_z = Math.max(EPSILON, Math.sqrt((delta_z * delta_z) + (delta_y * delta_y)));

				var force = (delta_length * delta_length) / attraction_constant;
				var force_z = (delta_length_z * delta_length_z) / attraction_constant;

				edge.source.layout.force -= force;
				edge.target.layout.force += force;

				edge.source.layout.offset_x -= (delta_x / delta_length) * force;
				edge.source.layout.offset_y -= (delta_y / delta_length) * force;
				edge.source.layout.offset_z -= (delta_z / delta_length_z) * force_z;

				edge.target.layout.offset_x += (delta_x / delta_length) * force;
				edge.target.layout.offset_y += (delta_y / delta_length) * force;
				edge.target.layout.offset_z += (delta_z / delta_length_z) * force_z;
			}

			// calculate positions
			for(var i=0; i < nodes_length; i++) {
				var node = graph.nodes[i];
				var delta_length = Math.max(EPSILON, Math.sqrt(node.layout.offset_x * node.layout.offset_x + node.layout.offset_y * node.layout.offset_y));
				var delta_length_z = Math.max(EPSILON, Math.sqrt(node.layout.offset_z * node.layout.offset_z + node.layout.offset_y * node.layout.offset_y));

				node.layout.tmp_pos_x += (node.layout.offset_x / delta_length) * Math.min(delta_length, temperature);
				node.layout.tmp_pos_y += (node.layout.offset_y / delta_length) * Math.min(delta_length, temperature);
				node.layout.tmp_pos_z += (node.layout.offset_z / delta_length_z) * Math.min(delta_length_z, temperature);

				var updated = true;
				node.position.x -=  (node.position.x-node.layout.tmp_pos_x)/10;
				node.position.y -=  (node.position.y-node.layout.tmp_pos_y)/10;
				node.position.z -=  (node.position.z-node.layout.tmp_pos_z)/10;
			}
			temperature *= (1 - (it / this.max_iterations));
			it++;
		} else {
			this.finished = true;
			return false;
		}
		return true;
	};

	this.stop = function() {
		it = this.max_iterations;
	}
};
