
var BarChart    = require("./BarChart.js");
var DonutChart  = require("./DonutChart.js");
var Timeline    = require("./Timeline.js");
var TreeDiagram = require("./TreeDiagram.js");
var GraphDiagram = require("./GraphDiagram.js");

var ROSLIB = require('roslib');

module.exports = function(container, message, blackboard) {
    var that = this;

    this.chart_obj = undefined;
    this.options = {
        data: message.values[0],
        where: container,
        label: message.title,
        width: message.width,
        height: message.height,
        onselect: function(entity_iri,entity_type) {
            blackboard.select(message.title,
                entity_iri, entity_type);
        }
    };
    
    // Pie chart
    if(message.type == 0) {
        this.chart_obj = new DonutChart(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values);
    }
    // Bar chart
    else if(message.type == 1) {
        this.chart_obj = new BarChart(that.options);
        this.chart_obj.label = message.title;
        this.chart_obj.update(message.values);
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
