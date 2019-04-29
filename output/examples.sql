-- select name, surname, village of a Person
select "Name"."name", "Person"."surname", "Person"."village"
from "PersonName"
join "Person" on "PersonName"."person"="Person"."_id_person"
join "Name" on "PersonName"."name"="Name"."_id_name";

