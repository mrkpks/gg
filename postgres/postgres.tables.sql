CREATE TABLE "Occupation" (
  "_id_occup" int,
  "name" varchar(50),
  PRIMARY KEY ("_id_occup")
);

CREATE TABLE "Officiant" (
  "_id_officiant" int,
  "surname" varchar(50),
  "title" varchar(50),
  PRIMARY KEY ("_id_officiant")
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
  "officiant_id" int,
  PRIMARY KEY ("_id_marriage")
);

CREATE INDEX "MREG" ON  "Marriage" ("register_id");

CREATE INDEX "MUSR" ON  "Marriage" ("user_id");

CREATE INDEX "MGRO" ON  "Marriage" ("groom_id");

CREATE INDEX "MBRI" ON  "Marriage" ("bride_id");

CREATE INDEX "MOFF" ON  "Marriage" ("officiant_id");

CREATE TABLE "PersonOccupation" (
  "occup_id" int,
  "person_id" int
);

CREATE INDEX "POCC" ON  "PersonOccupation" ("occup_id", "person_id");

CREATE TABLE "Witness" (
  "marriage_id" int,
  "person_id" int,
  "side" varchar(20),
  "relationship" varchar(50)
);

CREATE INDEX "WITN" ON  "Witness" ("marriage_id", "person_id");

CREATE TABLE "Name" (
  "_id_name" int,
  "name" varchar(50),
  PRIMARY KEY ("_id_name")
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
  "register_id" int,
  PRIMARY KEY ("_id_death")
);

CREATE INDEX "FUSR" ON  "Death" ("user_id");

CREATE INDEX "FDIR" ON  "Death" ("director_id");

CREATE INDEX "FCEL" ON  "Death" ("celebrant_id");

CREATE INDEX "FPER" ON  "Death" ("person_id");

CREATE INDEX "FREG" ON  "Death" ("register_id");

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
  "father_id" int,
  PRIMARY KEY ("_id_person")
);

CREATE INDEX "PMOT" ON  "Person" ("mother_id");

CREATE INDEX "PFAT" ON  "Person" ("father_id");

CREATE TABLE "CelebrantName" (
  "celebrant_id" int,
  "name_id" int
);

CREATE INDEX "CNAME" ON  "CelebrantName" ("celebrant_id", "name_id");

CREATE TABLE "User" (
  "_id_user" int,
  "name" varchar(30),
  PRIMARY KEY ("_id_user")
);

CREATE TABLE "Celebrant" (
  "_id_celebrant" int,
  "surname" varchar(50),
  "title_occup" varchar(50),
  PRIMARY KEY ("_id_celebrant")
);

CREATE TABLE "DirectorName" (
  "director_id" int,
  "name_id" int
);

CREATE INDEX "DNAME" ON  "DirectorName" ("director_id", "name_id");

CREATE TABLE "OfficiantName" (
  "name_id" int,
  "officiant_id" int
);

CREATE INDEX "ONAME" ON  "OfficiantName" ("name_id", "officiant_id");

CREATE TABLE "Director" (
  "_id_director" int,
  "surname" varchar(30),
  "title" varchar(30),
  PRIMARY KEY ("_id_director")
);

CREATE TABLE "Register" (
  "_id_register" int,
  "archive" varchar(20),
  "fond" varchar(20),
  "signature" int,
  PRIMARY KEY ("_id_register")
);

CREATE TABLE "PersonName" (
  "name_id" int,
  "person_id" int
);

CREATE INDEX "PNAME" ON  "PersonName" ("name_id", "person_id");

