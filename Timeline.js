/* The following code makes use of the Google Visualization API, Licensed under Creative Commons 3
More information can be found on https://developers.google.com/chart/
*/

// FIXME: google chart won't run offline,
//        plus it is difficult to include it as node module
//        and then browserify it.
//        Better switch to other lib for timeline chart.

module.exports = function(options){
  var that = this;

  options = options || {};
  var w = options.width - 100 || 200;
  var h = options.height - 100 || 200;
  var data = options.data || [];
  var fontsize = options.fontsize || "12px";
  this.where = options.where;
  this.label = options.label;

  var chart;
  var dataTable;
  this.remove = function() {
    chart.clearChart();
  }

  this.update = function(data) {
	  
      var google = window.google;
      chart = new google.visualization.Timeline(that.where[0]);
      dataTable = new google.visualization.DataTable();
      
      dataTable.addColumn({ type: 'string', id: 'Event' });
      dataTable.addColumn({ type: 'date', id: 'Start' });
      dataTable.addColumn({ type: 'date', id: 'End' });
      
      // create arrays of data
      // alert("creating data array!" + data[0]["value2"].length);
      var data_array = [];
      for(i=0; i<data["value1"].length;i++) //note: should check that value1 and value2 have the same size
      {
        var times = data["value2"][i].split("_"); //start and endtimes were concatenated with _
        var cur_array=[
            data["value1"][i],
            new Date(parseFloat(times[0])*1000 ),
            new Date(parseFloat(times[1])*1000 )
        ];
        data_array.push(cur_array);
      }
      dataTable.addRows(data_array);
      
      var view =  new google.visualization.DataView(dataTable);
      chart.draw(view);
  }
}
