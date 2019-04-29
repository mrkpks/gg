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
