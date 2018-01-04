from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
import json
import connectingToDB as surgDB

app = Flask(__name__)

@app.route('/')
def index():
  return render_template("index.html")

@app.route("/dashboard/patients")
def dashboard_patients():
  colNames = ["ClinicDate", "IsDirect", "WasScreened", "ScreenDate", "IsSurgical", "AppScore", "ComplexityScore"]
  colNames += ["ValueScore", "Location", "Diagnosis", "Referring_Doc", "Practice", "Insurance", "IsMedicaid"]
  print colNames
  allPatients_json = surgDB.getJSON("ServerDatafiles/mainSelect.sql", colNames)
  return jsonify(allPatients_json)

@app.route("/gooboard/patients")
def gooboard_patients():
  colNames = ["ClinicDate", "IsDirect", "IsScreened", "ScreenDate", "IsSurgical", "AppropriatenessScore", "ComplexityScore", "ValueScore", "Location", "Diagnosis", "ReferringDoctor", "Practice", "Insurance", "IsMedicaid"]
  filehand = "ServerDatafiles/mainSelect.sql"
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/patientCount")
def gooboard_patientCount():
  startDate = ""
  endDate = ""
  colNames = ["NumPatients"]
  filehand = "ServerDatafiles/overallPatientCount.sql"
  #print('Start Date: ' + startDate)
  #print('End Date: ' + endDate)
  print request.args['startDate']
  print request.args['endDate']
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/practiceCount")
def gooboard_practiceCount():
  colNames = ["NumPractices"]
  filehand = "ServerDatafiles/overallPracticesCount.sql"
  
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/refDocCount")
def gooboard_refDocCount():
  colNames = ["NumRefDocs"]
  filehand = "ServerDatafiles/overallRefDocsCount.sql"
  
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/insuranceCount")
def gooboard_insuranceCount():
  colNames = ["NumInsurances"]
  filehand = "ServerDatafiles/overallInsurancesCount.sql"
  
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/surgRatio")
def gooboard_surgRatio():
  colNames = ["isSurgical", "NumPatients"]
  filehand = "ServerDatafiles/SurgicalRatio.sql"
  
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/dateVsurg")
def gooboard_DateVSurg():
  colNames = ["ClinicMonth", "NumSurgeries", "NumNonSurgeries"]
  filehand = "ServerDatafiles/totalsSurgByDate.sql"
  
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/provVsurg")
def gooboard_ProvVSurg():
  colNames = ["RefDoc", "NumSurgeries", "NumNonSurgeries"]
  filehand = "ServerDatafiles/totalsSurgByProv.sql"
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/pracVsurg")
def gooboard_PracVSurg():
  colNames = ["Practice", "NumSurgeries", "NumNonSurgeries"]
  filehand = "ServerDatafiles/totalsSurgByPractice.sql"
  allPatients_googleData = surgDB.getGoogleFormattedData(filehand, colNames)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/provWhale")
def gooboard_ProviderWhale():
  filehand = "ServerDatafiles/whaleCurveDoc.sql"
  allPatients_googleData = surgDB.getWhaleProv(filehand)
  return jsonify(allPatients_googleData)

@app.route("/gooboard/pracWhale")
def gooboard_PractiveWhale():
  filehand = "ServerDatafiles/whaleCurvePrac.sql"
  allPatients_googleData = surgDB.getWhaleProv(filehand)
  return jsonify(allPatients_googleData)

if __name__ == '__main__':
    app.run()