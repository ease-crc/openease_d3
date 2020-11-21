
var d3 = require('d3');

module.exports = function(options){
    options = options || {};
    var that = this;
    var where = options.where;
    var w = options.width - 25 || 200;
    var h = options.height - 25 || 200;
    var duration = 750;

    var tree = d3.layout.tree()
        .size([h,w]);
    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var svg = d3.select(where[0])
        .append("svg")
        .attr("class", "chart")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.behavior.zoom().on("zoom", function () {
            svg.attr("transform",
                "translate(" + d3.event.translate + ") " +
                "scale(" + d3.event.scale + ")");
        }))
        .append("g")
        .attr("transform", "translate(150,-10)");

    this.root = undefined;

    this.remove = function() {
        svg.remove();
    }

    this.getTreeData = function(data,index) {
        // TODO: create an IRI link
        var nodeData = data[index].value1;
        var nodeLinks = data[index].value2;
        var children = [];
        for(var i = 0; i < nodeLinks.length; i++) {
            children.push(that.getTreeData(data,parseInt(nodeLinks[i])));
        }
        return {
            "name": nodeData[0],
            "children": children
        };
    }

    this.update = function(data) {
        that.root = that.getTreeData(data,0);
        that.root.x0 = h / 2;
        that.root.y0 = 0;
        that.update_1(that.root);
    }

    this.update_1 = function(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(that.root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 180; });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", that.click);

        // Add Circle for the nodes
        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        // Add labels for the nodes
        nodeEnter.append("text")
            .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1e-6);

        ////////////////////
        // UPDATE
        ////////////////////

        // Transition to the proper position for the node
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        // Update the node attributes and style
        nodeUpdate.select("circle")
            .attr("r", 7)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select("circle")
            .attr("r", 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        ////////////////////
        // LINKS
        ////////////////////

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    this.click = function(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        that.update_1(d);
    }
}
