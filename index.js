/*
 *
 * This script generates a specific testing dataset for comparison of PostgreSQL and MongoDB database systems
 * The generated data is an interpretation of actual data stored as rewritten Vital Records
 * analyzed from "Moravský zemský archiv (MZA) v Brně: fond E67 - Sbírka matrik"
 *
 * Author: Marek Pakes, xpakes00@stud.fit.vutbr.cz
 * Created for Bachelor's thesis on topic "Porovnání relačních a dokumentových databázových systémů pro genealogické účely"
 * Year: 2019
 *
 */

const startedGeneratingAt = new Date();
console.log('Started at: ', startedGeneratingAt);

// Files from ./data -> Most common names, surnames, villages, occupations in Czech republic
// extracted from freely available data
// *_TITLES & DEATH_CAUSES extracted from provided documents from MZA
const VILLAGES = require('./data/towns.cz');
const NAMES_MEN = require('./data/names.men');
const NAMES_WOMEN = require('./data/names.women');
const SURNAMES_MEN = require('./data/surnames.men');
const SURNAMES_WOMEN = require('./data/surnames.women');
const PERSON_OCCUPATIONS = require('./data/occupations');
const DIRECTOR_TITLES = require('./data/director.titles');
const CELEBRANT_TITLES = require('./data/celebrant.titles');
const OFFICIANT_TITLES = require('./data/officiant.titles');
const DEATH_CAUSES = require('./data/death.causes');
const POSTGRES_CREDENTIALS = require('./postgres/credentials');

// Node.js File System (to write into output files)
// https://nodejs.org/api/fs.html
const fs = require('fs');

// Package for generating random names for Users + street & descr numbers for Persons
// https://www.npmjs.com/package/faker
const faker = require('faker');

// Library for working with dates (adding, subtracting)
// https://date-fns.org/
const dateFns = require('date-fns');

// MongoDB Node.JS Driver
// http://mongodb.github.io/node-mongodb-native/3.1/api/
const MongoClient = require('mongodb').MongoClient;

const assert = require('assert'); // for testing connections

const usersCount = 2; // number of users ("User" table)
// Registers count = archivesCount * fondsCount * signaturesCount ("Register" table entities count)
const archivesCount = 3; // number of generated unique archives
const fondsCount = 5; // number of generated unique fonds inside an archive
const signaturesCount = 15; // number of generated unique signatures inside of an archive fond
const directorsCount = 3; // number of unique funeral directors ("Director" table entities count)
const celebrantsCount = 3; // number of unique funeral celebrants ("Celebrant" table entities count)
const officiantsCount = 3; // number of unique marriage officiants ("Officiant" table entities count)

const villagesCount = Math.min(VILLAGES.length, 15);

/*** Parse args ***/
let recordsCount = 1000; // ("Death" table + "Marriage" table entities count)
let createIndexes = true;

const args = require('minimist')(process.argv.slice(2));
console.log(args);
console.log(args.i);

Object.keys(args).map(key => {
  if (key === 'createIndexes') {
    createIndexes = args['createIndexes'];
    console.log('createIndexes ', createIndexes);
  }

  if (key === 'recordsCount') {
    recordsCount = args['recordsCount'];
    console.log('recordsCount ', recordsCount);
  }
});


const computedMarriageRecordsCount = Math.floor(recordsCount / 3); // ("Marriage" table entities count)

/***
 * IMPORTANT NOTE: ALL PERSONS -> not only brides, grooms (+ these will eventually be deceased).
 * Counting also parents and kids
 * ***/
// Number of unique persons
// Due to randomness of generated kids + generating parents ratio of deaths & marriages to persons varies!
// Ratio of persons to deaths is approx. 4:1
// Ratio of persons to marriages is approx. 8:1
// can get to +2 to +6 due to kids and parents
const recordPersonsCount = computedMarriageRecordsCount * 8; // ("Person" table entities count)
const occupationsCount = Math.min(PERSON_OCCUPATIONS.length, 50); // number of unique occupations ("Occupation" table entities count)

const SQL_OUTPUT_FILE = 'output/inserts.sql'; // Usable for any SQL database
const POSTGRES_TABLES = createIndexes ? 'postgres/postgres.tables.sql' : 'postgres/postgres.tables-noindex.sql'; // For tables to create on db connect

faker.locale = 'cz'; // set locale of helper package for generating streets of persons and names of users

// Rewrite old output file
fs.writeFileSync(SQL_OUTPUT_FILE, '');

// String used for later PostgreSQL connection
let sqlInserts = '';

// Creates a SQL INSERT command to fill Postgres database
// AND
// Creates output file with these - SQL_OUTPUT_FILE
function sqlInsert(entityName, entity) {
  let columns = Object.keys(entity);
  let values = Object.values(entity).map(value => isNaN(value) ? `'${value}'` : value);

  // create inserts for PostgreSQL connection
  sqlInserts += `INSERT INTO "${entityName}" (${columns}) VALUES (${values});\n`;

  // create reusable output file for other potential SQL database usage
  fs.appendFileSync(
    SQL_OUTPUT_FILE,
    `INSERT INTO "${entityName}" (${columns}) VALUES (${values});\n`
  );
}

// A random index iterator (remembers used values)
// <iteratorInstance>.next() -> pushes next value to iterator
// <iteratorInstance>.next().value -> picks next value (random index number)
// Usage:
// const desiredRandomIndices = randomIndexFrom(myArray.length); -> create iterator
// let newRandomIndex = desiredRandomIndices.next().value;
function* randomIndexFrom(length) {
  const indices = Array.from({length}, (_, i) => i)
    .sort(() => Math.random() - 0.5);

  // returns an index from randomly sorted indices until length is reached (no duplicity)
  for (const index of indices) {
    yield index;
  }

  // if the length was reached, continues to return random index (random duplicity)
  while (true) {
    yield indices[Math.floor(Math.random() * length)];
  }
}

// Generate random date between startDate and endDate)
function randomDate(startDate, endDate) {
  if (!(startDate instanceof Date)) return;
  if (!endDate) {
    endDate = new Date();
  } else {
    if (!(endDate instanceof Date)) return;
  }
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

// create new output file if doesn't exist or rewrite to empty
// fs.writeFileSync(SQL_OUTPUT_FILE, '');

// create User table inserts
let users = [];

for (let i = 0; i < usersCount; i++) {
  const User = {
    _id_user: i,
    name: faker.fake("{{name.firstName}} {{name.lastName}}"),
  };

  users = [...users, User];
  sqlInsert('User', User);
}

// create Register table inserts
let registers = [];

for (let i = 0; i < archivesCount; i++) {
  for (let j = 0; j < fondsCount; j++) {
    for (let k = 0; k < signaturesCount; k++) {
      const Register = {
        _id_register: i * fondsCount * signaturesCount + j * signaturesCount + k,
        archive: `ARCH${i}`,
        fond: `FOND${j}`,
        signature: k,
      };

      registers = [...registers, Register];
      sqlInsert('Register', Register);
    }
  }
}

// create Name table inserts
let menNames = [];
let womenNames = [];

for (let i = 0; i < NAMES_MEN.length; i++) {
  const ManName = {
    _id_name: i,
    name: NAMES_MEN[i],
  };

  menNames = [...menNames, ManName];
  sqlInsert('Name', ManName);
}

for (let i = 0; i < NAMES_WOMEN.length; i++) {
  const WomanName = {
    _id_name: i + NAMES_MEN.length,
    name: NAMES_WOMEN[i],
  };

  womenNames = [...womenNames, WomanName];
  sqlInsert('Name', WomanName);
}

const allNames = [...menNames, ...womenNames];

// create Occupation table inserts
let occupations = [];

for (let i = 0; i < occupationsCount; i++) {
  const Occupation = {
    _id_occup: i,
    name: PERSON_OCCUPATIONS.map(occ => occ).sort(() => Math.random() - 0.5)[i],
  };

  occupations = [...occupations, Occupation];
  sqlInsert('Occupation', Occupation);
}

// create Director table inserts
let directors = [];

const directorTitleIndices = randomIndexFrom(DIRECTOR_TITLES.length);
const directorSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, directorsCount);

for (let i = 0; i < directorsCount; i++) {

  const Director = {
    _id_director: i,
    surname: directorSurnames[i],
    title: DIRECTOR_TITLES[directorTitleIndices.next().value],
  };

  directors = [...directors, Director];
  sqlInsert('Director', Director);
}

// create DirectorName table inserts
let directorNames = [];
const directorNameIndices = randomIndexFrom(NAMES_MEN.length);

for (let i = 0; i < directorsCount; i++) {
  const DirectorName = {
    director_id: i,
    name_id: directorNameIndices.next().value,
  };

  directorNames = [...directorNames, DirectorName];
  sqlInsert('DirectorName', DirectorName);
}

// create Celebrant table inserts
let celebrants = [];
const celebrantTitleIndices = randomIndexFrom(CELEBRANT_TITLES.length);
const celebrantSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, celebrantsCount);

for (let i = 0; i < celebrantsCount; i++) {
  const Celebrant = {
    _id_celebrant: i,
    surname: celebrantSurnames[i],
    title_occup: CELEBRANT_TITLES[celebrantTitleIndices.next().value],
  };

  celebrants = [...celebrants, Celebrant];
  sqlInsert('Celebrant', Celebrant);
}

// create CelebrantName table inserts
let celebrantNames = [];
const celebrantNameIndices = randomIndexFrom(NAMES_MEN.length);

for (let i = 0; i < celebrantsCount; i++) {
  const CelebrantName = {
    celebrant_id: i,
    name_id: celebrantNameIndices.next().value,
  };

  celebrantNames = [...celebrantNames, CelebrantName];
  sqlInsert('CelebrantName', CelebrantName);
}

// create Officiant table inserts
let officiants = [];
const officiantTitleIndices = randomIndexFrom(OFFICIANT_TITLES.length);
const officiantSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, officiantsCount);

for (let i = 0; i < officiantsCount; i++) {
  const Officiant = {
    _id_officiant: i,
    surname: officiantSurnames[i],
    title: OFFICIANT_TITLES[officiantTitleIndices.next().value],
  };

  officiants = [...officiants, Officiant];
  sqlInsert('Officiant', Officiant);
}

// create OfficiantName table inserts
let officiantNames = [];
const officiantNameIndices = randomIndexFrom(NAMES_MEN.length);

for (let i = 0; i < officiantsCount; i++) {
  const OfficiantName = {
    officiant_id: i,
    name_id: officiantNameIndices.next().value,
  };

  officiantNames = [...officiantNames, OfficiantName];
  sqlInsert('OfficiantName', OfficiantName);
}

// create Person table inserts
const personManSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personManIndices = randomIndexFrom(personManSurnames.length);

const personWomanSurnames = SURNAMES_WOMEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personWomanIndices = randomIndexFrom(personWomanSurnames.length);

let persons = [];
console.log('Person entities', new Date());
const personVillageIndices = randomIndexFrom(villagesCount);

for (let i = 0; i < recordPersonsCount;) { // incrementing takes place inside cycle for each person

  const [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');
  const personSex = Math.random() > 0.5 ? 'muž' : 'žena';
  const surname = personSex === 'muž'
    ? personManSurnames[personManIndices.next().value]
    : personWomanSurnames[personWomanIndices.next().value];

  const personVillage = VILLAGES[personVillageIndices.next().value];

  const randomReligion = Math.random() > 0.5 ? 'nepokřtěn' :  Math.random() > 0.2 ? 'katolík' : 'evangelík';
  const religionFather = Math.random() > 0.7 ? 'nepokřtěn' :  Math.random() > 0.2 ? 'katolík' : 'evangelík';
  const religionMother = Math.random() > 0.2 ? religionFather :  randomReligion;
  const religionPerson = Math.random() > 0.5 ? religionFather :  religionMother;

  const motherSurname = personSex === 'muž' ? `${surname}ová` : surname;
  const fatherSurname = personSex === 'muž' ? surname : surname.slice(0, surname.indexOf('ová'));

  const Mother = {
    _id_person: i,
    surname: motherSurname,
    village: personVillage,
    street: street,
    descr: descr,
    birth: dateFns.format(randomDate(new Date('1800-01-01'), new Date('1810-01-01')), 'YYYY-MM-DD'),
    sex: 'žena',
    religion: religionMother,
    // father_id: 99999, // FIXME? is this needed? - would have to generate another person. If so, add some randomness?
  };

  i++; // increment for each person
  persons = [...persons, Mother];
  sqlInsert('Person', Mother);

  const Father = {
    _id_person: i,
    surname: fatherSurname,
    village: personVillage,
    street: street,
    descr: descr,
    birth: dateFns.format(randomDate(new Date('1800-01-01'), new Date('1810-01-01')), 'YYYY-MM-DD'),
    sex: 'muž',
    religion: religionFather,
  };

  i++; // increment for each person
  persons = [...persons, Father];
  sqlInsert('Person', Father);

  const Person = {
    _id_person: i,
    surname: surname,
    village: personVillage,
    street: street,
    descr: descr,
    birth: dateFns.format(randomDate(new Date('1825-01-01'), new Date('1840-01-01')), 'YYYY-MM-DD'),
    sex: personSex,
    religion: religionPerson,
    mother_id: Mother._id_person,
    father_id: Father._id_person,
  };

  i++; // increment for each person
  persons = [...persons, Person];
  sqlInsert('Person', Person);

  if (Math.random() > 0.5) { // 50% persons will have randomly 1 - 4 kids (for Death records)
    const personKidsCount = Math.floor(Math.random() * 4 + 1);

    for (let j = 0; j < personKidsCount; j++) {
      const kidSex = Math.random() > 0.5 ? 'muž' : 'žena';
      const kidSameAddress = Math.random() > 0.2; // 20% kids have different address
      const kidStreet = faker.fake("{{address.streetAddress}}").split(' ')[1];
      const kidDescr = faker.fake("{{address.streetAddress}}").split(' ')[0];
      let kidSurname = Person.surname;

      if (kidSex !== personSex) {
        kidSurname = kidSex === 'žena' ? `${Person.surname}ová` : Person.surname.slice(0, surname.indexOf('ová'));
      }

      let PersonKid = {
        _id_person: i,
        surname: kidSurname,
        village: kidSameAddress ? personVillage : VILLAGES[Math.floor(Math.random() * 20)],
        street: kidStreet,
        descr: kidDescr,
        birth: dateFns.format(randomDate(new Date('1855-01-01'), new Date('1870-01-01')), 'YYYY-MM-DD'),
        sex: kidSex,
        religion: Math.random() > 0.2 ? religionPerson : 'nepokřtěn', // 80% same religion as parent or 20% not baptised
      };

      // connect kid to its mother or father
      // one of them is enough because it is needed only for Death records where dead_person is either of them (Person)
      Person.sex === 'žena' ? PersonKid.mother_id = Person._id_person : PersonKid.father_id = Person._id_person;

      i++; // increment cycle index for each kid
      persons = [...persons, PersonKid];
      sqlInsert('Person', PersonKid);
    }
  }
}

console.log('PersonName entities', new Date());
// create PersonName table inserts
let personNames = [];
const menNameIndices = randomIndexFrom(NAMES_MEN.length);
const womenNameIndices = randomIndexFrom(NAMES_WOMEN.length);

for (let i = 0; i < persons.length; i++) {
  const isMan = persons[i].sex === 'muž';

  const PersonName = {
    person_id: i,
    name_id: isMan ? menNameIndices.next().value : NAMES_MEN.length + womenNameIndices.next().value
  };

  // 30% of men will have 2 names
  if (isMan && Math.random() > 0.7) {
    const SecondName = {
      person_id: i,
      name_id: menNameIndices.next().value
    };

    personNames = [...personNames, SecondName];
    sqlInsert('PersonName', SecondName);
  }

  personNames = [...personNames, PersonName];
  sqlInsert('PersonName', PersonName);
}

console.log('PersonOccupation entities', new Date());
// create PersonOccupation table inserts
let personOccupations = [];

for (let i = 0; i < persons.length; i++) {
  // 80% will have 1 - 3 occupations
  if (Math.random() > 0.2) {
    const occupationIndices = randomIndexFrom(occupationsCount);
    const personOccupsCount = Math.floor(Math.random() * 3 + 1);

    for (let j = 0; j < personOccupsCount; j++) {
      const PersonOccupation = {
        person_id: i,
        occup_id: occupationIndices.next().value,
      };

      personOccupations = [...personOccupations, PersonOccupation];
      sqlInsert('PersonOccupation', PersonOccupation);
    }
  }
}

// create Marriage table inserts
let marriages = [];
let witnesses = [];

const officiantsIndices = randomIndexFrom(officiants.length);
const marriageRegistersIndices = randomIndexFrom(registers.length);
const marriageUsersIndices = randomIndexFrom(users.length);

console.log('grooms', new Date());
const grooms = persons
  .filter(person => person.sex === 'muž' && person.mother_id && person.father_id)
  .sort(() => Math.random() - 0.5);

console.log('brides', new Date());
const brides = persons
  .filter(person => person.sex === 'žena' && person.mother_id && person.father_id)
  .sort(() => Math.random() - 0.5);

const groomIndices = randomIndexFrom(grooms.length);
const brideIndices = randomIndexFrom(brides.length);


console.log('Marriage entities', new Date());
// added 20% so some people will have more than 1 wedding records
for (let i = 0; i < Math.floor(brides.length * 1.2); i++) {
  const marriageVillageIndices = randomIndexFrom(villagesCount);
  const groom = grooms[groomIndices.next().value];
  const bride = brides[brideIndices.next().value];

  // random date between couple's age of 15 to 35
  const marriageDate = dateFns.format(
    randomDate(
      dateFns.addYears(new Date(groom.birth), Math.floor(Math.random() * 20 + 15)),
      dateFns.addYears(new Date(bride.birth), Math.floor(Math.random() * 20 + 15))),
    'YYYY-MM-DD'
  );

  const groomDateDiffDays = dateFns.differenceInDays(new Date(marriageDate), new Date(groom.birth));
  const groom_y = Math.floor(groomDateDiffDays / 365);
  const groom_m = Math.floor((groomDateDiffDays - groom_y * 365) / 30);
  const groom_d = Math.floor((groomDateDiffDays - groom_y * 365 - groom_m * 30));

  const brideDateDiffDays = dateFns.differenceInDays(new Date(marriageDate), new Date(bride.birth));
  const bride_y = Math.floor(brideDateDiffDays / 365);
  const bride_m = Math.floor((brideDateDiffDays - bride_y * 365) / 30);
  const bride_d = Math.floor((brideDateDiffDays - bride_y * 365 - bride_m * 30));

  const marriageVillage = Math.random() > 0.5
    ? VILLAGES[marriageVillageIndices.next().value]
    : Math.random() > 0.5 ? groom.village : bride.village;

  const relatives = Math.floor(Math.random() * 100);
  let relationship = 'ne';

  switch (relatives) { // 5% of marriages will be between relatives
    case 95:
      relationship = 'strýc-neteř';
      break;

    case 96:
      relationship = 'sourozenci';
      break;

    case 97:
      relationship = 'bratranec-sestřenice 1. stupně';
      break;

    case 98:
      relationship = 'bratranec-sestřenice 2. stupně';
      break;

    case 99:
      relationship = 'polosourozenci';
      break;

    default:
      relationship = 'ne';
      break;
  }

  const Marriage = {
    _id_marriage: i,
    rec_ready: Math.random() > 0.2, // insignificant data - random
    rec_order: Math.floor(Math.random() * 1000), // insignificant data - random
    scan_order: Math.floor(Math.random() * 1000), // insignificant data - random
    scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P', // layout values according to provided data
    date: marriageDate,
    village: marriageVillage,
    groom_y: groom_y, // age is computed data - can be also queried, but it seems simpler to have inside table
    groom_m: groom_m,
    groom_d: groom_d,
    bride_y: bride_y,
    bride_m: bride_m,
    bride_d: bride_d,
    groom_adult: groom_y >= 18, // computed data - can be also queried TODO
    bride_adult: bride_y >= 18,
    relationship: relationship,
    groom_id: groom._id_person, // connected groom entity
    bride_id: bride._id_person, // connected bride entity
    user_id: users[marriageUsersIndices.next().value]._id_user, // randomly connected user entity
    register_id: registers[marriageRegistersIndices.next().value]._id_register, // randomly connected register entity
    officiant_id: officiants[officiantsIndices.next().value]._id_officiant, // randomly connected officiant entity
  };

  // add banns dates to some marriage records - for simplicity only storing dates of banns w/o text (would need another entity)
  if (Math.random() > 0.5) {
    Marriage.banns_1 = dateFns.format(dateFns.subDays(new Date(marriageDate), 7), 'YYYY-MM-DD');

    if (Math.random() > 0.5) {
      Marriage.banns_2 = dateFns.format(dateFns.subDays(new Date(marriageDate), 14), 'YYYY-MM-DD');

      if (Math.random() > 0.5) {
        Marriage.banns_3 = dateFns.format(dateFns.subDays(new Date(marriageDate), 21), 'YYYY-MM-DD');
      }
    }
  }

  marriages = [...marriages, Marriage];
  sqlInsert('Marriage', Marriage);

  // Create Witness table inserts
  // Generating witnesses for each marriage inside of its cycle
  const marriageWitnesses = persons
    .filter(person => person._id_person !== groom._id_person && person._id_person !== bride._id_person)
    .sort(() => Math.random() - 0.5).slice(0, 4);

  for (let j = 0; j < 4; j++) {
    const Witness = {
      person_id: marriageWitnesses[j]._id_person, // randomly connected to person entity
      marriage_id: i, // connected to marriage entity which is now generated
      side: j > 1 ? 'nevěsty' : 'ženicha', // to distinguish whether is related / acquainted to bride or groom
      relationship: Math.random() > 0.6 ? 'sourozenec' : Math.random() < 0.3 ? 'přítel': 'jiné', // 3 cases should be suitable for testing
    };

    witnesses = [...witnesses, Witness];
    sqlInsert('Witness', Witness);
  }
}

// create Death table inserts
const celebrantsIndices = randomIndexFrom(celebrants.length);
const directorsIndices = randomIndexFrom(directors.length);
const deathRegistersIndices = randomIndexFrom(registers.length);
const deathUsersIndices = randomIndexFrom(users.length);
const deathCausesIndices = randomIndexFrom(DEATH_CAUSES.length);
let deaths = [];

console.log('deadpersons', new Date());
// create a buffer to .pop() from, so no person has more than 1 death record
const deadPersons = persons.filter(person => person.mother_id && person.father_id);

console.log('Death entities', new Date());
// for (let i = Math.min(deathsCount, deadPersons.length); i > 0; i--) {
for (let i = deadPersons.length; i > 0; i--) {
  const deathVillageIndices = randomIndexFrom(villagesCount);
  const person = deadPersons[deadPersons.length - 1];
  const deathVillage = Math.random() > 0.5 ? VILLAGES[deathVillageIndices.next().value] : person.village;
  const deathDate = dateFns.format(dateFns.addYears(new Date(person.birth), Math.floor(Math.random() * 100)), 'YYYY-MM-DD');
  const ageDiffDays = dateFns.differenceInDays(new Date(deathDate), new Date(person.birth));
  const age_y = Math.floor(ageDiffDays / 365);
  const age_m = Math.floor((ageDiffDays - age_y * 365) / 30);
  const age_d = Math.floor((ageDiffDays - age_y * 365 - age_m * 30));
  const age_h = Math.floor(Math.random() * 24);

  let [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');

  let Death = {
    _id_death: i,
    rec_ready: Math.random() > 0.2, // insignificant data - random
    rec_order: Math.floor(Math.random() * 1000), // insignificant data - random
    scan_order: Math.floor(Math.random() * 1000), // insignificant data - random
    scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P', // layout values according to provided data
    death_village: deathVillage,
    death_street: deathVillage === person.village ? person.street : street,
    death_descr: deathVillage === person.village ? person.descr : descr,
    place_funeral: person.village,
    widowed: Math.random() > 0.7, // computed data - can be also queried TODO
    age_y: age_y, // age is computed data - can be also queried, but it seems simpler to have inside table
    age_m: age_m,
    age_d: age_d,
    age_h: age_h,
    inspection: Math.random() > 0.7,
    person_id: person._id_person, // connected to person entity
    user_id: users[deathUsersIndices.next().value]._id_user, // randomly connected user entity
    register_id: registers[deathRegistersIndices.next().value]._id_register, // randomly connected register entity
    director_id: directors[directorsIndices.next().value]._id_director, // randomly connected director entity
    celebrant_id: celebrants[celebrantsIndices.next().value]._id_celebrant, // randomly connected celebrant entity
  };

  const placeProb = Math.random();

  // every 20th record has death place filled
  if (placeProb > 0.8) {
    if (placeProb > 0.9) {
      Death.place_death = 'v řece Svitavě u Bilovic';
    } else {
      Death.place_death = 'nemocnice';
    }
  } // could be enriched with JSON data (more cases), but wouldn't affect testing

  // every 2nd record has death cause filled
  const causeProb = Math.random();

  if (causeProb > 0.5) {
    if (causeProb > 0.9) {
      Death.death_cause = 'osýpky'; // one of most frequent
    } else if (causeProb > 0.7) {
      Death.death_cause = 'souchotiny'; // one of most frequent
    } else {
      Death.death_cause = DEATH_CAUSES[deathCausesIndices.next().value];
    }
  }

  // every 10th record has notes filled
  const notesProb = Math.random();

  if (notesProb > 0.9) {
    Death.notes = 'chyba zápisu, prohozené rubriky';

    if (notesProb > 0.95) {
      Death.notes = 'poznámky...';
    }
  }

  // records either have death & funeral date or provision date
  if (Math.random() > 0.7) {
    Death.provision_date = deathDate;
  } else {
    Death.death_date = deathDate;
    Death.funeral_date = dateFns.format(dateFns.addDays(new Date(deathDate), 2), 'YYYY-MM-DD');
  }

  if (Death.inspection) {
    Death.inspection_by = Math.random() > 0.6 ? 'Dr. Hrachovina' : 'Dr. Nováček';
  }

  deadPersons.pop(); // pop last person who has record
  deaths = [...deaths, Death];
  sqlInsert('Death', Death);
}

/**********************Generate Marriage document collection for MongoDB**********************/

let marriageDocuments = [];

console.log('Marriages map', new Date());
marriages.map(marriageRecord => {
  /********* Death Record attributes *********/
  let marriageDoc = {...marriageRecord};

  /********* ENTITIES connected to Death Record *********/

  /********* Register *********/
  marriageDoc.register = {...registers.find(reg => reg._id_register === marriageRecord.register_id)};

  /********* User *********/
  marriageDoc.user = {...users.find(usr => usr._id_user === marriageRecord.user_id)};

  /********* Officiant *********/
  marriageDoc.officiant = {...officiants.find(dir => dir._id_officiant === marriageRecord.officiant_id)};

  const officiantNameRefs = officiantNames
    .filter(officiantName => officiantName.officiant_id === marriageRecord.officiant_id)
    .map(officiantName => officiantName.name_id);

  if (officiantNameRefs.length > 0) {
    marriageDoc.officiant.name = [];
    officiantNameRefs.map(ref => {
      const officiantName = allNames.find(name => name._id_name === ref);
      marriageDoc.officiant.name = [...marriageDoc.officiant.name, officiantName.name];
    });
  }

  /********* Witnesses *********/
  const marriageWitnesses = witnesses
    .filter(witness => witness.marriage_id === marriageRecord._id_marriage);

  if (marriageWitnesses.length > 0) {
    marriageDoc.witnesses = [];

    // Fill each witness entity (object) into array
    marriageWitnesses.map(witness => {
      const witnessNameRefs = personNames
        .filter(personName => personName.person_id === witness.person_id)
        .map(personName => personName.name_id);

      if (witnessNameRefs.length > 0) {
        witness.name = [];
        witnessNameRefs.map(ref => {
          const witnessName = allNames.find(name => name._id_name === ref);
          witness.name = [...witness.name, witnessName.name];
        });
      }

      // Witness occupations entities
      const witnessOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === witness.person_id)
        .map(personOccup => personOccup.occup_id);

      if (witnessOccupRefs.length > 0) {
        witness.occupations = [];

        witnessOccupRefs.map(ref => {
          const witnessOccupation = occupations.find(occup => occup._id_occup === ref);
          witness.occupations = [...witness.occupations, witnessOccupation.name];
        });
      }

      const witnessPersonEntity = {...persons.find(person => person._id_person === witness.person_id)};

      // Remove redundant ids used for Relational db foreign keys
      delete witnessPersonEntity['father_id'];
      delete witnessPersonEntity['mother_id'];

      delete witness['marriage_id'];
      delete witness['person_id'];
      witness = {...witness, ...witnessPersonEntity}; // attributes from Witness entity + Person entity

      marriageDoc.witnesses = [...marriageDoc.witnesses, witness];
    });
  }

  /********* Groom & connected entities (parents) *********/
  marriageDoc.groom = {...persons.find(person => person._id_person === marriageRecord.groom_id)};

  const groomNameRefs = personNames
    .filter(personName => personName.person_id === marriageRecord.groom_id)
    .map(personName => personName.name_id);


  if (groomNameRefs.length > 0) {
    marriageDoc.groom.name = [];
    groomNameRefs.map(ref => {
      const groomName = allNames.find(name => name._id_name === ref);
      marriageDoc.groom.name = [...marriageDoc.groom.name, groomName.name];
    });
  }

  // Person occupations entities
  const groomOccupRefs = personOccupations
    .filter(personOccup => personOccup.person_id === marriageRecord.groom_id)
    .map(personOccup => personOccup.occup_id);

  if (groomOccupRefs.length > 0) {
    marriageDoc.groom.occupations = [];

    groomOccupRefs.map(ref => {
      const occupation = occupations.find(occup => occup._id_occup === ref);
      marriageDoc.groom.occupations = [...marriageDoc.groom.occupations, occupation.name];
    });
  }

  /********* Groom's Father *********/
  if (marriageDoc.groom && marriageDoc.groom.father_id) {
    marriageDoc.groom.father = {...persons.find(person => person._id_person === marriageDoc.groom.father_id)};

    if (marriageDoc.groom.father) {
      const groomFatherNameRefs = personNames
        .filter(personName => personName.person_id === marriageDoc.groom.father._id_person)
        .map(personName => personName.name_id);

      if (groomFatherNameRefs.length > 0) {
        marriageDoc.groom.father.name = [];
        groomFatherNameRefs.map(ref => {
          const groomFatherName = allNames.find(name => name._id_name === ref);
          marriageDoc.groom.father.name = [...marriageDoc.groom.father.name, groomFatherName.name];
        });
      }

      // Father occupations entities
      const fatherOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === marriageDoc.groom.father._id_person)
        .map(personOccup => personOccup.occup_id);

      if (fatherOccupRefs.length > 0) {
        marriageDoc.groom.father.occupations = [];

        fatherOccupRefs.map(ref => {
          const occupation = occupations.find(occup => occup._id_occup === ref);
          marriageDoc.groom.father.occupations = [...marriageDoc.groom.father.occupations, occupation.name];
        });
      }
    }
  }

  /********* Groom's Mother *********/
  if (marriageDoc.groom && marriageDoc.groom.mother_id) {
    marriageDoc.groom.mother = {...persons.find(person => person._id_person === marriageDoc.groom.mother_id)};

    if (marriageDoc.groom.mother) {
      const groomMotherNameRefs = personNames
        .filter(personName => personName.person_id === marriageDoc.groom.mother._id_person)
        .map(personName => personName.name_id);

      if (groomMotherNameRefs.length > 0) {
        marriageDoc.groom.mother.name = [];
        groomMotherNameRefs.map(ref => {
          const groomMotherName = allNames.find(name => name._id_name === ref);
          marriageDoc.groom.mother.name = [...marriageDoc.groom.mother.name, groomMotherName.name];
        });
      }

      // Father occupations entities
      const motherOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === marriageDoc.groom.mother._id_person)
        .map(personOccup => personOccup.occup_id);

      if (motherOccupRefs.length > 0) {
        marriageDoc.groom.mother.occupations = [];

        motherOccupRefs.map(ref => {
          const occupation = occupations.find(occup => occup._id_occup === ref);
          marriageDoc.groom.mother.occupations = [...marriageDoc.groom.mother.occupations, occupation.name];
        });
      }
    }
  }

  /********* Bride & connected entities (parents) *********/

  marriageDoc.bride = {...persons.find(person => person._id_person === marriageRecord.bride_id)};

  const brideNameRefs = personNames
    .filter(personName => personName.person_id === marriageRecord.bride_id)
    .map(personName => personName.name_id);

  if (brideNameRefs.length > 0) {
    marriageDoc.bride.name = [];
    brideNameRefs.map(ref => {
      const brideName = allNames.find(name => name._id_name === ref);
      marriageDoc.bride.name = [...marriageDoc.bride.name, brideName.name];
    });
  }

  // Person occupations entities
  const brideOccupRefs = personOccupations
    .filter(personOccup => personOccup.person_id === marriageRecord.bride_id)
    .map(personOccup => personOccup.occup_id);

  if (brideOccupRefs.length > 0) {
    marriageDoc.bride.occupations = [];

    brideOccupRefs.map(ref => {
      const occupation = occupations.find(occup => occup._id_occup === ref);
      marriageDoc.bride.occupations = [...marriageDoc.bride.occupations, occupation.name];
    });
  }

  /********* Bride's Father *********/
  if (marriageDoc.bride && marriageDoc.bride.father_id) {
    marriageDoc.bride.father = {...persons.find(person => person._id_person === marriageDoc.bride.father_id)};

    if (marriageDoc.bride.father) {
      const brideFatherNameRefs = personNames
        .filter(personName => personName.person_id === marriageDoc.bride.father._id_person)
        .map(personName => personName.name_id);

      if (brideFatherNameRefs.length > 0) {
        marriageDoc.bride.father.name = [];
        brideFatherNameRefs.map(ref => {
          const brideFatherName = allNames.find(name => name._id_name === ref);
          marriageDoc.bride.father.name = [...marriageDoc.bride.father.name, brideFatherName.name];
        });
      }

      // Father occupations entities
      const fatherOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === marriageDoc.bride.father._id_person)
        .map(personOccup => personOccup.occup_id);

      if (fatherOccupRefs.length > 0) {
        marriageDoc.bride.father.occupations = [];

        fatherOccupRefs.map(ref => {
          const occupation = occupations.find(occup => occup._id_occup === ref);
          marriageDoc.bride.father.occupations = [...marriageDoc.bride.father.occupations, occupation.name];
        });
      }
    }
  }

  /********* Bride's Mother *********/
  if (marriageDoc.mother && marriageDoc.mother.mother_id) {
    marriageDoc.bride.mother = {...persons.find(person => person._id_person === marriageDoc.mother.mother_id)};

    if (marriageDoc.bride.mother) {
      const brideMotherNameRefs = personNames
        .filter(personName => personName.person_id === marriageDoc.bride.mother._id_person)
        .map(personName => personName.name_id);

      if (brideMotherNameRefs.length > 0) {
        marriageDoc.bride.mother.name = [];
        brideMotherNameRefs.map(ref => {
          const brideMotherName = allNames.find(name => name._id_name === ref);
          marriageDoc.bride.mother.name = [...marriageDoc.bride.mother.name, brideMotherName.name];
        });
      }

      // Mother occupations entities
      const motherOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === marriageDoc.bride.mother._id_person)
        .map(personOccup => personOccup.occup_id);

      if (motherOccupRefs.length > 0) {
        marriageDoc.bride.mother.occupations = [];

        motherOccupRefs.map(ref => {
          const occupation = occupations.find(occup => occup._id_occup === ref);
          marriageDoc.bride.mother.occupations = [...marriageDoc.bride.mother.occupations, occupation.name];
        });
      }
    }
  }

  // Remove redundant ids used for Relational db foreign keys
  // and _id_marriage because it will be replaced by _id index (ObjectId) in MongoDB
  delete marriageDoc['_id_marriage'];
  delete marriageDoc['groom_id'];
  delete marriageDoc['bride_id'];
  delete marriageDoc['user_id'];
  delete marriageDoc['register_id'];
  delete marriageDoc['officiant_id'];

  delete marriageDoc.groom['father_id'];
  delete marriageDoc.groom['mother_id'];
  delete marriageDoc.bride['father_id'];
  delete marriageDoc.bride['mother_id'];


  marriageDocuments = [...marriageDocuments, marriageDoc];
});


/**********************Generate Death document collection for MongoDB**********************/

let deathDocuments = [];

console.log('Deaths map', new Date());
deaths.map(deathRecord => {
  /********* Death Record attributes *********/
  let deathDoc = {...deathRecord};

  /********* ENTITIES connected to Death Record *********/

  /********* Register *********/
  deathDoc.register = {...registers.find(reg => reg._id_register === deathRecord.register_id)};

  /********* User *********/
  deathDoc.user = {...users.find(usr => usr._id_user === deathRecord.user_id)};

  /********* Director *********/
  deathDoc.director = {...directors.find(dir => dir._id_director === deathRecord.director_id)};

  const directorNameRefs = directorNames
    .filter(dirName => dirName.director_id === deathRecord.director_id)
    .map(dirName => dirName.name_id);

  if (directorNameRefs.length > 0) {
    deathDoc.director.name = [];
    directorNameRefs.map(ref => {
      const directorName = allNames.find(name => name._id_name === ref);
      deathDoc.director.name = [...deathDoc.director.name, directorName.name];
    });
  }

  /********* Celebrant *********/
  deathDoc.celebrant = {...celebrants.find(cel => cel._id_celebrant === deathRecord.celebrant_id)};

  const celebrantNameRefs = celebrantNames
    .filter(celName => celName.celebrant_id === deathRecord.celebrant_id)
    .map(celName => celName.name_id);

  if (celebrantNameRefs.length > 0) {
    deathDoc.celebrant.name = [];
    celebrantNameRefs.map(ref => {
      const celebrantName = allNames.find(name => name._id_name === ref);
      deathDoc.celebrant.name = [...deathDoc.celebrant.name, celebrantName.name];
    });
  }

  /********* Dead person & connected entities (parents, bride/groom, kids) *********/
  deathDoc.person = {...persons.find(person => person._id_person === deathRecord.person_id)};

  // Person names entities
  const personNameRefs = personNames
    .filter(personName => personName.person_id === deathRecord.person_id)
    .map(personName => personName.name_id);

  if (personNameRefs.length > 0) {
    deathDoc.person.name = [];
    personNameRefs.map(ref => {
      const personName = allNames.find(name => name._id_name === ref);
      deathDoc.person.name = [...deathDoc.person.name, personName.name];
    });
  }

  // Person occupations entities
  const personOccupRefs = personOccupations
    .filter(personOccup => personOccup.person_id === deathRecord.person_id)
    .map(personOccup => personOccup.occup_id);

  if (personOccupRefs.length > 0) {
    deathDoc.person.occupations = [];

    personOccupRefs.map(ref => {
      const occupation = occupations.find(occup => occup._id_occup === ref);
      deathDoc.person.occupations = [...deathDoc.person.occupations, occupation.name];
    });
  }

  /********* Dead person's Father *********/
  deathDoc.father = {...persons.find(person => person._id_person === deathDoc.person.father_id)};

  if (deathDoc.father) {
    const fatherNameRefs = personNames
      .filter(personName => personName.person_id === deathDoc.father._id_person)
      .map(personName => personName.name_id);

    // Father names entities
    if (fatherNameRefs.length > 0) {
      deathDoc.father.name = [];
      fatherNameRefs.map(ref => {
        const fatherName = allNames.find(name => name._id_name === ref);
        deathDoc.father.name = [...deathDoc.father.name, fatherName.name];
      });
    }

    // Father occupations entities
    const fatherOccupRefs = personOccupations
      .filter(personOccup => personOccup.person_id === deathDoc.father._id_person)
      .map(personOccup => personOccup.occup_id);

    if (fatherOccupRefs.length > 0) {
      deathDoc.father.occupations = [];

      fatherOccupRefs.map(ref => {
        const occupation = occupations.find(occup => occup._id_occup === ref);
        deathDoc.father.occupations = [...deathDoc.father.occupations, occupation.name];
      });
    }
  }

  /********* Dead person's Mother *********/
  deathDoc.mother = {...persons.find(person => person._id_person === deathDoc.person.mother_id)};

  if (deathDoc.mother) {
    const motherNameRefs = personNames
      .filter(personName => personName.person_id === deathDoc.mother._id_person)
      .map(personName => personName.name_id);

    if (motherNameRefs.length > 0) {
      deathDoc.mother.name = [];
      motherNameRefs.map(ref => {
        const motherName = allNames.find(name => name._id_name === ref);
        deathDoc.mother.name = [...deathDoc.mother.name, motherName.name];
      });
    }

    // Mother occupations entities
    const motherOccupRefs = personOccupations
      .filter(personOccup => personOccup.person_id === deathDoc.mother._id_person)
      .map(personOccup => personOccup.occup_id);

    if (motherOccupRefs.length > 0) {
      deathDoc.mother.occupations = [];

      motherOccupRefs.map(ref => {
        const occupation = occupations.find(occup => occup._id_occup === ref);
        deathDoc.mother.occupations = [...deathDoc.mother.occupations, occupation.name];
      });
    }
  }

  /********* Dead person's Bride or Groom (if person was married) *********/

  // if is married
  if (!!marriages.find(mar => mar.groom_id === deathRecord.person_id) || !!marriages.find(mar => mar.bride_id === deathRecord.person_id)
  ) {
    const brideGroomId = deathDoc.person.sex === 'muž'
      ? marriages.find(mar => mar.groom_id === deathRecord.person_id).bride_id
      : marriages.find(mar => mar.bride_id === deathRecord.person_id).groom_id;

    deathDoc.bride_groom = {...persons.find(person => person._id_person === brideGroomId)};

    if (deathDoc.bride_groom) {
      const brideGroomNameRefs = personNames
        .filter(personName => personName.person_id === brideGroomId)
        .map(personName => personName.name_id);

      if (brideGroomNameRefs.length > 0) {
        deathDoc.bride_groom.name = [];
        brideGroomNameRefs.map(ref => {
          const brideGroomName = allNames.find(name => name._id_name === ref);
          deathDoc.bride_groom.name = [...deathDoc.bride_groom.name, brideGroomName.name];
        });
      }

      // Bride/groom occupations entities
      const brideGroomOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === brideGroomId)
        .map(personOccup => personOccup.occup_id);

      if (brideGroomOccupRefs.length > 0) {
        deathDoc.bride_groom.occupations = [];

        brideGroomOccupRefs.map(ref => {
          const occupation = occupations.find(occup => occup._id_occup === ref);
          deathDoc.bride_groom.occupations = [...deathDoc.bride_groom.occupations, occupation.name];
        });
      }
    }
  }

  /********* // Dead person's kids (if has some) *********/
  const personKids = persons
    .filter(person => person.father_id === deathDoc.person._id_person || person.mother_id === deathDoc.person._id_person);

  if (personKids.length > 0) {
    deathDoc.kids = [];

    // Fill each kid entity (object) into array
    personKids.map(
      kid => {
        const kidNameRefs = personNames
          .filter(personName => personName.person_id === kid._id_person)
          .map(personName => personName.name_id);

        if (kidNameRefs.length > 0) {
          kid.name = [];
          kidNameRefs.map(ref => {
            const kidName = allNames.find(name => name._id_name === ref);
            kid.name = [...kid.name, kidName.name];
          });
        }

        // Kid occupations entities
        const kidOccupRefs = personOccupations
          .filter(personOccup => personOccup.person_id === kid._id_person)
          .map(personOccup => personOccup.occup_id);

        if (kidOccupRefs.length > 0) {
          kid.occupations = [];

          kidOccupRefs.map(ref => {
            const kidOccupation = occupations.find(occup => occup._id_occup === ref);
            kid.occupations = [...kid.occupations, kidOccupation.name];
          });
        }

        // Remove redundant ids used for Relational db foreign keys
        delete kid['father_id'];
        delete kid['mother_id'];

        deathDoc.kids = [...deathDoc.kids, kid];
      }
    );
  }

  // Remove redundant ids used for Relational db foreign keys
  // and _id_death because it will be replaced by _id index (ObjectId) in MongoDB
  delete deathDoc['_id_death'];
  delete deathDoc['person_id'];
  delete deathDoc['user_id'];
  delete deathDoc['register_id'];
  delete deathDoc['director_id'];
  delete deathDoc['celebrant_id'];

  delete deathDoc.person['father_id'];
  delete deathDoc.person['mother_id'];

  if (deathDoc.bride_groom) {
    delete deathDoc.bride_groom['father_id'];
    delete deathDoc.bride_groom['mother_id'];
  }

  deathDocuments = [...deathDocuments, deathDoc];
});

// NOTE: MAX 64 INDEXES SUPPORTED PER COLLECTION
// - index only those attributes that will be potentially queried
const marriageDocIndexes = [
  // {name: "rec_ready", key: {"rec_ready": 1}},
  // {name: "rec_order", key: {"rec_order": 1}},
  // {name: "scan_order", key: {"scan_order": 1}},
  // {name: "scan_layout", key: {"scan_layout": 1}},
  {name: "date", key: {"date": 1}},
  {name: "village", key: {"village": 1}},
  {name: "groom_y", key: {"groom_y": 1}},
  // {name: "groom_m", key: {"groom_m": 1}},
  // {name: "groom_d", key: {"groom_d": 1}},
  {name: "bride_y", key: {"bride_y": 1}},
  // {name: "bride_m", key: {"bride_m": 1}},
  // {name: "bride_d", key: {"bride_d": 1}},
  // {name: "groom_adult", key: {"groom_adult": 1}},
  // {name: "bride_adult", key: {"bride_adult": 1}},
  {name: "relationship", key: {"relationship": 1}},
  {name: "banns_1", key: {"banns_1": 1}},
  {name: "banns_2", key: {"banns_2": 1}},
  {name: "banns_3", key: {"banns_3": 1}},
  {name: "register._id_register", key: {"register._id_register": 1}},
  // {name: "register.archive", key: {"register.archive": 1}},
  // {name: "register.fond", key: {"register.fond": 1}},
  {name: "register.signature", key: {"register.signature": 1}},
  {name: "user._id_user", key: {"user._id_user": 1}},
  // {name: "user.name", key: {"user.name": 1}},
  {name: "officiant._id_officiant", key: {"officiant._id_officiant": 1}},
  // {name: "officiant.name", key: {"officiant.name": 1}},
  // {name: "officiant.surname", key: {"officiant.surname": 1}},
  // {name: "officiant.title", key: {"officiant.title": 1}},
  {name: "witnesses._id_person", key: {"witnesses._id_person": 1}},
  // {name: "witnesses.side", key: {"witnesses.side": 1}},
  {name: "witnesses.relationship", key: {"witnesses.relationship": 1}},
  // {name: "witnesses.name", key: {"witnesses.name": 1}},
  // {name: "witnesses.surname", key: {"witnesses.surname": 1}},
  {name: "witnesses.village", key: {"witnesses.village": 1}},
  // {name: "witnesses.occupations", key: {"witnesses.occupations": 1}},
  // {name: "witnesses.sex", key: {"witnesses.sex": 1}},
  // {name: "witnesses.birth", key: {"witnesses.birth": 1}},
  {name: "witnesses.religion", key: {"witnesses.religion": 1}},
  {name: "groom._id_person", key: {"groom._id_person": 1}},
  {name: "groom.name", key: {"groom.name": 1}},
  {name: "groom.surname", key: {"groom.surname": 1}},
  {name: "groom.village", key: {"groom.village": 1}},
  // {name: "groom.street", key: {"groom.street": 1}},
  // {name: "groom.descr", key: {"groom.descr": 1}},
  {name: "groom.occupations", key: {"groom.occupations": 1}},
  {name: "groom.birth", key: {"groom.birth": 1}},
  {name: "groom.religion", key: {"groom.religion": 1}},
  {name: "groom.father._id_person", key: {"groom.father._id_person": 1}},
  // {name: "groom.father.name", key: {"groom.father.name": 1}},
  // {name: "groom.father.surname", key: {"groom.father.surname": 1}},
  // {name: "groom.father.village", key: {"groom.father.village": 1}},
  // {name: "groom.father.occupations", key: {"groom.father.occupations": 1}},
  // {name: "groom.father.birth", key: {"groom.father.birth": 1}},
  // {name: "groom.father.religion", key: {"groom.father.religion": 1}},
  {name: "groom.mother._id_person", key: {"groom.mother._id_person": 1}},
  // {name: "groom.mother.name", key: {"groom.mother.name": 1}},
  // {name: "groom.mother.surname", key: {"groom.mother.surname": 1}},
  // {name: "groom.mother.village", key: {"groom.mother.village": 1}},
  // {name: "groom.mother.occupations", key: {"groom.mother.occupations": 1}},
  // {name: "groom.mother.birth", key: {"groom.mother.birth": 1}},
  // {name: "groom.mother.religion", key: {"groom.mother.religion": 1}},
  {name: "bride._id_person", key: {"bride._id_person": 1}},
  {name: "bride.name", key: {"bride.name": 1}},
  {name: "bride.surname", key: {"bride.surname": 1}},
  {name: "bride.village", key: {"bride.village": 1}},
  // {name: "bride.street", key: {"bride.street": 1}},
  // {name: "bride.descr", key: {"bride.descr": 1}},
  {name: "bride.occupations", key: {"bride.occupations": 1}},
  {name: "bride.birth", key: {"bride.birth": 1}},
  {name: "bride.religion", key: {"bride.religion": 1}},
  {name: "bride.father._id_person", key: {"bride.father._id_person": 1}},
  // {name: "bride.father.name", key: {"bride.father.name": 1}},
  // {name: "bride.father.surname", key: {"bride.father.surname": 1}},
  // {name: "bride.father.village", key: {"bride.father.village": 1}},
  // {name: "bride.father.occupations", key: {"bride.father.occupations": 1}},
  // {name: "bride.father.birth", key: {"bride.father.birth": 1}},
  {name: "bride.mother._id_person", key: {"bride.mother._id_person": 1}},
  // {name: "bride.mother.name", key: {"bride.mother.name": 1}},
  // {name: "bride.mother.surname", key: {"bride.mother.surname": 1}},
  // {name: "bride.mother.village", key: {"bride.mother.village": 1}},
  // {name: "bride.mother.occupations", key: {"bride.mother.occupations": 1}},
  // {name: "bride.mother.birth", key: {"bride.mother.birth": 1}},
  // {name: "bride.mother.religion", key: {"bride.mother.religion": 1}},
];

// NOTE: MAX 64 INDEXES SUPPORTED PER COLLECTION
// - index only those attributes that will be potentially queried
const deathDocIndexes = [
  // {name: "rec_ready", key: {"rec_ready": 1}},
  // {name: "rec_order", key: {"rec_order": 1}},
  // {name: "scan_order", key: {"scan_order": 1}},
  // {name: "scan_layout", key: {"scan_layout": 1}},
  {name: "death_village", key: {"death_village": 1}},
  // {name: "death_street", key: {"death_street": 1}},
  // {name: "death_descr", key: {"death_descr": 1}},
  {name: "place_funeral", key: {"place_funeral": 1}},
  {name: "widowed", key: {"widowed": 1}},
  {name: "age_y", key: {"age_y": 1}}, // create only index for years - should be enough for queries (possibility of compound index instead)
  // {name: "age_m", key: {"age_m": 1}},
  // {name: "age_d", key: {"age_d": 1}},
  // {name: "age_h", key: {"age_h": 1}},
  {name: "inspection", key: {"inspection": 1}},
  // {name: "inspection_by", key: {"inspection_by": 1}},
  {name: "death_cause", key: {"death_cause": 1}},
  {name: "death_date", key: {"death_date": 1}},
  {name: "funeral_date", key: {"funeral_date": 1}},
  {name: "provision_date", key: {"provision_date": 1}},
  {name: "place_death", key: {"place_death": 1}},
  // {name: "notes", key: {"notes": 1}},
  {name: "register._id_register", key: {"register._id_register": 1}},
  // {name: "register.archive", key: {"register.archive": 1}},
  // {name: "register.fond", key: {"register.fond": 1}},
  {name: "register.signature", key: {"register.signature": 1}},
  {name: "user._id_user", key: {"user._id_user": 1}},
  // {name: "user.name", key: {"user.name": 1}},
  {name: "director._id_director", key: {"director._id_director": 1}},
  // {name: "director.name", key: {"director.name": 1}},
  // {name: "director.surname", key: {"director.surname": 1}},
  // {name: "director.title", key: {"director.title": 1}},
  {name: "celebrant._id_celebrant", key: {"celebrant._id_celebrant": 1}},
  // {name: "celebrant.name", key: {"celebrant.name": 1}},
  // {name: "celebrant.surname", key: {"celebrant.surname": 1}},
  // {name: "celebrant.title_occup", key: {"celebrant.title_occup": 1}},
  {name: "person._id_person", key: {"person._id_person": 1}},
  {name: "person.name", key: {"person.name": 1}},
  {name: "person.surname", key: {"person.surname": 1}},
  {name: "person.village", key: {"person.village": 1}},
  // {name: "person.street", key: {"person.street": 1}},
  // {name: "person.descr", key: {"person.descr": 1}},
  {name: "person.birth", key: {"person.birth": 1}},
  {name: "person.sex", key: {"person.sex": 1}},
  {name: "person.religion", key: {"person.religion": 1}},
  {name: "person.occupations", key: {"person.occupations": 1}},
  {name: "father._id_person", key: {"father._id_person": 1}},
  // {name: "father.name", key: {"father.name": 1}},
  // {name: "father.surname", key: {"father.surname": 1}},
  // {name: "father.birth", key: {"father.birth": 1}},
  {name: "father.village", key: {"father.village": 1}},
  {name: "father.religion", key: {"father.religion": 1}},
  // {name: "father.occupations", key: {"father.occupations": 1}},
  {name: "mother._id_person", key: {"mother._id_person": 1}},
  // {name: "mother.name", key: {"mother.name": 1}},
  // {name: "mother.surname", key: {"mother.surname": 1}},
  // {name: "mother.birth", key: {"mother.birth": 1}},
  {name: "mother.village", key: {"mother.village": 1}},
  {name: "mother.religion", key: {"mother.religion": 1}},
  // {name: "mother.occupations", key: {"mother.occupations": 1}},
  {name: "bride_groom._id_person", key: {"bride_groom._id_person": 1}},
  {name: "bride_groom.name", key: {"bride_groom.name": 1}},
  {name: "bride_groom.surname", key: {"bride_groom.surname": 1}},
  {name: "bride_groom.village", key: {"bride_groom.village": 1}},
  {name: "bride_groom.religion", key: {"bride_groom.religion": 1}},
  {name: "bride_groom.occupations", key: {"bride_groom.occupations": 1}},
  {name: "kids._id_person", key: {"kids._id_person": 1}},
  {name: "kids.name", key: {"kids.name": 1}},
  {name: "kids.surname", key: {"kids.surname": 1}},
  {name: "kids.birth", key: {"kids.birth": 1}},
  {name: "kids.sex", key: {"kids.sex": 1}},
  // {name: "kids.village", key: {"kids.village": 1}},
  {name: "kids.religion", key: {"kids.religion": 1}},
  // {name: "kids.occupations", key: {"kids.occupations": 1}},
];

// save finish time of data generating
const finishedGeneratingAt = new Date();

const insertDeathDocuments = function(db, callback) {
  // Insert some documents
  const insertStart = new Date();
  db.collection('deaths').insertMany(deathDocuments, function(err, result) {
    console.log(
      `MongoDB: ${deathDocuments.length} documents inserted in ${dateFns.differenceInMilliseconds(new Date(), insertStart)}ms`
    );
    assert.equal(err, null);
    assert.equal(deathDocuments.length, result.insertedCount);
    console.log(`MongoDB: Inserted ${deathDocuments.length} documents into the deaths collection`);
    callback(result);
  });
};

const indexDeathsCollection = function(db, callback) {
  db.collection('deaths').createIndexes(
    deathDocIndexes,
    null,
    function(err, results) {
      console.log('MongoDB: created deaths collection indexes:', results);
      callback();
    }
  );
};

const insertMarriageDocuments = function(db, callback) {
  // Insert some documents
  const insertStart = new Date();
  db.collection('marriages').insertMany(marriageDocuments, function(err, result) {
    console.log(
      `MongoDB: ${marriageDocuments.length} documents inserted in ${dateFns.differenceInMilliseconds(new Date(), insertStart)}ms`
    );
    assert.equal(err, null);
    assert.equal(marriageDocuments.length, result.insertedCount);
    console.log(`MongoDB: Inserted ${marriageDocuments.length} documents into the marriages collection`);
    callback(result);
  });
};

const indexMarriagesCollection = function(db, callback) {
  db.collection('marriages').createIndexes(
    marriageDocIndexes,
    null,
    function(err, results) {
      console.log('MongoDB: created marriages collection indexes:', results);
      callback();
    }
  );
};


/*** Insert new testing dataset into MongoDB database ***/

// Connection URL for MongoDB
const mongodbServerUrl = 'mongodb://localhost:27017';

// Database Name
const mongodbName = 'test';

// Use connect method to connect to the server and fill deaths collection
MongoClient.connect(mongodbServerUrl, { useNewUrlParser: true }, function(err, client) {
  assert.equal(null, err);
  console.log("MongoDB: Connected successfully to server");

  const db = client.db(mongodbName);

  db.dropCollection('deaths'); // drop deaths collection if already exists

  insertDeathDocuments(db, function() {
    if (createIndexes === true || createIndexes === 'true') {
      indexDeathsCollection(db, function() {
        client.close();
      });
    } else {
      client.close();
    }
  });
});

// Use connect method to connect to the server and fill marriages collection
MongoClient.connect(mongodbServerUrl, { useNewUrlParser: true }, function(err, client) {
  assert.equal(null, err);
  console.log("MongoDB: Connected successfully to server");

  const db = client.db(mongodbName);

  db.dropCollection('marriages'); // drop marriages collection if already exists

  insertMarriageDocuments(db, function() {
    if (createIndexes === true || createIndexes === 'true') {
      indexMarriagesCollection(db, function() {
        client.close();
      });
    } else {
      client.close();
    }
  });
});

/*** Insert new testing dataset into PostgreSQL database ***/

fs.readFile(
  POSTGRES_TABLES,
  'UTF-8',
  (err, tablesToCreate) => {
    if (err) {
      console.log('ERROR at PostgreSQL: occurred while reading tables file!', err);
    } else {
      const { Client } = require('pg');

      const postgresClient = new Client(POSTGRES_CREDENTIALS);

      postgresClient.connect((err) => {
        if (err) {
          console.error('ERROR at PostgreSQL: connection error', err.stack);
        } else {
          console.log('PostgreSQL: connected to server');
        }
      });

      // at first drop all tables from previous testing
      postgresClient.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;`)
        .then(() => {
          console.log('PostgreSQL: succesfully dropped old data!');

          // create tables again
          postgresClient.query(tablesToCreate)
            .then(() => {
              console.log('PostgreSQL: succesfully created all tables!');
              // insert new data into postgres database
              const allInsertsCount =
                celebrants.length + celebrantNames.length + deaths.length + directors.length
                + directorNames.length + marriages.length + allNames.length + occupations.length
                + officiants.length + officiantNames.length + persons.length + personNames.length
                + personOccupations.length + registers.length + users.length + witnesses.length;
              const insertStart = new Date();
              postgresClient.query(sqlInserts)
                .then(() => {
                  console.log(
                    `PostgreSQL: ${allInsertsCount} records inserted in ${dateFns.differenceInMilliseconds(new Date(), insertStart)}ms`
                  );
                  console.log('PostgreSQL: succesfully inserted new testing dataset!');
                  console.log('PostgreSQL: disconnecting...');
                  postgresClient.end(); // end connection after everything inserted correctly
                })
                .catch(e => {
                  console.error('ERROR at PostgreSQL: inserting data into table!', e.stack);
                  postgresClient.end();
                });
            })
            .catch(e => {
              console.error('ERROR at PostgreSQL: recreating tables!', e.stack);
              postgresClient.end();
            });
        })
        .catch(e => {
          console.error('ERROR at PostgreSQL: dropping all tables!', e.stack);
          postgresClient.end();
        });
    }
  }
);

console.log('---------------SUMMARY---------------');
console.log('Marriage records count: ', marriages.length);
console.log('Death records count: ', deaths.length);
console.log('Person records count: ', persons.length);
console.log('Finished at: ', finishedGeneratingAt);
console.log(`TIME TO GENERATE ALL RECORDS AND DOCUMENTS: ${dateFns.differenceInMilliseconds(new Date(), startedGeneratingAt)}ms`, );
