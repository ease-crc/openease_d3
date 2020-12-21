
var d3 = require('d3');

module.exports = function(options){
    var that = this;
    options = options || {};
    // keep track of widget size.
    // width is set to parent width, and height is dynamically computed in this module.
    var width = options.width || 200;
    var height = options.height || 400;
    // the parent div
    var where = options.where;
    // coloring of nodes
    var color = d3.scale.category20();

    // number of node groups in the graph
    this.numGroups = 0;
    // max number of nodes in a group
    this.maxGroupSize = 0;
    // group gravity points
    this.groupCenter = [{x: 0, y: 0}];

    $(window).on('resize', function() {
        that.updateGravity();
    });

    // Create a SVG element. The graph is then added to the SVG.
    // NOTE: it is perfectly possible to render some custom stuff into this SVG too!
    var svg = d3.select(where[0])
        .append("svg")
        .attr("class", "chart")
        .attr("width", "100%")
        .attr("height", height);

    // Add arrow head shape to SVG.
    // NOTE: edges are by default undirected. Here we add an arrow head shape
    // to SVG to use it for edges.
    svg.append('defs').append('marker')
        .attr("id",'arrowhead')
        // the bound of the SVG viewport for the current SVG fragment. defines a coordinate
        // system 10 wide and 10 high starting on (0,-5)
        .attr('viewBox','-0 -5 10 10')
        // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
        .attr('refX',19)
        .attr('refY',0)
        .attr('orient','auto')
        .attr('markerWidth',5)
        .attr('markerHeight',5)
        .attr('xoverflow','visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#008bc9')
        .style('stroke','none');

    // Create a force-graph layout where we can add nodes and edges later.
    // NOTE: this is the API of d3 version 3.
    //       the force graph stuff looks very different in version 4.
    var force = d3.layout.force()
        .charge(-1000)
        .distance(200)
        .linkStrength(0.01)
        // higher positive value means easier repositionning
        //.friction(0.2)
        // higher value mean higher attraction to the center of the force layout
        .gravity(0.1)
        .size([width-50,height-50]);

    // This is called when the widget should be disposed
    this.remove = function() {
        svg.remove();
    }

    // get some parameters for sizing and positioning.
    this.updateGroups = function(data) {
        // - we make height depend on largest group
        // - the group gravity points need to be computed
        var groups = {};
        for(var i = 0; i < data.length; i++) {
            var nodeData = data[i].value1;
            var nodeGroup = nodeData[2];
            if(nodeGroup in groups) {
                groups[nodeGroup].push(nodeData[0]);
            }
            else {
                groups[nodeGroup] = [nodeData[0]];
            }
        }
        this.numGroups=Object.keys(groups).length;
        // compute max group size
        this.maxGroupSize=0;
        for(var key in groups) {
            if(groups[key].length > this.maxGroupSize) {
                this.maxGroupSize = groups[key].length;
            }
        }
    }

    // Compute gravity points for each group.
    // This is done so groups are separated from each other.
    // Evenly distribute groups horizontally.
    this.updateGravity = function() {
        // TODO: also support other distribution of groups (e.g. circular)
        // FIXME: this will break when group id's are not numbered from 1 to n
        //        - instead create a map from group id to x/y
        // FIXME: this is not entirely accurate for some reason.
        //         where is (0/0) in the SVG? But well it looks ok like this.
        //
        var div_w = options.where.width();
        var div_h = options.where.height();
        // the y-coordinate is simply the center
        var pos_y = 0.5*div_h;
        // the distance between groups
        var d_x = div_w/that.numGroups;
        // the offset of the first group
        var pos_x = 0.5*d_x;
        // finally compute center positions
        this.groupCenter = [];
        for(var i = 0; i < that.numGroups; i++) {
            this.groupCenter.push({x: pos_x, y: pos_y});
            pos_x += d_x;
        }
    }

    // This is called when new data was received
    this.update = function(data) {
        // size/position computation
        // TODO: update height based on group size
        that.updateGroups(data);
        that.updateGravity();

        // Parse data: get list of nodes and links
        var nodes=[];
        var links=[];
        for(var i = 0; i < data.length; i++) {
            var nodeData = data[i].value1;
            var group = parseInt(nodeData[2]);
            nodes.push({
                "name":nodeData[0],
                "iri":nodeData[1],
                "group":group,
                // init position and velocity of node.
                "x":that.groupCenter[group-1].x,
                "y":Math.random() * height,
                "vx":0,
                "vy":0
            });
            var nodeLinks = data[i].value2;
            for(var j = 0; j < nodeLinks.length; j++) {
                // NOTE: edge data is concatenated into one string "$type_$target",
                //       and parsed here.
                var edge_data = nodeLinks[j].split("_");
                links.push({
                    "source":i,
                    "target":parseInt(edge_data[1]),
                    "type":edge_data[0]
                });
            }
        }

        // Finally call force.nodes to set up the layout.
        var graph = {
            "nodes": nodes,
            "links": links
        };
        force.nodes(graph.nodes)
            .links(graph.links)
            .start();

        // set-up links
        var link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
            .style("stroke", "#2baeff")
            .attr("class", "link")
            .attr('marker-end','url(#arrowhead)');

        // set-up edge labels
        var edgepaths = svg.selectAll(".edgepath")
            .data(links)
            .enter().append('path')
            .attr('class', 'edgepath')
            .attr('fill-opacity', 0)
            .attr('stroke-opacity', 0)
            .attr('id', function (d, i) {return 'edgepath' + i})
            .style("pointer-events", "none");
        var edgelabels = svg.selectAll(".edgelabel")
            .data(links)
            .enter().append('text')
            .style("pointer-events", "none")
            .style("font-family", "Arial")
            .style("font-style", "italic")
            .style("font-weight", "bold")
            .attr('class', 'edgelabel')
            .attr('id', function (d, i) {return 'edgelabel' + i})
            .attr('font-size', 10)
            .attr('fill', '#000000');
        edgelabels.append('textPath')
            .attr('xlink:href', function (d, i) {return '#edgepath' + i})
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .attr("startOffset", "50%")
            .text(function (d) {return d.type});

        // set-up nodes
        var node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            //.call(drag)
            .call(force.drag);
        node.append("circle")
            .attr("r", 10)
            .style("fill", function (d) { return color(d.group); });
        node.append("text")
            .style("text-anchor", "middle")
            .style("font-family", "Arial")
            .attr("dy", 26)
            .attr("dx", 0)
            .text(function(d) { return d.name });
        node.append("title")
            .text(function (d) { return d.iri; });
        node.on("dblclick",function(d){ 
            commandline = ace.edit("user_query");
            commandline.setValue("A='"+d.iri +"'");
            page.console.query();
        });


        force.on("tick", function (e) {
            // pull nodes to their groups
            var k = .1 * e.alpha;
            graph.nodes.forEach(function(o, i) {
                o.y += (that.groupCenter[o.group-1].y - o.y) * k;
                o.x += (that.groupCenter[o.group-1].x - o.x) * k;
            });
            //
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            node.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            // handle edge labels
            edgepaths.attr('d', function (d) {
                return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
            });
            edgelabels.attr('transform', function (d) {
                if (d.target.x < d.source.x) {
                    var bbox = this.getBBox();
                    rx = bbox.x + bbox.width / 2;
                    ry = bbox.y + bbox.height / 2;
                    return 'rotate(180 ' + rx + ' ' + ry + ')';
                }
                else {
                    return 'rotate(0)';
                }
            });
        });
    }
}
