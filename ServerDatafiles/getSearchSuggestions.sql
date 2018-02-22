SELECT name as term, 'Practices' as category, id as value FROM practices
UNION ALL           
SELECT name as term, 'Referrers' as category, id as value FROM refDocs
UNION ALL           
SELECT name as term, 'Insurances' as category, id as value FROM insurances
UNION ALL             
SELECT name as term, 'Diagnoses' as category, id as value FROM diagnoses
UNION ALL             
SELECT name as term, 'Patients' as category, id as value FROM patients;