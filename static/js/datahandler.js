function getMainData()
{
  $.ajax({
    method:"GET",
    url: "/dashboard/patients"
    })
   .done(function(data){
      setupCrossFilter(data);
   });
}

function setupCrossFilter(data){
  var ndx = crossfilter(data);

  //clean up the dates in crossfilter:
  var parseDate = d3.time.format("%a, %d %b %Y %X GMT").parse;

  data.forEach(function(d){
    d.ClinicDate = parseDate(d.ClinicDate);
  });

  //Set up a dimension on each column in the crossfilter
  var clinicDateDim = ndx.dimension(function(d){return d.ClinicDate; });
  var isSurgicalDim = ndx.dimension(function(d){return d.IsSurgical; });
  var appCompScoreDim = ndx.dimension(function(d){return [d.AppScore, d.ComplexityScore];})
  var referringDoctorDim = ndx.dimension(function(d){return d.Referring_Doc; });
  var practiceDim = ndx.dimension(function(d){return d.Practice;});

  var clinicDateSurgGroup = clinicDateDim.group().reduceSum(function(d){
    if(d.IsSurgical == false){return 0;}
    else {return 1;} });
  var clinicDateNonSurgGroup = clinicDateDim.group().reduceSum(function(d){
    if(d.IsSurgical == false){return 1;}
    else {return 0;} });

  var isSurgicalGroup = isSurgicalDim.group().reduceCount();

  var practiceSurgGroup = practiceDim.group().reduceSum(function(d){
    if((d.Practice == null) || (d.IsSurgical == false)){return 0;}
    else {return 1;} });
  var practiceNonSurgGroup = practiceDim.group().reduceSum(function(d){
    if((d.Practice) && (d.IsSurgical == false)){return 1;}
    else {return 0;} });

  var referringDoctorSurgGroup = referringDoctorDim.group().reduceSum(function(d){
    if(d.IsSurgical == false){return 0;}
    else {return 1;} });
  var referringDoctorNonSurgGroup = referringDoctorDim.group().reduceSum(function(d){
    if(d.IsSurgical == false){return 1;}
    else {return 0;} });

  var refDocScatterGroup = referringDoctorDim.group().reduce(
    function(p,v){
      // console.log("P:");
      // console.log(p);
      // console.log("V:");
      // console.log(v);
      if(v.IsSurgical){
        p.numSurg += 1;
      }
      else{
        p.numNonSurg += 1;
      }
      return p
    },
    function(p,v){
      if(v.IsSurgical){
        p.numSurg -= 1;
      }
      else{
        p.numNonSurg -= 1;
      }
      return p;
    },
    function(){
      return {"numSurg":0, "numNonSurg":0};
    }
  );
  //print_filter(refDocScatterGroup);
  // var refDocScatterDim = refDocScatterGroup.dimension(function(d){return [d.value.numSurg,d.value.numNonSurg]});
  // var refDocScatterGroup = refDocScatterDim.group().reduceCount();

  var minclinicDate = clinicDateDim.bottom(1)[0].ClinicDate;
  var maxclinicDate = clinicDateDim.top(1)[0].ClinicDate;
  var minMaxArrclinicDate = [minclinicDate,maxclinicDate];
  var clinicDategraphingGroups = [{'data':clinicDateSurgGroup, 'name': 'Surgical'},{'data':clinicDateNonSurgGroup, 'name': 'Non Surgical'}];
  var pracGraphingGroups = [{'data':practiceSurgGroup, 'name': 'Surgical'},{'data':practiceNonSurgGroup, 'name': 'Non Surgical'}];
  var refDocGraphingGroups = [{'data':referringDoctorSurgGroup, 'name': 'Surgical'},{'data':referringDoctorNonSurgGroup, 'name': 'Non Surgical'}];

  var appComGroup = appCompScoreDim.group().reduceCount();
  allAppComps = appComGroup.top(Infinity);
  lowerBound = allAppComps[0].value;
  upperBound = allAppComps[allAppComps.length - 1].value;

  //var isSurgicalGraphingGroups = [{'data':isSurgicalSurgGroup,'name':'Surgical'}, {'data':isSurgicalNonSurgGroup,'name':"Non Surgical"}]
  setBarChartChooser("#dailyHits-filterizer", clinicDateDim, 0,60, clinicDategraphingGroups, minMaxArrclinicDate, "Number of Cases");
  // setBarChart("#refDocDist", referringDoctorDim, 0,400, refDocGraphingGroups, "ReferringDocs", "Num Cases");
  setBarChart("#pracDist", practiceDim, 0,400, pracGraphingGroups, "Practice", "Num Cases");
  setPieChart("#percSurgical", isSurgicalDim, 0,200,isSurgicalGroup, "Number of cases");
  setScatterChart("#refDocScatter", referringDoctorDim, refDocScatterGroup, "numNonSurg", "numSurg", "Num Non-Surgical", "Num Surgical", 35);
  setHeatmap("#appCompHeat", appCompScoreDim, appComGroup, "Complexity", 1, "Appropriateness", 0, lowerBound, upperBound);

}