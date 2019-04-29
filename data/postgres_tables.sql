CREATE TABLE "Occupation" (
  "_id_occup" int,
  "name" varchar(50),
  PRIMARY KEY ("_id_occup")
);

CREATE TABLE "Officiant" (
  "_id_officiant" int,
  "surname" varchar(30),
  "title" varchar(30),
  PRIMARY KEY ("_id_officiant")
);

CREATE TABLE "Marriage" (
  "_id_marriage" int,
  "rec_ready" boolean,
  "rec_order" int,
  "scan_order" int,
  "scan_layout" varchar(2),
  "date" date,
  "village" varchar(30),
  "groom_y" int,
  "groom_m" int,
  "groom_d" int,
  "bride_y" int,
  "bride_m" int,
  "bride_d" int,
  "groom_adult" date,
  "bride_adult" date,
  "relationship" varchar(30),
  "banns_1" varchar(50),
  "banns_2" varchar(50),
  "banns_3" varchar(50),
  "register" int,
  "user" int,
  "groom" int,
  "bride" int,
  "officiant" int,
  PRIMARY KEY ("_id_marriage")
);

CREATE INDEX "MREG" ON  "Marriage" ("register");

CREATE INDEX "MUSR" ON  "Marriage" ("user");

CREATE INDEX "MGRO" ON  "Marriage" ("groom");

CREATE INDEX "MBRI" ON  "Marriage" ("bride");

CREATE INDEX "MOFF" ON  "Marriage" ("officiant");

CREATE TABLE "PersonOccupation" (
  "occup" int,
  "person" int
);

CREATE INDEX "POCC" ON  "PersonOccupation" ("occup", "person");

CREATE TABLE "Witness" (
  "marriage" int,
  "person" int,
  "side" varchar(5),
  "relationship" varchar(30)
);

CREATE INDEX "WITN" ON  "Witness" ("marriage", "person");

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
  "scan_layout" varchar(2),
  "provision_date" date,
  "death_date" date,
  "funeral_date" date,
  "death_village" varchar(30),
  "death_street" varchar(30),
  "death_descr" varchar(10),
  "place_funeral" varchar(30),
  "place_death" varchar(30),
  "widowed" boolean,
  "age_y" int,
  "age_m" int,
  "age_d" int,
  "age_h" int,
  "death_cause" varchar(30),
  "inspection" boolean,
  "inspection_by" varchar(30),
  "notes" varchar(80),
  "user" int,
  "director" int,
  "celebrant" int,
  "person" int,
  "register" int,
  PRIMARY KEY ("_id_death")
);

CREATE INDEX "FUSR" ON  "Death" ("user");

CREATE INDEX "FDIR" ON  "Death" ("director");

CREATE INDEX "FCEL" ON  "Death" ("celebrant");

CREATE INDEX "FPER" ON  "Death" ("person");

CREATE INDEX "FREG" ON  "Death" ("register");

CREATE TABLE "Person" (
  "_id_person" int,
  "surname" varchar(30),
  "village" varchar(30),
  "street" varchar(30),
  "descr" int,
  "birth" date,
  "sex" varchar(6),
  "religion" varchar(15),
  "mother" int,
  "father" int,
  PRIMARY KEY ("_id_person")
);

CREATE INDEX "PMOT" ON  "Person" ("mother");

CREATE INDEX "PFAT" ON  "Person" ("father");

CREATE TABLE "CelebrantName" (
  "celebrant" int,
  "name" int
);

CREATE INDEX "CNAME" ON  "CelebrantName" ("celebrant", "name");

CREATE TABLE "User" (
  "_id_user" int,
  "name" varchar(30),
  PRIMARY KEY ("_id_user")
);

CREATE TABLE "Celebrant" (
  "_id_celebrant" int,
  "surname" varchar(30),
  "title_occup" varchar(30),
  PRIMARY KEY ("_id_celebrant")
);

CREATE TABLE "DirectorName" (
  "director" int,
  "name" int
);

CREATE INDEX "DNAME" ON  "DirectorName" ("director", "name");

CREATE TABLE "OfficiantName" (
  "name" int,
  "officiant" int
);

CREATE INDEX "ONAME" ON  "OfficiantName" ("name", "officiant");

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
  "name" int,
  "person" int
);

CREATE INDEX "PNAME" ON  "PersonName" ("name", "person");
