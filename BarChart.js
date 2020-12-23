
var d3 = require('d3');

module.exports = function(options){
  options = options || {};
  var w = options.width - 100 || 200;
  var h = options.height - 100 || 200;
  var bar_height = 20;
  var where = options.where;
  var fontsize = options.fontsize || "14px";
  var color = d3.scale.category20();

  // setup the svg
  var svg = d3.select(where[0])
      .append("svg:svg")
      .attr("width", w+100)
      .attr("height", h+100);
  svg.append("svg:rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "none");
  var vis = svg.append("svg:g")
      .attr("transform", "translate(50,10)");

  this.remove = function() {
    svg.remove();
  }

  this.update = function(data_vis) {
    //
    var data = [];
    for(var i=0; i<data_vis.length; ++i) {
        var data_i = data_vis[i];
        data.push({
            value: data_i.value2[0],
            key: data_i.value1[0],
            entity_iri: data_i.value1[1],
            entity_type: data_i.value1[2]
        })
    }
    data.sort(function(a, b) {
      return b.value - a.value;
    });
    var data_keys = data.map(function(d) { return d.key; });
    var data_values = data.map(function(d) { return d.value; });
    // get the maximum value
    var max = d3.max(data, function(d) {
        return parseInt(d.value);
    });
    // get sum of all values
    var sum = data.reduce(function(a,b) {
        if (typeof a === 'number') {
            return a + parseInt(b.value);
        }
        else {
            return parseInt(a.value) + parseInt(b.value);
        }
    });
    //
    var x = d3.scale.linear()
        .domain([0, max])
        .range([0, w]);
    var y = d3.scale.ordinal()
        .domain(d3.range(data_keys.length))
        .rangeBands([0,data_keys.length*bar_height], .2);
    //
    svg.attr("height", y(data_keys.length-1) + 40);

    // Add bars to SVG.
    var selected = undefined;
    // http://www.jeromecukier.net/blog/2011/08/09/d3-adding-stuff-and-oh-understanding-selections/
    var bars = vis.selectAll("rect.bar")
        .data(data_values);
    bars.attr("fill", function(d, i) { return color(i); });
    // enter
    bars.enter()
        .append("svg:rect")
        .attr("class", "bar")
        .attr("stroke", "#050")
        .attr('stroke-width', '3')
        .attr("fill", function(d, i) { return color(i); })
        .on("click", function(d,i) {
            if (d3.event.defaultPrevented) return;
            // assign 'selected' CSS class to selected node
            if(selected) {
                d3.select(selected).classed("selected", d.selected = false);
            }
            d3.select(this).classed("selected", d.selected = true);
            selected = this;
            // notify blackboard about selection
            options.blackboard.select(options.label,
                data[i].entity_iri,
                data[i].entity_type);
        });
    // exit
    bars.exit()
        .transition()
        .duration(300)
        .ease("exp")
        .attr("width", 0)
        .remove();
    bars.attr("stroke-width", 4)
        .transition()
        .duration(300)
        .ease("quad")
        .attr("width", x)
        .attr("height", y.rangeBand())
        .attr("transform", function(d,i) {
          return "translate(" + [0, y(i)] + ")"
        });

    // Add labels to SVG
    var text = vis.selectAll("text.value")
        .data(data)
        .attr("x", 5) //x
        .attr("y", function(d,i){
          return y(i) + y.rangeBand()/2;
        } );
    text.enter()
        .append("text")
        .attr("class", "value")
        .attr("x", 5)//x)
        .attr("y", function(d,i){
          return y(i) + y.rangeBand()/2;
        } )
        .attr("dy", ".36em")
        .attr("text-anchor", "start")
        .style("font-size", fontsize);
    text.text(function(d,i) {
      return data_keys[i];
    });
    text.exit().remove();

    // Add percentage labels left of bars
    var percent = vis.selectAll("text.percent")
        .data(data_values)
        .attr("x", 0)
        .attr("y", function(d,i){ return y(i) + y.rangeBand()/2; } );
    percent.enter()
        .append("text")
        .attr("class", "percent")
        .attr("x", 0)
        .attr("y", function(d,i){ return y(i) + y.rangeBand()/2; } )
        .attr("dx", -5)
        .attr("dy", ".36em")
        .attr("text-anchor", "end")
        .style("font-size", fontsize);
    percent.text(function(d,i) {
      return (100*parseInt(data_values[i])/sum).toFixed(1) + "%";
    });
    percent.exit().remove();

    // Add bottom label
    /*
    var total = vis.selectAll("text.total")
        .data([sum]);
    total.enter()
        .append("text")
        .attr("class", "total")
        .attr("x", 5)//x)
        .attr("y", h+40)
        //.attr("dx", -5)
        .attr("dy", 0)//".36em")
        .attr("text-anchor", "start")
        .style("font-size", fontsize);
    total.text(label + " (total: " + sum + ")");
    total.exit().remove();
     */
  }
}
