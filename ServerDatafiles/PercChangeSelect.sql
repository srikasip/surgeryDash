CREATE TEMP TABLE quarterlyCounts (
  Year int,
  Quarter int,
  Type varchar(50),
  TutionName varchar(200),
  numPatients int default 0,
  numSurgical int default 0
);

CREATE TEMP TABLE quarters(
  Year int,
  Quarter int,
  LastYear int,
  LastQuarter int
);

Insert Into quarters(Year, Quarter, LastQuarter, LastYear)
  Select 
    EXTRACT(Year FROM p.clinicdate) as Year,
    EXTRACT(Quarter From p.clinicdate) as Quarter,
    (Case WHEN EXTRACT(Quarter From p.clinicdate) = 1 THEN 4 ELSE EXTRACT(Quarter From p.clinicdate)-1 END) as LastQuarter,
    (Case WHEN EXTRACT(Quarter From p.clinicdate) = 1 THEN EXTRACT(Year FROM p.clinicdate) - 1 ELSE EXTRACT(Year FROM p.clinicdate) END) as LastYear
  From patients as p
  Group By Quarter, Year
  Order by Year, Quarter;


Insert into quarterlyCounts (Year, Quarter, Type, TutionName, numPatients, numSurgical)
  Select q.Year as Year, q.Quarter as Quarter, 'RefDoc',rd.name as DocName, count(p.id), sum(CASE WHEN p.issurgical THEN 1 ELSE 0 END) as NumSurgeries
  From quarters as q
  Cross Join RefDocs as rd

  Left Join patients as p
    On Extract(Year From p.clinicdate) = q.Year and 
    Extract(Quarter From p.clinicdate) = q.quarter and
    p.refdoc_id = rd.id

  Group By Year, Quarter, DocName;

Insert into quarterlyCounts (Year, Quarter, Type, TutionName, numPatients, numSurgical)
  Select q.Year as Year, q.Quarter as Quarter, 'Practice', min(prac.name) as PracName, count(p.id) as numPatients, sum(CASE WHEN p.issurgical THEN 1 ELSE 0 END) as NumSurgerical
  From Quarters as q 
  Cross Join Practices as prac

  Join PracticeDocPivot as pracDoc 
  On pracDoc.practice_id = prac.id
  Left Join patients as p
  On p.refdoc_id = pracDoc.refdoc_id
    and Extract(Year From p.clinicdate) = q.Year 
    and Extract(Quarter From p.clinicdate) = q.quarter
  Group By prac.id, Year, Quarter 
  Order by Year, Quarter, PracName;

Select Year, Quarter, Type, TutionName, numPatients, numSurgical From quarterlyCounts;


Select q1.type as Type, q1.TutionName as Name, q1.Year as "ThisYear", q1.Quarter as "ThisQuarter",
q1.numPatients as NumPatients, q1.numSurgical as NumSurgical, q2.Year as "LastYear",q2.Quarter as "LastQuarter", q2.numPatients as LastPatients, q2.numSurgical as LastSurgical,
q3.avgPatients as qAvgPatients, q3.avgSurgical qAvgSurgical
  From quarterlyCounts as q1
  Join quarters as q
  On q1.Year = q.Year and q1.Quarter = q.Quarter
  Left Join quarterlyCounts as q2
  on q1.TutionName = q2.TutionName and
  q1.type = q2.type and
  q.LastYear = q2.Year and q.LastQuarter = q2.Quarter
  Left Join (Select qMaster.TutionName, qMaster.type, round(Cast(AVG(qMaster.numPatients) as numeric),2) as avgPatients, round(Cast(AVG(qMaster.numSurgical) as numeric),2) as avgSurgical
        From quarterlyCounts as qMaster 
        Group By qMaster.TutionName, qMaster.type
        ) as q3
  on q1.TutionName = q3.TutionName and q1.type = q3.type
Order by q3.avgPatients desc, q1.TutionName, q1.Year, q1.Quarter;

