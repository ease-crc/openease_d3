/* The following code makes use of the Google Visualization API, Licensed under Creative Commons 3
More information can be found on https://developers.google.com/chart/
*/

// FIXME: google chart won't run offline,
//        plus it is difficult to include it as node module
//        and then browserify it.

module.exports = function(options){
    var that = this;
    options = options || {};
    this.where = options.where;
    this.label = options.label;
    this.height = 200;
    this.table_height = 200;
    this.dateRangeStart = undefined;
    this.dateRangeEnd = undefined;
    this.markerLine = undefined;
    this.markerLabel = undefined;

    var google = window.google;
    var chart = new google.visualization.Timeline(that.where[0]);

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Event' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });

    var view;
    var formatDate = new google.visualization.DateFormat({pattern: 'mm:ss'});

    //redraw graph on window resize
    $(window).on('resize', function() {
        that.draw();
    });

    this.draw = function() {
        chart.draw(view, {
            height: that.height,
            hAxis: {
                title: 'Time',
                format: 'mm:ss'
            },
            timeline: {
                rowLabelStyle: { fontName: 'Helvetica', fontSize: 10 },
                barLabelStyle: { fontName: 'Helvetica', fontSize: 10 }
            }
        });
        that.markerLine = undefined;
        that.markerLabel = undefined;
    }

    this.remove = function() {
        chart.clearChart();
    }

    this.update = function(data) {
        var data_array = [];
        for(i=0; i<data["value1"].length;i++) {
            var times = data["value2"][i].split("_");
            var cur_array=[
                data["value1"][i],
                new Date(parseFloat(times[0])*1000 ),
                new Date(parseFloat(times[1])*1000 )
            ];
            data_array.push(cur_array);
        }
        dataTable.addRows(data_array);
        //
        that.dateRangeStart = dataTable.getColumnRange(1);
        that.dateRangeEnd = dataTable.getColumnRange(2);
        // sort by start and end dates
        dataTable.sort([{column: 1}, {column: 2}]);

        // estimate height and draw
        that.height = dataTable.getNumberOfRows() * 35 + 35;
        view =  new google.visualization.DataView(dataTable);
        that.draw();
        // compute height and redraw
        that.computeHeight();
        that.draw();
    }

    this.computeHeight = function() {
        var container = that.where[0];
        var svg = container.getElementsByTagName('svg')[0];
        var rects = svg.getElementsByTagName('rect');
        var maxRectHeight = 10;
        for(var i=0; i < rects.length; i++) {
            if(rects[i].getAttribute) {
                var rect_height = parseFloat(rects[i].getAttribute('height'));
                if(rect_height>maxRectHeight) {
                    maxRectHeight = rect_height;
                }
            }
        }
        that.table_height = maxRectHeight;
        that.height = maxRectHeight + 60;
    }

    this.tick = function(time) {
        var markerDate = new Date(time*1000.0);
        var container = that.where[0];
        var svg = container.getElementsByTagName('svg')[0];
        var timeline = container.getElementsByTagName('rect')[0];
        var baseline = container.getElementsByTagName('path')[0];
        // calculate placement
        var timelineWidth = parseFloat(timeline.getAttribute('width'));
        var baselineBounds = baseline.getBBox();
        var timespan = that.dateRangeEnd.max.getTime() - that.dateRangeStart.min.getTime();
        var timelineUnit = (timelineWidth - baselineBounds.x) / timespan;
        var markerSpan = markerDate.getTime() - that.dateRangeStart.min.getTime();
        // add label
        /*
        if(that.markerLabel == undefined) {
            that.markerLabel = container.getElementsByTagName('text')[0].cloneNode(true);
            that.markerLabel.setAttribute('fill', '#44c1ff');
            svg.appendChild(that.markerLabel);
        }
        that.markerLabel.setAttribute('y', that.height);
        that.markerLabel.setAttribute('x', (baselineBounds.x + (timelineUnit * markerSpan) - 4));
        that.markerLabel.textContent = formatDate.formatValue(markerDate);
        */
        // add line
        if(that.markerLine == undefined) {
            that.markerLine = timeline.cloneNode(true);
            that.markerLine.setAttribute('y', 0);
            that.markerLine.setAttribute('width', 3);
            that.markerLine.setAttribute('stroke', 'none');
            that.markerLine.setAttribute('stroke-width', '0');
            that.markerLine.setAttribute('fill', '#2d5d84');
            svg.appendChild(that.markerLine);
        }
        that.markerLine.setAttribute('x', (baselineBounds.x + (timelineUnit * markerSpan)));
        that.markerLine.setAttribute('height', that.table_height);
    }
}
