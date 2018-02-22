import psycopg2
import json
from datetime import date
from datetime import datetime
from operator import itemgetter

# database = "d47tunqullfegl"
# user = "hsjcwbnmmxtndd"
# host = "ec2-54-225-255-132.compute-1.amazonaws.com"
# port ='5432'
# password = "d0b8ebd8460008cb897a7afc2cee5faeb3134dc5d1a37ed4edac1f1e2fc4ef31"

database = "SurgeryDashDB"
user = "srikasip"
host = "localhost"
port =''
password = ''

def customSearchQuery(cat, val, colNames):
  filename = "ServerDatafiles/customMainSelect.sql"
  whereDict = {
    'Practices':{'tableName':'pr', 'searchCol':'id'},
    'Referrers':{'tableName':'d', 'searchCol':'id'},
    'Insurances':{'tableName':'ins', 'searchCol':'id'},
    'Diagnoses':{'tableName':'diag', 'searchCol':'id'},
    'Patients':{'tableName':'p', 'searchCol':'id'}
  }

  with open(filename, "rU") as sqlFile:
    command = sqlFile.read()
  
  whereClause = whereDict[cat]['tableName'] + "." + whereDict[cat]['searchCol'] + " = " + str(val)
  command = command.replace('--||WHERECLAUSE||--',whereClause)
  returnedData = connectToDB(command)

  allData = []
  for row in returnedData:
    counter = 0
    rowData = {}
    for colName in colNames:
      rowData[colName] = row[counter]
      counter += 1
    allData.append(rowData)


  return allData  


def getRefDocMedians(sentFileName, colNames):
  data = getJSON(sentFileName, colNames)
  return returnObj
  
def getWhaleProv(sentFileName):
  data = getJSON(sentFileName, ["Name", "NumSurgeries", "NumNonSurgeries", "Total"])
  returnObj = calcWhaleCurve(data)
  return returnObj

  
def calcWhaleCurve(sentData, procReimb=1492, hourlyRate=398, avgVisitLength=0.75, hrsSpentPerProv=5, lengthOfCall=0.5):
  numProviders = len(sentData)
  totalProfit = 0.0
  for prov in sentData:
    prov["Revenue"] = prov["NumSurgeries"] * (procReimb + hourlyRate*avgVisitLength)
    prov["Revenue"] += prov["NumNonSurgeries"] * (hourlyRate*avgVisitLength)
    prov["Costs"] = hrsSpentPerProv * hourlyRate
    prov["Costs"] += lengthOfCall * hourlyRate * (prov["Total"])
    prov["Profit"] = prov["Revenue"] - prov["Costs"]
    totalProfit += prov["Profit"]


  #Rerank the link by profitablitiy
  newlist = sorted(sentData, key=itemgetter('Profit'), reverse=True)

  #Now calculate %'s
  counter = 1.0
  runningRev = 0.0
  runningProf = 0.0
  for prov in newlist:
    runningRev += prov["Revenue"]
    runningProf += prov["Profit"]

    prov["runningRevenue"] = runningRev
    prov["runningProfit"] = runningProf
    prov["percProfits"] = runningProf/totalProfit
    prov["percCustomer"] = counter/numProviders
    counter = counter + 1.0

  googTableWhale = getGoogleFormattedDataFromJSON(newlist, ["percCustomer", "percProfits"])['table']
  googTableRev = getGoogleFormattedDataFromJSON(newlist, ["Name", "percCustomer", "runningRevenue", "runningProfit"])['table']

  groupJSON = {"tableWhale":googTableWhale, "tableRev":googTableRev}
  return groupJSON

def getGoogleFormattedDataFromJSON(allData, colNames):
  cols = []
  for colName in colNames:
    col = {}
    col["id"] = colName
    col["label"] = colName
    if colName in ["ClinicDate", "ScreenDate"]:
      col["type"] = 'string'
    elif colName in ["IsDirect", "IsScreened", "IsSurgical", "IsMedicaid"]:
      col['type'] = 'boolean'
    elif colName in ["AppropriatenessScore", "ComplexityScore", "ValueScore", "Total", "percCustomer", "percProfits", "runningRevenue", "runningProfit"]:
      col['type'] = 'number'
    elif colName[:3] == "Num":
      col['type'] = 'number'
    else:
      col["type"] = 'string'
    cols.append(col)

  rows = []
  for patient in allData:
    counter = 0
    c=[]
    for colName in colNames:
      newColVal = {}
      if colName in patient.keys():
        newColVal["v"] = patient[colName]
        if isinstance(patient[colName], date):
          newColVal["f"] = patient[colName].isoformat()
        else:
          newColVal["f"] = str(patient[colName])
      else:
        newColVal['v'] = None
        newColVal['f'] = "NaN"
      
      c.append(newColVal)
    rows.append({"c":c})

  responseObj = {}
  responseObj["version"] = '0.6'
  responseObj["reqId"]='0'
  responseObj["status"]= 'ok'
  responseObj["table"] = {"cols":cols, "rows":rows}

  return responseObj

def getGoogleFormattedData(filename, colNames):
  allData = getJSON(filename, colNames)
  respObj = getGoogleFormattedDataFromJSON(allData, colNames)
  return respObj
  


def getJSON(filename, colNames):
  with open(filename, "rU") as sqlFile:
    command = sqlFile.read()
  
  returnedData = connectToDB(command)

  allData = []
  for row in returnedData:
    counter = 0
    rowData = {}
    for colName in colNames:
      rowData[colName] = row[counter]
      counter += 1
    allData.append(rowData)


  return allData

def connectToDB(command):
  conn = psycopg2.connect("dbname='"+database+"' user='"+user+"' host='"+host+"' password='"+password+"' port="+port)

  cur = conn.cursor()
  cur.execute(command)

  allData = cur.fetchall()
  
  conn.close()

  return allData

def getSelectStatement():
  with open("ServerDatafiles/mainSelect.sql", "rU") as sqlFile:
    statement = sqlFile.read()
  return statement

