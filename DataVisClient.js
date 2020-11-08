
var BarChart    = require("./BarChart.js");
var DonutChart  = require("./DonutChart.js");
var Timeline    = require("./Timeline.js");
var TreeDiagram = require("./TreeDiagram.js");
var GraphDiagram = require("./GraphDiagram.js");

var ROSLIB = require('roslib');

module.exports = function(container, message) {
    var that = this;
    
    this.options = {
        data: message.values[0],
        where: container,
        label: message.title,
        width: message.width,
        height: message.height,
        radius: (message.height-120)/2,//height*3/10,
        innerRadius: (message.height-120)/2*4/9,
        fontsize: message.fontsize//"14px"
    };
    this.chart_obj = undefined;
    
    // Pie chart
    if(message.type == 0) {
        this.chart_obj = new DonutChart(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values[0]);
    }
    // Bar chart
    else if(message.type == 1) {
        this.chart_obj = new BarChart(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values[0]);
    }
    // Tree diagram
    else if(message.type == 2) {
        this.chart_obj = new TreeDiagram(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values);
    }
    // Timeline (Gantt style)
    else if(message.type == 3) {
        this.chart_obj = new Timeline(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values[0]);
    }
    // GraphDiagram
    else if(message.type == 999) {
        this.chart_obj = new GraphDiagram(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values);
    }
}
