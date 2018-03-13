var allData;
let quartersSet = new Set();
var quarters = [];
var ndx;
var colorMap = {};
var allColors = [];
var allNames = [];
$(document).ready(function(){
  $(".chooserButton").click(function(e){
    $(".chooserButton").removeClass("active");
    $(this).addClass("chooserButton");
    resetData($(this).val());
    

  });
});

function getMainData()
{
  $.ajax({
    method:"GET",
    url: "/dashboard/movement"
    })
   .done(function(data){
      setData(data);
   });
}

function resetData(flag){
  ndx.remove();
  ndx.add(allData[flag]);
  setupLegend();

  
  dc.redrawAll();
}
function setData(sentData)
{
  //allData = sentData;
  var practices = [];
  var refDocs = []
  sentData.forEach(function(d){
    //Make floats act like floats:
    
    d.qAvgPatients = parseFloat(d.qAvgPatients).toFixed(2);
    d.qAvgSurgical = parseFloat(d.qAvgSurgical).toFixed(2);
    //d.qRep = parseFloat(String(d.ThisYear) + "." + String(d.ThisQuarter)).toFixed(2);
    d.qRep = String(d.ThisYear) + " Q" + String(d.ThisQuarter);
    quartersSet.add(d.qRep);
    //Calc perc changes:
    if(d.LastQuarter == null){
      d.LastQuarter = 0;
      d.LastYear = 0;
      d.LastPatients = 0;
      d.LastSurgical = 0;
      d.percChangeSurgical = 0.0;
      d.percChangeTotal = 0.0;
    }
    else{
      if (d.LastPatients == 0){
        d.percChangeTotal = ((d.NumPatients - d.qAvgPatients)/d.qAvgPatients).toFixed(2);
      }
      else{
        d.percChangeTotal = (parseFloat(d.NumPatients - d.LastPatients)/d.LastPatients).toFixed(2);
      }

      if (d.LastSurgical == 0){
        d.percChangeSurgical = ((d.NumSurgical - d.qAvgSurgical)/d.qAvgSurgical).toFixed(2);
      }
      else{
        d.percChangeSurgical = (parseFloat(d.NumSurgical - d.LastSurgical)/d.LastSurgical).toFixed(2);
      }
    }

    if(d.Type == "Practice"){
      practices.push(d);
    }
    else{
      refDocs.push(d)
    }
  });

  quarters = Array.from(quartersSet).sort();
  allData = {"Practice":practices, "RefDoc":refDocs};
  ndx = crossfilter(allData['Practice']);

  setupLegend();
  setupSeriesChart();
}
function setupLegend()
{
  allColors = [];
  allNames = [];
  var quarterDim = ndx.dimension(function(d){return d.qRep;});
  biggestQ = quarterDim.top(1)[0];
  var nameDim = ndx.dimension(function(d){return d.Name;});

  var nameGroupFeed = nameDim.group().reduceSum(function(d){return d.NumPatients;});
  let nameArr = nameGroupFeed.top(Infinity);
  let upperName = nameArr[0]["value"];
  let lowerName = nameArr[nameArr.length-1]["value"];

  nameArr.forEach(function(item, index){
    color = getColorMap(item["value"], lowerName, upperName);
    //colorMap[item["key"]] = color;
    allColors.push(color);
    allNames.push(item["key"]);
  });
}
function setupSeriesChart(){
  var allTypesDim = ndx.dimension(function(d){return [d.Name, d.qRep];});
  typeGroup = getAggOnQuarterData(allTypesDim);

  setSeriesChart("#PracticePC", allTypesDim, typeGroup, "", "", "percChangeTotal", "Quarters", "Percent Change", quarters);
  //setPieChart("#PracticePC", allTypesDim, width=0, height=400, typeGroup, "Percent Change");
}

function getAggOnQuarterData(sentDim){
    var practicesGroup = sentDim.group().reduce(
    function(p,v){
      p.name = v.name;
      p.quarter = v.qRep;
      p.numSurgical = v.NumSurgical;
      p.numPatients = v.NumPatients;
      p.percChangeTotal = v.percChangeTotal;
      p.percChangeSurgical = v.percChangeSurgical;
      p.qAvgPatients = v.qAvgPatients;
      p.qAvgSurgical = v.qAvgSurgical;
      //p.color = colorMap[v.Name];

      return p;
    },
    function(p,v){
      p = {"name":"", "quarter":"2015 Q3","numSurgical":0,"numPatients":0,"percChangeTotal":0.0, "percChangeSurgical":0.0, "qAvgSurgical":0.0, "qAvgPatients":0.0};
      return p;
    },
    function(){
      return {"name":"", "quarter":"2015 Q3","numSurgical":0,"numPatients":0,"percChangeTotal":0.0, "percChangeSurgical":0.0, "qAvgSurgical":0.0, "qAvgPatients":0.0};
    }
  );

  return practicesGroup;
}
// colNames = ["Type", "Name", "ThisYear", "ThisQuarter", "NumPatients", "NumSurgical", "LastYear", "LastQuarter"]
// colName += ["LastPatients", "LastSurgical", "qAvgPatients", "qAvgSurgical"]

