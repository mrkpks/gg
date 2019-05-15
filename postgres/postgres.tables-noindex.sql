CREATE TABLE "Occupation" (
  "_id_occup" int,
  "name" varchar(50)
);

CREATE TABLE "Officiant" (
  "_id_officiant" int,
  "surname" varchar(50),
  "title" varchar(50)
);

CREATE TABLE "Marriage" (
  "_id_marriage" int,
  "rec_ready" boolean,
  "rec_order" int,
  "scan_order" int,
  "scan_layout" varchar(5),
  "date" date,
  "village" varchar(50),
  "groom_y" int,
  "groom_m" int,
  "groom_d" int,
  "bride_y" int,
  "bride_m" int,
  "bride_d" int,
  "groom_adult" boolean,
  "bride_adult" boolean,
  "relationship" varchar(50),
  "banns_1" date,
  "banns_2" date,
  "banns_3" date,
  "register_id" int,
  "user_id" int,
  "groom_id" int,
  "bride_id" int,
  "officiant_id" int
);

CREATE TABLE "PersonOccupation" (
  "occup_id" int,
  "person_id" int
);

CREATE TABLE "Witness" (
  "marriage_id" int,
  "person_id" int,
  "side" varchar(20),
  "relationship" varchar(50)
);

CREATE TABLE "Name" (
  "_id_name" int,
  "name" varchar(50)
);

CREATE TABLE "Death" (
  "_id_death" int,
  "rec_ready" boolean,
  "rec_order" int,
  "scan_order" int,
  "scan_layout" varchar(5),
  "provision_date" date,
  "death_date" date,
  "funeral_date" date,
  "death_village" varchar(50),
  "death_street" varchar(80),
  "death_descr" varchar(10),
  "place_funeral" varchar(50),
  "place_death" varchar(50),
  "widowed" boolean,
  "age_y" int,
  "age_m" int,
  "age_d" int,
  "age_h" int,
  "death_cause" varchar(50),
  "inspection" boolean,
  "inspection_by" varchar(80),
  "notes" varchar(80),
  "user_id" int,
  "director_id" int,
  "celebrant_id" int,
  "person_id" int,
  "register_id" int
);

CREATE TABLE "Person" (
  "_id_person" int,
  "surname" varchar(50),
  "village" varchar(50),
  "street" varchar(50),
  "descr" int,
  "birth" date,
  "sex" varchar(10),
  "religion" varchar(50),
  "mother_id" int,
  "father_id" int
);

CREATE TABLE "CelebrantName" (
  "celebrant_id" int,
  "name_id" int
);

CREATE TABLE "User" (
  "_id_user" int,
  "name" varchar(30)
);

CREATE TABLE "Celebrant" (
  "_id_celebrant" int,
  "surname" varchar(50),
  "title_occup" varchar(50)
);

CREATE TABLE "DirectorName" (
  "director_id" int,
  "name_id" int
);

CREATE TABLE "OfficiantName" (
  "name_id" int,
  "officiant_id" int
);

CREATE TABLE "Director" (
  "_id_director" int,
  "surname" varchar(30),
  "title" varchar(30)
);

CREATE TABLE "Register" (
  "_id_register" int,
  "archive" varchar(20),
  "fond" varchar(20),
  "signature" int
);

CREATE TABLE "PersonName" (
  "name_id" int,
  "person_id" int
);


