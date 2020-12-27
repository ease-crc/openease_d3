
var d3 = require('d3');

module.exports = function(options){
    options = options || {};

    var that = this;
    var where = options.where;
    var duration = 750;
    var node_id = 0;

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

    this.getMaxBranching_ = function(node,level,acc_max) {
        if(!acc_max[level]) {
            acc_max[level] = 0;
        }
        acc_max[level] += node.children.length;
        for(var i=0; i<node.children.length; i++) {
            that.getMaxBranching_(node.children[i],level+1,acc_max);
        }
    }

    this.getMaxBranching = function(root) {
        var succ_map={};
        var succ_max=0;
        that.getMaxBranching_(root,0,succ_map);
        for(var index in succ_map) {
            succ_max = Math.max(succ_max, succ_map[index]);
        }
        return succ_max;
    }

    this.update = function(data) {
        that.root = that.getTreeData(data,0);
        that.maxBranching = that.getMaxBranching(that.root);
        that.update_1(that.root);
    }

    this.update_1 = function(source) {
        // HACK compute height based on max branching in one level of the tree
        var treeHeight = that.maxBranching*25.0 + 100.0;
        var treeWidth = where.width();
        var tree = d3.layout.tree().size([treeHeight,treeWidth]);

        where.height(treeHeight);

        source.x0 = treeHeight / 2;
        source.y0 = 0;

        // Compute the new tree layout.
        var nodes = tree.nodes(that.root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 180; });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++node_id); });

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
