-- select name, surname, village of a Person
select "Name"."name", "Person"."surname", "Person"."village"
from "PersonName"
join "Person" on "PersonName"."person"="Person"."_id_person"
join "Name" on "PersonName"."name"="Name"."_id_name";

select "Marriage"."_id_marriage", "Marriage"."village", "Person"."_id_person", "Name"."name", "Person"."surname", "Person"."village"
from "Marriage"
join "Person" on "Marriage"."groom_id"="Person"."_id_person"
join "PersonName" on "PersonName"."person_id"="Person"."_id_person"
join "Name" on "PersonName"."name_id"="Name"."_id_name"
order by "Person"."_id_person";

select "Person"."_id_person", "PersonName"."person_id", "PersonName"."name_id", "Name"."_id_name", "Name"."name" from "Person" join "PersonName" on "PersonName"."person_id"="Person"."_id_person" join "Name" on "Name"."_id_name"="PersonName"."name_id";


SELECT _id_marriage, mar.bride_y, o.surname, ofn.name, bp.surname, bn.name, gp.surname, gn.name, bmp.surname, bmn.name, bfp.surname, bfn.name, gmp.surname, gmn.name, gfp.surname, gfn.name,
FROM "Marriage" as mar

JOIN "Officiant" as o ON mar.officiant_id=o._id_officiant
JOIN "OfficiantName" as oon ON o._id_officiant=oon.officiant_id
JOIN "Name" as ofn ON oon.name_id=ofn.name_id

JOIN "Person" as bp ON mar.bride_id=bp._id_person
JOIN "PersonName" as bpn ON bp._id_person=bpn.person_id
JOIN "Name" as bn ON bpn.name_id=bn._id_name

JOIN "Person" as gp ON mar.groom_id=gp._id_person
JOIN "PersonName" as gpn ON gp._id_person=gpn.person_id
JOIN "Name" as gn ON gpn.name_id=gn._id_name

JOIN "Person" as bmp ON bp.mother_id=bmp._id_person
JOIN "PersonName" as bmpn ON bmp._id_person=bmpn.person_id
JOIN "Name" as bmn ON bmpn.name_id=bmn._id_name

JOIN "Person" as bfp ON bp.father_id=bfp._id_person
JOIN "PersonName" as bfpn ON bfp._id_person=bfpn.person_id
JOIN "Name" as bfn ON bfpn.name_id=bfn._id_name

JOIN "Person" as gmp ON gp.mother_id=gmp._id_person
JOIN "PersonName" as gmpn ON gmp._id_person=gmpn.person_id
JOIN "Name" as gmn ON gmpn.name_id=gmn._id_name

JOIN "Person" as gfp ON bp.father_id=gfp._id_person
JOIN "PersonName" as gfpn ON gfp._id_person=gfpn.person_id
JOIN "Name" as gfn ON gfpn.name_id=gfn._id_name

WHERE mar.bride_adult=false;


SELECT pg_size_pretty(pg_indexes_size("PersonName"));
