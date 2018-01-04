$(document).ready(function(){ getMainData();});

function rgbToHex(rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
}

function getColorMap(val, lowerbound, upperbound)
{
  var r = 0;

  r = 255 * ((val - lowerbound)/(upperbound - lowerbound));
  red = rgbToHex(r);
  rgb = "#" + red + "20FF";
  console.log(r);
  console.log(rgb);
  return rgb;
}

function setHeatmap(dom_id, sentDimension,sentGroup, x_label, x_index, y_label, y_index, lowerbound, upperbound)
{
  var width = $(dom_id).parent().innerWidth();
  var chart = dc.heatMap(dom_id);
  //var chart = dc.compositeChart(dom_id);

  chart
    .width(width)
    .height(400)
    .colsLabel(function(d) { return x_label.substr(0,4) + " " + d; })
    .rowsLabel(function(d) { return y_label.substr(0,4) + " " + d; })
    //.yAxisLabel(y_label)
    //.xAxisLabel(x_label)
    //.brushOn(false)
    //.shareTitle(false)
    .dimension(sentDimension)
    .group(sentGroup)
    .keyAccessor(function(d) { return +d.key[x_index]; })
    .valueAccessor(function(d) { return +d.key[y_index]; })
    .colorAccessor(function(d) { return +d.value; })
    .title(function(d) {
      return x_label + ": " + d.key[0] + "\n" +
        y_label + ": " + d.key[1] + "\n" +
        "Num Patients: " + String(d.value);})
    .linearColors(["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"])
    // .calculateColorDomain();
    .on("preRender", function(chart) {
      chart.colorDomain(d3.extent(chart.data(), chart.colorAccessor()));
    })
    .on("preRedraw", function(chart) {
      chart.colorDomain(d3.extent(chart.data(), chart.colorAccessor()));
    });

  chart.render();
}

function setScatterChart(dom_id, sentDimension, sentGroup, x_prop, y_prop, xTitle, yTitle, max_x)
{
  var data45 = getLineYisXData(0, max_x);
  var ndx = crossfilter(data45);
  var lineDim = ndx.dimension(function(d){return d.x;});
  var lineGroup = lineDim.group().reduceSum(function(d){return d.y;});

  var chart = dc.compositeChart(dom_id);
  //var chart = dc.scatterPlot(dom_id);
  var width = $(dom_id).parent().innerWidth();
  //print_filter(sentGroup);

  chart
    .width(width)
    .height(400)
    .x(d3.scale.linear().domain([0,max_x]))
    .clipPadding(10)
    .yAxisLabel(yTitle)
    .xAxisLabel(xTitle)
    .brushOn(false)
    .shareTitle(false)
    .compose([
        dc.scatterPlot(chart)
          .dimension(sentDimension)
          .group(sentGroup)
          .symbolSize(8)
          .keyAccessor(function(p) {return p.value[x_prop];})
          .valueAccessor(function(p) {return p.value[y_prop];})
          .renderTitle(true)
          .title(function (p) {
            return [
              'Referrer: ' + p.key,
              'Surgical: ' + String(p.value[y_prop]),
              'Non Surgical: ' + String(p.value[x_prop]),
              'Distance: ' + String((p.value[y_prop]-p.value[x_prop])/Math.sqrt(2))
            ].join('\n');
          }),
        dc.lineChart(chart)
          .dimension(lineDim)
          .group(lineGroup)
          .renderTitle(false)

      ]);
    
  chart.render();

}
function setBarChart(dom_id, sentDimension, width=0, height=400, allGroups, xTitle, yTitle){
  console.log(dom_id);
  console.log(sentDimension.top(Infinity).length);
  console.log(allGroups[0].data.size());
  if(width == 0){
    width = $(dom_id).parent().innerWidth();
  }

  var hitslineChart  = dc.barChart(dom_id);
  hitslineChart
    .width(width).height(height)
    .dimension(sentDimension)
    .group(allGroups[0].data,allGroups[0].name)
    .ordering(function(d) {return -d.value });
  
  counter = 0;
  allGroups.forEach(function(d){
    if(counter > 0){
      hitslineChart.stack(d.data, d.name);
    }
    counter = counter + 1;
  });

  //console.log(minMax);
  hitslineChart
    .xUnits(dc.units.ordinal)
    .x(d3.scale.ordinal())
    .legend(dc.legend().x(100).y(10).itemHeight(13).gap(5))
    .yAxisLabel(yTitle)
    .xAxisLabel(xTitle);

  hitslineChart.renderlet(function(chart){
  hitslineChart.selectAll("g.x text")
    .style("text-anchor", "unset")
    .style("fill", "#fff")
    .attr('transform', "translate(-12,-5) rotate(-90)");
  }); //SWaMiBo

  dc.renderAll();

  // setCounter("#totalNumber", sentDimension, allGroups[0].data);
}

function setBarChartChooser(dom_id, sentDimension, width=0, height=400, allGroups, minMax=[], yTitle){
  setCounter(sentDimension);

  if(width == 0){
    width = $(dom_id).parent().innerWidth();
  }
  var hitslineChart  = dc.barChart(dom_id);
  hitslineChart
    .width(width).height(height)
    .dimension(sentDimension)
    .group(allGroups[0].data,allGroups[0].name);
  
  counter = 0;
  allGroups.forEach(function(d){
    if(counter > 0){
      hitslineChart.stack(d.data, d.name);
    }
    counter = counter + 1;
  });

  hitslineChart
    .x(d3.time.scale().domain(minMax))
    // .legend(dc.legend().x(50).y(0).itemHeight(13).gap(5).horizontal(true))
    .yAxis().ticks(0);

  hitslineChart.on("filtered", function(){
    setCounter(sentDimension);
  });

  dc.renderAll();

  // setCounter("#totalNumber", sentDimension, allGroups[0].data);
}




function setPieChart(dom_id, sentDimension, width=0, height=400, allGroups, yTitle){
  
  if(width == 0){
    width = $(dom_id).parent().innerWidth();
  }
  var chart = dc.pieChart(dom_id);

  chart
    .width(width)
    .height(height)
    .slicesCap(4)
    .innerRadius(0)
    .dimension(sentDimension)
    .group(allGroups)
    // .legend(dc.legend())
    // workaround for #703: not enough data is accessible through .label() to display percentages
    .on('pretransition', function(chart) {
        chart.selectAll('text.pie-slice')
          .text('')
          .append('tspan')
            .text(function(d){
              if(d.data.key){
                return "Surgical"
              }
              else{
                return "Non Surgical"
              }
            })
          .append('tspan')
            
            .attr('dy',18)
            .attr('x',0)
            .text(function(d){return dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%'});

          // .text(function(d) {
          //   if(d.data.key){
          //     var name = "Surgical"
          //   }
          //   else{
          //     var name = "Non Surgical"
          //   }
          //   this.append('tspan').text(name);
          //   this.append('tspan').text(dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%');
            // return name + '\r\n' + dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
        //})
    });
  chart.render();
}

function setCounter(sentDimension){
  var totalNumber = sentDimension.top(Infinity).length;
  $('#totalNumber').html(totalNumber);
}

function getLineYisXData(lowerbound, upperbound){
  var newArray = [{'x':lowerbound, 'y':lowerbound}, {'x':upperbound, 'y':upperbound}];
  return newArray;
}


function getLineYisXDataLots(lowerbound, upperbound){
  var newArray = [];
  for(var i=lowerbound; i<=upperbound; i+=1)
  {
    newArray.push({'x':i, 'y':i});
  }
  return newArray;
}