from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
import json
import connectingToDB as surgDB
from MyJSONEncoder import MyJSONEncoder
from datetime import datetime

app = Flask(__name__)
app.json_encoder = MyJSONEncoder

@app.route('/')
def index():
  return render_template("index.html")

@app.route('/movement')
def movement():
  return render_template("movement.html")

@app.route('/search')
def search():
  return render_template("search.html")

@app.route('/search/allTerms')
def search_allTerms():
  colNames = ["label", "category", "value"]
  allData = surgDB.getJSON("ServerDatafiles/getSearchSuggestions.sql", colNames)
  return jsonify(allData)

@app.route("/dashboard/search/<int:id>/<string:category>")
def dashboard_search(id, category):
  colNames = ["ClinicDate", "IsDirect", "WasScreened", "ScreenDate", "IsSurgical", "AppScore", "ComplexityScore"]
  colNames += ["ValueScore", "Location", "Name", "Diagnosis", "Referring_Doc", "Practice", "Insurance", "IsMedicaid"]

  allPatientData = surgDB.customSearchQuery(category, id, colNames)
  return jsonify(allPatientData)


@app.route("/dashboard/patients")
def dashboard_patients():
  colNames = ["ClinicDate", "IsDirect", "WasScreened", "ScreenDate", "IsSurgical", "AppScore", "ComplexityScore"]
  colNames += ["ValueScore", "Location", "Diagnosis", "Referring_Doc", "Practice", "Insurance", "IsMedicaid"]
  allPatients_json = surgDB.getJSON("ServerDatafiles/mainSelect.sql", colNames)
  return jsonify(allPatients_json)

@app.route("/dashboard/movement")
def dashboard_movement():
  
  colNames = ["Type", "Name", "ThisYear", "ThisQuarter", "NumPatients", "NumSurgical", "LastYear", "LastQuarter"]
  colNames += ["LastPatients", "LastSurgical", "qAvgPatients", "qAvgSurgical"]
  print(datetime.now().time())
  allPatientChanges = surgDB.getJSON("ServerDatafiles/PercChangeSelect.sql", colNames)
  print(datetime.now().time())
  dataReturn = jsonify(allPatientChanges)
  print(datetime.now().time())
  return dataReturn

if __name__ == '__main__':
    app.run()