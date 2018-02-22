var ndx = crossfilter([]);
var allMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function addObs(p,v){
  p.total += 1;
  p.year = v.Year;
  p.qRep = v.qRep;
  p.month = v.Month;
  p.monthRep = v.monthRep;
  if(v.IsSurgical){ p.isSurgical += 1; }
  else {p.nonSurgical += 1;}
  return p;
}
function removeObs(p,v){
  p.total -= 1;
  if(v.IsSurgical){ p.isSurgical -= 1; }
  else {p.nonSurgical -= 1;}
  return p;
}
function instantiateObs(p,v){
  return {"total":0, "isSurgical":0, "nonSurgical":0};
}




$(document).ready(function(){
  $.ajax({
  method:"GET",
  url: "/search/allTerms"
  })
 .done(function(data){
    setAutocompleteBox(data);
 });
});
function getMainData(){
  console.log("Called getMainData");
}
function setAutocompleteBox(sentData){
  
  $(function(){
    $.widget( "custom.catcomplete", $.ui.autocomplete, {
      _create: function() {
        this._super();
        this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
      },
      _renderMenu: function( ul, items ) {
        var that = this,
          currentCategory = "";
        $.each( items, function( index, item ) {
          var li;
          if ( item.category != currentCategory ) {
            ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
            currentCategory = item.category;
          }
          li = that._renderItemData( ul, item );
          if ( item.category ) {
            li.attr( "aria-label", item.category + " : " + item.label );
          }
        });
      }
    });

    $( "#searchBox" ).catcomplete({
      minLength:1,
      delay: 0,
      source: function(request, response){
        var results = $.ui.autocomplete.filter(sentData, request.term);
        response(results.slice(0, 30));
      },

      select:function(event, ui){
        event.preventDefault();
        getData(ui.item);
        $("#searchBox").val(ui.item.label);

      },
      focus: function( event, ui ) {
        event.preventDefault();
        $("#searchBox").val(ui.item.label);
      }
    });
  });
  $("#searchBox").removeAttr("disabled");
}

function getData(sentData){
  var url = '/dashboard/search/' + String(sentData.value) + "/" + sentData.category;
  $.ajax({
    method:"GET",
    url: url
  })
 .done(function(data){
    console.log("Got data back");
    LoadDashboard(data);
 });
}

function LoadDashboard(sentData){
  //ndx.filterAll();
  ndx.remove();

  //First clean the data and get the dates organized
  //Here are the columns: 
  //colNames = ["ClinicDate", "IsDirect", "WasScreened", "ScreenDate", "IsSurgical", "AppScore", "ComplexityScore"]
  //colNames += ["ValueScore", "Location", "Name", "Diagnosis", "Referring_Doc", "Practice", "Insurance", "IsMedicaid"]
  var parseDate = d3.time.format("%a, %d %b %Y %X GMT").parse;
  let monthTickSet = new Set();
  let quarterTickSet = new Set();
  
  sentData.forEach(function(d){
    d.ClinicDate = parseDate(d.ClinicDate);
    d.Day = weekDays[d.ClinicDate.getDay()];
    d.Month = allMonths[d.ClinicDate.getMonth()];
    d.Year = d.ClinicDate.getFullYear();
    d.Quarter = (Math.floor(allMonths.indexOf(d.Month)/3) + 1);
    d.qRep = String(d.Year) + " Q" + String(d.Quarter);

    monthIndexString = String(allMonths.indexOf(d.Month) + 1);
    if(monthIndexString.length == 1){monthIndexString = "0" + monthIndexString;}
    d.monthRep = parseFloat(String(d.Year) +"."+ monthIndexString);

    monthTickSet.add(d.Month + " " + d.Year);
    quarterTickSet.add(d.qRep);
  });

  var monthTicks = Array.from(monthTickSet);
  var quarterTicks = Array.from(quarterTickSet).sort();

  quarterTicks = getAllQuartersFromStart(quarterTicks[0], quarterTicks[quarterTicks.length - 1]);
  monthTicks = getAllMonthsFromStart(monthTicks[monthTicks.length - 1], monthTicks[0]);

  ndx = crossfilter(sentData);
  
  dateDim = ndx.dimension(function(d){return d.ClinicDate;});
  //dayDim = ndx.dimension(function(d){return d.Day});
  //monthDim = ndx.dimension(function(d){return [d.Referring_Doc, d.monthRep];});
  quarterDim = ndx.dimension(function(d){return [d.qRep, d.Referring_Doc]});
  surgicalDim = ndx.dimension(function(d){return d.IsSurgical;});
  insuranceDim = ndx.dimension(function(d){return d.Insurance;});
  //docDim = ndx.dimension(function(d){return d.Referring_Doc;});
  //practiceDim = ndx.dimension(function(d){return d.Practice;});


  //monthGroup = monthDim.group().reduce(addObs, removeObs, instantiateObs).order(function(p){return -p.monthRep;});
  // monthGroup.all = function() {
  //   return monthGroup.top(Infinity);
  // }

  quarterGroup = quarterDim.group().reduce(addObs, removeObs, instantiateObs);
  surgicalGroup = surgicalDim.group().reduceCount();
  //insGroup = insuranceDim.group().reduce(addObs, removeObs, instantiateObs);
  insGroupSurgical = insuranceDim.group().reduceSum(function(d){if(d.IsSurgical){return 1;} else{return 0;}});
  insGroupNonSurgical = insuranceDim.group().reduceSum(function(d){if(d.IsSurgical){return 0;} else{return 1;}});
  
  //practiceGroup = practiceDim.group().reduce(addObs, removeObs, instantiateObs);
  //docGroup = docDim.group().reduce(addObs, removeObs, instantiateObs);

  //Timeline of patients by month and by quarter
  // monthGroup.order(function(p){return parseFloat(String(p.year) + "." + allMonths.indexOf(p.month));});
  //print_filter(monthGroup);
  // setTimeline("#monthlyTimeline", monthDim, monthGroup, monthTicks, "Months", "Num Cases", function(d){return d.value.month.slice(0,3) + " " + d.value.year;}, function(d){return d.value.total;}, function(d){return d.key[0];},true,true, function(d){return -d.monthRep;});
  setTimeline("#quarterlyTimeline", quarterDim, quarterGroup, quarterTicks, "Quarters", "Num Cases", function(d){return d.key[0];}, function(d){return d.value.total;}, function(d){return d.key[1];});
  //Percentage Surgical
  setPieChart("#percSurgical", surgicalDim, 0,200,surgicalGroup, "Number of cases");

  //Number of patients
  setCounter(dateDim);

  //Types of insurances
  //setPieChart("#percInsurance", insuranceDim, 0,200,insGroup, "Cases by Insurance Provider");
  setBarChart("#percInsurance", insuranceDim, 0,300,[{"data": insGroupSurgical, "name":"Surgical"}, {"data": insGroupNonSurgical, "name":"Non Surgical"}], "Insurance", "Number of patients");
  //(dom_id, sentDimension, width=0, height=400, allGroups, xTitle, yTitle){
  //Percentage is Medicaid
  //Percentage IsDirect
  //Percentage Screened
  //Percentage by location
  //Heatmap of complexity vs. appropriateness
  //Distribution by referring_doctor
  //Distribution by practice
}

function getAllMonthsFromStart(md1, md2){
  allMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  startParts = md1.split(" ");
  endParts = md2.split(" ");

  startMonth = allMonths.indexOf(startParts[0]);
  startYear = parseInt(startParts[1]);
  endMonth = allMonths.indexOf(endParts[0]);
  endYear = parseInt(endParts[1]);

  thisMonth = startMonth;
  thisYear = startYear;
  thisDate = md1;
  endDate = allMonths[endMonth].slice(0,3) + " " + String(endYear);
  startDate = allMonths[startMonth].slice(0,3) + " " + String(startYear);

  months = [startDate];
  while(thisDate != endDate){
    if(thisMonth >= (allMonths.length-1)){
      thisMonth = 0;
      thisYear += 1;
    }
    else{
      thisMonth += 1;
    }

    thisDate = allMonths[thisMonth].slice(0,3) + " " + String(thisYear);
    months.push(thisDate);
  }
  return months;

}

function getAllQuartersFromStart(rep1, rep2)
{
  parts1 = rep1.split(" Q");
  parts2 = rep2.split(" Q");

  startYear = parseInt(parts1[0]);
  endYear = parseInt(parts2[0]);

  startQ = parseInt(parts1[1]);
  endQ = parseInt(parts2[1]);

  quarters = [rep1];
  rep = rep1;
  yPart = startYear;
  qPart = startQ;
  while(rep != rep2){
    if(qPart >= 4){
      qPart = 1;
      yPart = yPart + 1;
    }
    else{
      qPart = qPart + 1;
    }
    rep = String(yPart) + " Q" + String(qPart);
    quarters.push(rep);
  }
  return quarters;
}
