
var d3 = require('d3');

module.exports = function(options){
  options = options || {};
  var w = options.width - 100 || 200;
  var h = options.height - 100 || 200;
  var data = options.data || [];
  var where = options.where;
  var fontsize = options.fontsize || "14px";

  var color = d3.scale.category20();

  var force = d3.layout.force()
    .charge(-120)
    .linkDistance(20)
    .gravity(0.9)
    .size([w,h]);

  var svg = d3.select(where[0]).append("svg")
    .attr("width", w)
    .attr("height", h);
  svg.append("svg:rect")
    .attr("width", "100%")
    .attr("height", "100%")
    //.attr("stroke", "#000")
    .attr("fill", "none");

  this.remove = function() {
    svg.remove();
  }

  this.update = function(data) {
      var nodes=[];
      var links=[];
      for(var i = 0; i < data.length; i++) {
          var nodeData = data[i].value1;
          nodes.push({
              "name":nodeData[0],
              "group":parseInt(nodeData[2])
          });

          var nodeLinks = data[i].value2;
          for(var j = 0; j < nodeLinks.length; j++) {
              links.push({
                  "source":i,
                  "target":parseInt(nodeLinks[j])
              });
          }
      }
      var graph = {
          "nodes": nodes,
          "links": links
      };
      console.info(graph);
      force.nodes(graph.nodes)
          .links(graph.links)
          .start();

      var link = svg.selectAll(".link")
          .data(graph.links)
          .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function (d) {
              return Math.sqrt(d.value);
          });
      var node = svg.selectAll(".node")
          .data(graph.nodes)
          .enter().append("circle")
          .attr("class", "node")
          .attr("r", 5)
          .style("fill", function (d) {
              return color(d.group);
          })
          .call(force.drag);
      node.append("title")
          .text(function (d) {
              return d.name;
          });

      force.on("tick", function () {
        link.attr("x1", function (d) {
            return d.source.x;
        }).attr("y1", function (d) {
            return d.source.y;
        }).attr("x2", function (d) {
            return d.target.x;
        }).attr("y2", function (d) {
            return d.target.y;
        });
        node.attr("cx", function (d) {
            return d.x;
        }).attr("cy", function (d) {
            return d.y;
        });
      });
  }
}
