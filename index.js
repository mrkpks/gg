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

// Node.js File System (to write into output files)
// https://nodejs.org/api/fs.html
const fs = require('fs');

// Package for generating random names for Users + street & descr numbers for Persons
// https://www.npmjs.com/package/faker
const faker = require('faker');

// Library for working with dates (adding, subtracting)
// https://date-fns.org/
const dateFns = require('date-fns');

// Package for random date from interval of 2 dates
// https://www.npmjs.com/package/randomdate
const randomDate = require('randomdate');

// Deep copy of nested objects
// https://www.npmjs.com/package/deepcopy
const deepcopy = require('deepcopy');

// MongoDB Node.JS Driver
// http://mongodb.github.io/node-mongodb-native/3.1/api/
const MongoClient = require('mongodb').MongoClient;

const assert = require('assert'); // for testing connections

// TODO discuss which should be used as optional arguments

/*** Editable constants for modifying generated output ***/
const usersCount = 2;
const archivesCount = 3; // number of generated unique archives
const fondsCount = 5; // number of generated unique fonds inside an archive
const signaturesCount = 15; // number of generated unique signatures inside of an archive fond

const villagesCount = Math.min(VILLAGES.length, 15); // 15->arg?

const desiredMarriageRecordsCount = 10;
const computedDeathRecordsCount = desiredMarriageRecordsCount * 2;

/*** IMPORTANT NOTE: ALL PERSONS -> not only brides + grooms + dead persons!! counting also parents and kids ***/
// Number of unique persons
// Due to randomness of generated kids + generating parents ratio of deaths & marriages to persons varies!
// Ratio of persons to deaths is approx. 4:1
// Ratio of persons to marriages is approx. 8:1
// can get to +2 to +6 due to kids and parents
const personsCount = desiredMarriageRecordsCount * 8;
const occupationsCount = Math.min(PERSON_OCCUPATIONS.length, 50); // number of unique occupations

const directorsCount = 3; // number of unique funeral directors ("Zaopatrovatel")
const celebrantsCount = 3; // number of unique funeral celebrants ("Pohrbivajici")
const officiantsCount = 3; // number of unique marriage officiants ("Oddavajici")

const SQL_OUTPUT_FILE = 'postgres/inserts.sql'; // Usable for any SQL database
const MONGO_OUTPUT_FILE = 'mongodb/mongo.inserts.js';

faker.locale = 'cz'; // set locale of helper package for generating streets of persons and names of users

// Creates a SQL INSERT command to fill Postgres database
// Appended output is written inside SQL_OUTPUT_FILE
function sqlInsert(entityName, entity) {
  let columns = Object.keys(entity);

  let values = Object.values(entity).map(value => isNaN(value) ? `'${value}'` : value);

  fs.appendFileSync(
    SQL_OUTPUT_FILE,
    `INSERT INTO "${entityName}" (${columns}) VALUES (${values});\n`,
    'UTF-8',
    {'flags': 'a+'}
  );
}

// Creates a db.<collection>.insert(<entity>) command to fill MongoDB database
// Appended output is written inside MONGO_OUTPUT_FILE
function mongoInsert(collection, entity) {
  fs.appendFileSync(
    MONGO_OUTPUT_FILE,
    `db.${collection}.insert(${JSON.stringify(entity)})\n`,
    'UTF-8',
    {'flags': 'a+'}
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

// create new output file if doesn't exist or rewrite to empty
fs.writeFileSync(SQL_OUTPUT_FILE, '');

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------User--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let users = [];

for (let i = 0; i < usersCount; i++) {
  const User = {
    _id_user: i,
    name: faker.fake("{{name.firstName}} {{name.lastName}}"),
  };

  users = [...users, User];
  sqlInsert('User', User);
}

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Register--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Name--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Occupation--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let occupations = [];

for (let i = 0; i < occupationsCount; i++) {
  const Occupation = {
    _id_occup: i,
    name: PERSON_OCCUPATIONS.map(occ => occ).sort(() => Math.random() - 0.5)[i],
  };

  occupations = [...occupations, Occupation];
  sqlInsert('Occupation', Occupation);
}

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Director--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------DirectorName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Celebrant--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------CelebrantName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Officiant--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------OfficiantName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Person--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const personManSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personManIndices = randomIndexFrom(personManSurnames.length);

const personWomanSurnames = SURNAMES_WOMEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personWomanIndices = randomIndexFrom(personWomanSurnames.length);

let persons = [];

const personVillageIndices = randomIndexFrom(villagesCount);

for (let i = 0; i < personsCount;) { // incrementing takes place inside cycle for each person

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------PersonName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------PersonOccupation--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Marriage--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let marriages = [];
let witnesses = [];

const officiantsIndices = randomIndexFrom(officiants.length);
const marriageRegistersIndices = randomIndexFrom(registers.length);
const marriageUsersIndices = randomIndexFrom(users.length);

const grooms = persons
  .filter(person => person.sex === 'muž' && person.mother_id && person.father_id)
  .sort(() => Math.random() - 0.5);

const brides = persons
  .filter(person => person.sex === 'žena' && person.mother_id && person.father_id)
  .sort(() => Math.random() - 0.5);

const groomIndices = randomIndexFrom(grooms.length);
const brideIndices = randomIndexFrom(brides.length);

// added 20% so some people will have more than 1 wedding records
for (let i = 0; i < Math.floor(brides.length * 1.2); i++) {
  const marriageVillageIndices = randomIndexFrom(villagesCount);

  const groom = grooms[groomIndices.next().value];

  // // in case of too few persons (mostly less than 50), there is a chance, that groom filter will return an empty array
  // // because there are only women generated with both parents
  if (groom === undefined) {
    console.log('Groom is not defined');
    break;
  }

  const bride = brides[brideIndices.next().value];

  // // in case of too few persons (mostly less than 50), there is a chance, that bride filter will return an empty array
  // // because there are only men generated with both parents or a woman with surname not suitable for marriage
  if (bride === undefined) {
    console.log('Bride is not defined');
    break;
  }

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

  // Generating witnesses for each marriage inside of its cycle
  fs.appendFileSync(
    SQL_OUTPUT_FILE,
    '--------------------------Witness--------------------------\n',
    'UTF-8',
    {'flags': 'a+'}
  );

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

fs.appendFileSync(
  SQL_OUTPUT_FILE,
  '--------------------------Death--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const celebrantsIndices = randomIndexFrom(celebrants.length);
const directorsIndices = randomIndexFrom(directors.length);
const deathRegistersIndices = randomIndexFrom(registers.length);
const deathUsersIndices = randomIndexFrom(users.length);
const deathCausesIndices = randomIndexFrom(DEATH_CAUSES.length);
let deaths = [];

// create a buffer to .pop() from, so no person has more than 1 death record
const deadPersons = persons.filter(person => person.mother_id && person.father_id);

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

// create output file if doesn't exist or rewrite to empty
fs.writeFileSync(MONGO_OUTPUT_FILE, '');

/**********************Generate Marriage document collection for MongoDB**********************/

let marriagesBuf = deepcopy(marriages);
let marriageDocuments = [];

marriagesBuf.map(marriageRecord => {
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

  marriageDoc.officiant.name = allNames.find(name => name._id_name === officiantNameRefs[0]).name;

  /********* Witnesses *********/
    // TODO: change data structure to store w/o side and add it inside bride/groom?

  const marriageWitnesses = witnesses
    .filter(witness => witness.marriage_id === marriageRecord._id_marriage);

  if (marriageWitnesses.length > 0) {
    marriageDoc.witnesses = [];

    // Fill each witness entity (object) into array
    marriageWitnesses.map(witness => {
      const witnessNameRefs = personNames
        .filter(personName => personName.person_id === witness.person_id)
        .map(personName => personName.name_id);

      // Witness names entities
      const witnessNameEntity = allNames.find(name => name._id_name === witnessNameRefs[0]);
      witness.name = witnessNameEntity ? witnessNameEntity.name : '';

      // For now only counting with max 2 names FIXME?
      if (witnessNameRefs.length === 2) {
        witness.middle_name = allNames.find(name => name._id_name === witnessNameRefs[1]).name;
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
      witness = {...witness, ...witnessPersonEntity}; // attributes from Witness entity + Person entity

      marriageDoc.witnesses = [...marriageDoc.witnesses, witness];
    });

    /********* Groom & connected entities (parents) *********/

    marriageDoc.groom = {...persons.find(person => person._id_person === marriageRecord.groom_id)};

    const groomNameRefs = personNames
      .filter(personName => personName.person_id === marriageRecord.groom_id)
      .map(personName => personName.name_id);

    // Person names entities
    const groomNameEntity = allNames.find(name => name._id_name === groomNameRefs[0]);
    marriageDoc.groom.name = groomNameEntity ? groomNameEntity.name : '';

    // For now only counting with max 2 names FIXME?
    if (groomNameRefs.length === 2) {
      marriageDoc.groom.middle_name = allNames.find(name => name._id_name === groomNameRefs[1]).name;
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
        const fatherNameRefs = personNames
          .filter(personName => personName.person_id === marriageDoc.groom.father._id_person)
          .map(personName => personName.name_id);

        // Father names entities
        const fatherNameEntity = allNames.find(name => name._id_name === fatherNameRefs[0]);
        marriageDoc.groom.father.name = fatherNameEntity ? fatherNameEntity.name : '';
        // marriageDoc.groom.father.name = allNames.find(name => name._id_name === fatherNameRefs[0]).name;

        // For now only counting with max 2 names FIXME?
        if (fatherNameRefs.length === 2) {
          marriageDoc.groom.father.middle_name = allNames.find(name => name._id_name === fatherNameRefs[1]).name;
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
        const motherNameRefs = personNames
          .filter(personName => personName.person_id === marriageDoc.groom.mother._id_person)
          .map(personName => personName.name_id);

        // Father names entities
        const motherNameEntity = allNames.find(name => name._id_name === motherNameRefs[0]);
        marriageDoc.groom.mother.name = motherNameEntity ? motherNameEntity.name : '';
        // marriageDoc.groom.mother.name = allNames.find(name => name._id_name === motherNameRefs[0]).name;

        // For now only counting with max 2 names FIXME?
        if (motherNameRefs.length === 2) {
          marriageDoc.groom.mother.middle_name = allNames.find(name => name._id_name === motherNameRefs[1]).name;
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
    // TODO add widow after entity :(

    marriageDoc.bride = {...persons.find(person => person._id_person === marriageRecord.bride_id)};

    const brideNameRefs = personNames
      .filter(personName => personName.person_id === marriageRecord.bride_id)
      .map(personName => personName.name_id);

    // Person names entities
    const brideNameEntity = allNames.find(name => name._id_name === brideNameRefs[0]);
    marriageDoc.bride.name = brideNameEntity ? brideNameEntity.name : '';

    // For now only counting with max 2 names FIXME?
    if (brideNameRefs.length === 2) {
      marriageDoc.bride.middle_name = allNames.find(name => name._id_name === brideNameRefs[1]).name;
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
        const fatherNameRefs = personNames
          .filter(personName => personName.person_id === marriageDoc.bride.father._id_person)
          .map(personName => personName.name_id);

        // Father names entities
        const fatherNameEntity = allNames.find(name => name._id_name === fatherNameRefs[0]);
        marriageDoc.bride.father.name = fatherNameEntity ? fatherNameEntity.name : '';
        // marriageDoc.bride.father.name = allNames.find(name => name._id_name === fatherNameRefs[0]).name;

        // For now only counting with max 2 names FIXME?
        if (fatherNameRefs.length === 2) {
          marriageDoc.bride.father.middle_name = allNames.find(name => name._id_name === fatherNameRefs[1]).name;
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
        const motherNameRefs = personNames
          .filter(personName => personName.person_id === marriageDoc.bride.mother._id_person)
          .map(personName => personName.name_id);

        // Father names entities
        const motherNameEntity = allNames.find(name => name._id_name === motherNameRefs[0]);
        marriageDoc.bride.mother.name = motherNameEntity ? motherNameEntity.name : '';
        // marriageDoc.mother.mother.name = allNames.find(name => name._id_name === motherNameRefs[0]).name;

        // For now only counting with max 2 names FIXME?
        if (motherNameRefs.length === 2) {
          marriageDoc.bride.mother.middle_name = allNames.find(name => name._id_name === motherNameRefs[1]).name;
        }

        // Father occupations entities
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
  }

  marriageDocuments = [...marriageDocuments, marriageDoc];
  // console.log('MERIDZ: ', marriageDoc);
  // mongoInsert('marriages', marriageDoc);
});

/**********************Generate Death document collection for MongoDB**********************/

let deathsBuf = deepcopy(deaths);
let deathDocuments = [];

deathsBuf.map(deathRecord => {
  /********* Death Record attributes *********/
  let deathDoc = {...deathRecord};

  /********* ENTITIES connected to Death Record *********/

  /********* Register *********/
  deathDoc.register = {...registers.find(reg => reg._id_register === deathRecord.register_id)};

  /********* User *********/
  deathDoc.user = {...users.find(usr => usr._id_user === deathRecord.user_id)};

  /********* Director *********/
  deathDoc.director = {...directors.find(dir => dir._id_director === deathRecord.director_id)};

  const dirNameRefs = directorNames
    .filter(dirName => dirName.director_id === deathRecord.director_id)
    .map(dirName => dirName.name_id);

  deathDoc.director.name = allNames.find(name => name._id_name === dirNameRefs[0]).name;

  /********* Celebrant *********/
  deathDoc.celebrant = {...celebrants.find(cel => cel._id_celebrant === deathRecord.celebrant_id)};

  const celNameRefs = celebrantNames
    .filter(celName => celName.celebrant_id === deathRecord.celebrant_id)
    .map(celName => celName.name_id);

  deathDoc.celebrant.name = allNames.find(name => name._id_name === celNameRefs[0]).name;

  /********* Dead person & connected entities (parents, bride/groom, kids) *********/
  deathDoc.person = {...persons.find(person => person._id_person === deathRecord.person_id)};

  if (deathDoc.person) { // FIXME debug for delete Entity['attr'] - get rid of _id of records and entities and id_ of nested entities
    const personNameRefs = personNames
      .filter(personName => personName.person_id === deathRecord.person_id)
      .map(personName => personName.name_id);

    // Person names entities
    const personNameEntity = allNames.find(name => name._id_name === personNameRefs[0]);
    deathDoc.person.name = personNameEntity ? personNameEntity.name : '';

    // For now only counting with max 2 names FIXME?
    if (personNameRefs.length === 2) {
      deathDoc.person.middle_name = allNames.find(name => name._id_name === personNameRefs[1]).name;
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
      const fatherNameEntity = allNames.find(name => name._id_name === fatherNameRefs[0]);
      deathDoc.father.name = fatherNameEntity ? fatherNameEntity.name : '';
      // deathDoc.father.name = allNames.find(name => name._id_name === fatherNameRefs[0]).name;

      // For now only counting with max 2 names FIXME?
      if (fatherNameRefs.length === 2) {
        deathDoc.father.middle_name = allNames.find(name => name._id_name === fatherNameRefs[1]).name;
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

      // Mother name entity
      // women have only 1 name for simplicity
      const motherNameEntity = allNames.find(name => name._id_name === motherNameRefs[0]);
      deathDoc.mother.name = motherNameEntity ? motherNameEntity.name : '';
      // deathDoc.mother.name = allNames.find(name => name._id_name === motherNameRefs[0]).name;

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

    // Dead person's mother's father // TODO - necessary? :/


    /********* // Dead person's Bride or Groom (if person was married) *********/

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

        // Bride/groom names entities
        const bgNameEntity = allNames.find(name => name._id_name === brideGroomNameRefs[0]);
        deathDoc.bride_groom.name = bgNameEntity ? bgNameEntity.name : '';
        // deathDoc.bride_groom.name = allNames.find(name => name._id_name === brideGroomNameRefs[0]).name;

        // For now only counting with max 2 names FIXME?
        if (brideGroomNameRefs.length === 2) {
          deathDoc.bride_groom.middle_name = allNames.find(name => name._id_name === brideGroomNameRefs[1]).name;
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

        // delete deathDoc.bride_groom['_id_person']; // TODO?
        // delete deathDoc.bride_groom['father_id'];
        // delete deathDoc.bride_groom['mother_id'];
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

          // Kid names entities
          const kidNameEntity = allNames.find(name => name._id_name === kidNameRefs[0]);
          kid.name = kidNameEntity ? kidNameEntity.name : '';
          // deathDoc.bride_groom.name = allNames.find(name => name._id_name === brideGroomNameRefs[0]).name;

          // For now only counting with max 2 names FIXME?
          if (kidNameRefs.length === 2) {
            kid.middle_name = allNames.find(name => name._id_name === kidNameRefs[1]).name;
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

          deathDoc.kids = [...deathDoc.kids, kid];
        }
      );
    }

  } else {
    console.log(deathRecord.person_id);
    console.log(persons[deathRecord.person_id]);
    console.log(persons.find(person => person._id_person === deathRecord.person_id));
    console.log(persons);
  }

  // Remove redundant ids used for Relational db
  // delete deathDoc['_id_death'];
  // delete deathDoc['person_id'];
  // delete deathDoc['register_id'];
  // delete deathDoc['user_id'];
  // delete deathDoc['celebrant_id'];
  // delete deathDoc['director_id'];
  // TODO delete nested IDs

  // console.log(deathDoc);

  deathDocuments = [...deathDocuments, deathDoc];

  // mongoInsert('deaths', deathDoc);
});

// Connection URL for MongoDB
const mongodbServerUrl = 'mongodb://localhost:27017';

// Database Name
const mongodbName = 'test';

// Skipped indexes:
//  - parents - sex, street, descr
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
  {name: "register.archive", key: {"register.archive": 1}},
  {name: "register.fond", key: {"register.fond": 1}},
  {name: "register.signature", key: {"register.signature": 1}},
  // {name: "user.name", key: {"user.name": 1}},
  // {name: "officiant.name", key: {"officiant.name": 1}},
  {name: "officiant.surname", key: {"officiant.surname": 1}},
  {name: "officiant.title", key: {"officiant.title": 1}},
  {name: "witnesses.side", key: {"witnesses.side": 1}},
  {name: "witnesses.relationship", key: {"witnesses.relationship": 1}},
  {name: "witnesses.name", key: {"witnesses.name": 1}},
  // {name: "witnesses.middle_name", key: {"witnesses.middle_name": 1}},
  {name: "witnesses.surname", key: {"witnesses.surname": 1}},
  {name: "witnesses.village", key: {"witnesses.village": 1}},
  {name: "witnesses.occupations", key: {"witnesses.occupations": 1}},
  {name: "witnesses.sex", key: {"witnesses.sex": 1}},
  {name: "witnesses.birth", key: {"witnesses.birth": 1}},
  {name: "witnesses.religion", key: {"witnesses.religion": 1}},
  {name: "groom.name", key: {"groom.name": 1}},
  // {name: "groom.middle_name", key: {"groom.middle_name": 1}},
  {name: "groom.surname", key: {"groom.surname": 1}},
  {name: "groom.village", key: {"groom.village": 1}},
  // {name: "groom.street", key: {"groom.street": 1}},
  // {name: "groom.descr", key: {"groom.descr": 1}},
  {name: "groom.occupations", key: {"groom.occupations": 1}},
  {name: "groom.birth", key: {"groom.birth": 1}},
  {name: "groom.religion", key: {"groom.religion": 1}},
  // {name: "groom.father.name", key: {"groom.father.name": 1}},
  // {name: "groom.father.middle_name", key: {"groom.father.middle_name": 1}},
  // {name: "groom.father.surname", key: {"groom.father.surname": 1}},
  {name: "groom.father.village", key: {"groom.father.village": 1}},
  // {name: "groom.father.occupations", key: {"groom.father.occupations": 1}},
  {name: "groom.father.birth", key: {"groom.father.birth": 1}},
  {name: "groom.father.religion", key: {"groom.father.religion": 1}},
  // {name: "groom.mother.name", key: {"groom.mother.name": 1}},
  // {name: "groom.mother.middle_name", key: {"groom.mother.middle_name": 1}},
  // {name: "groom.mother.surname", key: {"groom.mother.surname": 1}},
  {name: "groom.mother.village", key: {"groom.mother.village": 1}},
  // {name: "groom.mother.occupations", key: {"groom.mother.occupations": 1}},
  {name: "groom.mother.birth", key: {"groom.mother.birth": 1}},
  {name: "groom.mother.religion", key: {"groom.mother.religion": 1}},
  {name: "bride.name", key: {"bride.name": 1}},
  {name: "bride.surname", key: {"bride.surname": 1}},
  {name: "bride.village", key: {"bride.village": 1}},
  // {name: "bride.street", key: {"bride.street": 1}},
  // {name: "bride.descr", key: {"bride.descr": 1}},
  {name: "bride.occupations", key: {"bride.occupations": 1}},
  {name: "bride.birth", key: {"bride.birth": 1}},
  {name: "bride.religion", key: {"bride.religion": 1}},
  // {name: "bride.father.name", key: {"bride.father.name": 1}},
  // {name: "bride.father.middle_name", key: {"bride.father.middle_name": 1}},
  // {name: "bride.father.surname", key: {"bride.father.surname": 1}},
  {name: "bride.father.village", key: {"bride.father.village": 1}},
  // {name: "bride.father.occupations", key: {"bride.father.occupations": 1}},
  {name: "bride.father.birth", key: {"bride.father.birth": 1}},
  {name: "bride.father.religion", key: {"bride.father.religion": 1}},
  // {name: "bride.mother.name", key: {"bride.mother.name": 1}},
  // {name: "bride.mother.middle_name", key: {"bride.mother.middle_name": 1}},
  // {name: "bride.mother.surname", key: {"bride.mother.surname": 1}},
  {name: "bride.mother.village", key: {"bride.mother.village": 1}},
  // {name: "bride.mother.occupations", key: {"bride.mother.occupations": 1}},
  {name: "bride.mother.birth", key: {"bride.mother.birth": 1}},
  {name: "bride.mother.religion", key: {"bride.mother.religion": 1}},
];

// Skipped indexes:
//  - record: age_m, age_d, notes;
//  - mother, father, kids: street, descr and sex of mother and father
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
  {name: "age_y", key: {"age_y": 1}}, // create only index for years - should be enough for queries
  // {name: "age_m", key: {"age_m": 1}},
  // {name: "age_d", key: {"age_d": 1}},
  // {name: "age_h", key: {"age_h": 1}},
  {name: "inspection", key: {"inspection": 1}},
  {name: "death_cause", key: {"death_cause": 1}},
  {name: "death_date", key: {"death_date": 1}},
  {name: "funeral_date", key: {"funeral_date": 1}},
  {name: "provision_date", key: {"provision_date": 1}},
  // {name: "inspection_by", key: {"inspection_by": 1}},
  {name: "place_death", key: {"place_death": 1}},
  {name: "register.archive", key: {"register.archive": 1}},
  {name: "register.fond", key: {"register.fond": 1}},
  {name: "register.signature", key: {"register.signature": 1}},
  // {name: "user.name", key: {"user.name": 1}},
  // {name: "director.name", key: {"director.name": 1}},
  {name: "director.surname", key: {"director.surname": 1}},
  {name: "director.title", key: {"director.title": 1}},
  // {name: "celebrant.name", key: {"celebrant.name": 1}},
  {name: "celebrant.surname", key: {"celebrant.surname": 1}},
  {name: "celebrant.title_occup", key: {"celebrant.title_occup": 1}},
  {name: "person.name", key: {"person.name": 1}},
  // {name: "person.middle_name", key: {"person.middle_name": 1}},
  {name: "person.surname", key: {"person.surname": 1}},
  {name: "person.village", key: {"person.village": 1}},
  // {name: "person.street", key: {"person.street": 1}},
  // {name: "person.descr", key: {"person.descr": 1}},
  {name: "person.birth", key: {"person.birth": 1}},
  {name: "person.sex", key: {"person.sex": 1}},
  {name: "person.religion", key: {"person.religion": 1}},
  {name: "person.occupations", key: {"person.occupations": 1}}, // indexed array
  // {name: "father.name", key: {"father.name": 1}},
  // {name: "father.middle_name", key: {"father.middle_name": 1}},
  // {name: "father.surname", key: {"father.surname": 1}},
  {name: "father.birth", key: {"father.birth": 1}},
  {name: "father.village", key: {"father.village": 1}}, // not indexing street, descr, birth, sex
  {name: "father.religion", key: {"father.religion": 1}},
  // {name: "father.occupations", key: {"father.occupations": 1}}, // indexed array
  // {name: "mother.name", key: {"mother.name": 1}},
  // {name: "mother.surname", key: {"mother.surname": 1}},
  {name: "mother.birth", key: {"mother.birth": 1}},
  {name: "mother.village", key: {"mother.village": 1}}, // not indexing street, descr, birth, sex
  {name: "mother.religion", key: {"mother.religion": 1}},
  // {name: "mother.occupations", key: {"mother.occupations": 1}}, // indexed array
  {name: "bride_groom.name", key: {"bride_groom.name": 1}},
  {name: "bride_groom.surname", key: {"bride_groom.surname": 1}},
  {name: "bride_groom.village", key: {"bride_groom.village": 1}}, // not indexing street, descr, birth, sex
  {name: "bride_groom.religion", key: {"bride_groom.religion": 1}},
  {name: "bride_groom.occupations", key: {"bride_groom.occupations": 1}}, // indexed array
  // {name: "kids.name", key: {"kids.name": 1}},
  {name: "kids.surname", key: {"kids.surname": 1}},
  {name: "kids.birth", key: {"kids.birth": 1}},
  {name: "kids.sex", key: {"kids.sex": 1}},
  {name: "kids.village", key: {"kids.village": 1}}, // not indexing street, descr, birth
  {name: "kids.religion", key: {"kids.religion": 1}},
  {name: "kids.occupations", key: {"kids.occupations": 1}}, // indexed array
];

const insertDeathDocuments = function(db, callback) {
  // Insert some documents
  db.collection('deaths').insertMany(deathDocuments, function(err, result) {
    assert.equal(err, null);
    assert.equal(deathDocuments.length, result.insertedCount);
    console.log(`Inserted ${deathDocuments.length} documents into the deaths collection`);
    callback(result);
  });
};

const indexDeathsCollection = function(db, callback) {
  db.collection('deaths').createIndexes(
    deathDocIndexes,
    null,
    function(err, results) {
      console.log(results);
      callback();
    }
  );
};

const insertMarriageDocuments = function(db, callback) {
  // Insert some documents
  db.collection('marriages').insertMany(marriageDocuments, function(err, result) {
    assert.equal(err, null);
    assert.equal(marriageDocuments.length, result.insertedCount);
    console.log(`Inserted ${marriageDocuments.length} documents into the marriages collection`);
    callback(result);
  });
};

const indexMarriagesCollection = function(db, callback) {
  db.collection('marriages').createIndexes(
    marriageDocIndexes,
    null,
    function(err, results) {
      console.log(results);
      callback();
    }
  );
};

// Use connect method to connect to the server and fill deaths collection
MongoClient.connect(mongodbServerUrl, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(mongodbName);

  db.dropCollection('deaths'); // drop deaths collection if already exists

  insertDeathDocuments(db, function() {
    indexDeathsCollection(db, function() {
      client.close();
    });
  });

  console.log(`Created ${deathDocIndexes.length} indexes in the deaths collection`);
});

// Use connect method to connect to the server and fill marriages collection
MongoClient.connect(mongodbServerUrl, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(mongodbName);

  db.dropCollection('marriages'); // drop marriages collection if already exists

  insertMarriageDocuments(db, function() {
    indexMarriagesCollection(db, function() {
      client.close();
    });
  });

  console.log(`Created ${marriageDocIndexes.length} indexes in the marriages collection`);
});

console.log('---------------SUMMARY---------------');
console.log('Marriage records count: ', marriages.length);
console.log('Death records count: ', deaths.length);
console.log('Person records count: ', persons.length);
console.log(new Date());
