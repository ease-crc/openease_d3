
var d3 = require('d3');

module.exports = function(options){
    var that = this;
    options = options || {};
    var width = options.width || 200;
    var height = options.height || 400;
    var data = options.data || [];
    var where = options.where;
    var fontsize = options.fontsize || "14px";
    var color = d3.scale.category20();
    var force = d3.layout.force()
        .charge(-1000)
        .distance(200)
        .linkStrength(0.01)
        // higher positive value means easier repositionning
        //.friction(0.2)
        // higher value mean higher attraction to the center of the force layout
        .gravity(0.1)
        .size([width-50,height-50]);
    var svg = d3.select(where[0])
        .append("svg")
        .attr("class", "chart")
        .attr("width", "100%")
        .attr("height", height);

    // appending little triangles, path object, as arrowhead
    // The <defs> element is used to store graphical objects that will be used at a later time
    // The <marker> element defines the graphic that is to be used for drawing
    // arrowheads or polymarkers on a given <path>, <line>, <polyline> or <polygon> element.
    svg.append('defs').append('marker')
        .attr("id",'arrowhead')
        .attr('viewBox','-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
        .attr('refX',19) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
        .attr('refY',0)
        .attr('orient','auto')
        .attr('markerWidth',5)
        .attr('markerHeight',5)
        .attr('xoverflow','visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#008bc9')
        .style('stroke','none');

    this.remove = function() {
        svg.remove();
    }

    this.update = function(data) {
        var nodes=[];
        var links=[];

        // FIXME:
        var foci = [
            {x: 100, y: 100},
            {x: 300, y: 100},
            {x: 500, y: 100},
            {x: 700, y: 100}
        ];

        for(var i = 0; i < data.length; i++) {
            var nodeData = data[i].value1;
            var group = parseInt(nodeData[2]);
            nodes.push({
                "name":nodeData[0],
                "iri":nodeData[1],
                "cx":foci[group-1].x,
                "group":group
            });
            var nodeLinks = data[i].value2;
            for(var j = 0; j < nodeLinks.length; j++) {
                var edge_data = nodeLinks[j].split("_");
                links.push({
                    "source":i,
                    "target":parseInt(edge_data[1]),
                    "type":edge_data[0]
                });
            }
        }
        var graph = {
            "nodes": nodes,
            "links": links
        };
        force.nodes(graph.nodes)
            .links(graph.links)
            .start();

        var link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
            .style("stroke", "#2baeff")
            .attr("class", "link")
            //.style("stroke-width", function (d) { return Math.sqrt(d.value); })
            .attr('marker-end','url(#arrowhead)');
        // The <title> element provides an accessible, short-text description of any SVG
        // container element or graphics element.
        // Text in a <title> element is not rendered as part of the graphic,
        // but browsers usually display it as a tooltip.
        link.append("title")
            .text(function (d) {return d.type;});

        // edge labels
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

        /*
        var drag = force.drag()
            .on('dragstart', function(d) { that.dragstarted(d); })
            .on('dragend', function() { that.dragged(); });

         */
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

        force.on("tick", function (e) {

            var k = .1 * e.alpha;
            graph.nodes.forEach(function(o, i) {
                o.y += (foci[o.group-1].y - o.y) * k;
                o.x += (foci[o.group-1].x - o.x) * k;
            });

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

    // When the drag gesture starts, the targeted node is fixed to the pointer
    // The simulation is temporarily “heated” during interaction by setting the target alpha to a non-zero value.
    this.dragstarted = function(d) {
        if (!d3.event.active) {
            // sets the current target alpha to the specified number in the range [0,1].
            force.alpha(0.3);
        }
        d.fy = d.y;
        d.fx = d.x;
    }

    // When the drag gesture starts, the targeted node is fixed to the pointer
    this.dragged = function(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
}
