
var d3 = require('d3');

module.exports = function(options){
  options = options || {};
  var w = options.width - 100 || 200;
  var h = options.height - 100 || 200;
  var bar_height = 20;
  var where = options.where;
  var fontsize = options.fontsize || "14px";
  var label = options.label;
  var color = d3.scale.category20();

  // setup the svg
  var svg = d3.select(where[0])
      .append("svg:svg")
      .attr("width", w+100)
      .attr("height", h+100);
  svg.append("svg:rect")
      .attr("width", "100%")
      .attr("height", "100%")
      //.attr("stroke", "#000")
      .attr("fill", "none");
  var vis = svg.append("svg:g")
      //.attr("id", "barchart")
      .attr("transform", "translate(50,10)");

  this.remove = function() {
    svg.remove();
  }

  this.update = function(data_vis) {
    //
    var data = [];
    for(var i=0; i<data_vis.value2.length; ++i) {
      data.push({
        key: data_vis.value1[i],
        value: data_vis.value2[i]
      })
    }
    data.sort(function(a, b) {
      return b.value - a.value;
    });
    var data_keys = data.map(function(d) { return d.key; });
    var data_values = data.map(function(d) { return d.value; });
    // get the maximum value
    var max = d3.max(data_vis.value2, function(d) {return parseInt(d)});
    // get sum of all values
    var sum = data_vis.value2.reduce(function(a,b) { return parseInt(a) + parseInt(b) });
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
    // http://www.jeromecukier.net/blog/2011/08/09/d3-adding-stuff-and-oh-understanding-selections/
    var bars = vis.selectAll("rect.bar")
        .data(data_values);
    // update
    bars.attr("fill", function(d, i) { return color(i); });
        //.attr("stroke", "black")//#050");
        //.attr("stroke-width", 0.1);
    // enter
    bars.enter()
        .append("svg:rect")
        .attr("class", "bar")
        //.attr("stroke", "#050") // #800
        .attr("fill", function(d, i) { return color(i); });
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
        .data(data_keys)
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
