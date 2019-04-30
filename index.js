// const randomName = require('node-random-name');
// const moment = require('moment');
// const fs = require('fs');

const VILLAGES = require('./data/towns_cz');

const NAMES_ALL = require('./data/names.all');
const NAMES_MEN = require('./data/names.men');
const NAMES_WOMEN = require('./data/names.women');
const SURNAMES_ALL = require('./data/surnames.all');
const SURNAMES_MEN = require('./data/surnames.men');
const SURNAMES_WOMEN = require('./data/surnames.women');

const PERSON_OCCUPATIONS = require('./data/occupations');
const DIRECTOR_TITLES = require('./data/director.titles');
const CELEBRANT_TITLES = require('./data/celebrant.titles');
const OFFICIANT_TITLES = require('./data/officiant.titles');

const fs = require('fs');
const faker = require('faker');
const dateFns = require('date-fns');
const randomDate = require('randomdate');

const usersCount = 2;
const archivesCount = 2;
const fondsCount = 3;
const signaturesCount = 10; // TODO arg?
const registersCount = archivesCount * fondsCount * signaturesCount;

const deathsCount = Math.ceil((registersCount / 10) * 7); // TODO check
const marriagesCount = Math.floor((registersCount / 10) * 3); // TODO check
const villagesCount = Math.min(VILLAGES.length, 15); // TODO 15->arg?

const personsCount = deathsCount + marriagesCount * 8; // TODO arg?
const namesCount = Math.min(NAMES_ALL.length, Math.floor(personsCount / 3)); // TODO check
const occupationsCount = Math.min(PERSON_OCCUPATIONS.length, 15); // TODO 15->arg?;

const directorsCount = 3;
const celebrantsCount = 3;
const officiantsCount = 3;

const OUTPUT_FILE = 'postgres/postgres.inserts.sql';

faker.locale = 'cz';

function sqlInsert(entityName, entity) {
  let columns = Object.keys(entity);

  let values = Object.values(entity).map(value => isNaN(value) ? `'${value}'` : value);

  fs.appendFileSync(
    OUTPUT_FILE,
    `INSERT INTO "${entityName}" (${columns}) VALUES (${values});\n`,
    'UTF-8',
    {'flags': 'a+'}
  );
  // console.log(`INSERT INTO "${entityName}" (${columns}) VALUES (${values});\n`);
}

function* randomIndexFrom(length) {
  const indices = Array.from({length}, (_, i) => i)
    .sort(() => Math.random() - 0.5);

  for (const index of indices) {
    yield index;
  }

  while (true) {
    yield indices[Math.floor(Math.random() * length)];
  }
}

fs.writeFileSync(OUTPUT_FILE, '');

// console.log('--------------------------User--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------User--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

for (let i = 0; i < usersCount; i++) {
  const User = {
    _id_user: i,
    name: faker.fake("{{name.firstName}} {{name.lastName}}"),
  };

  sqlInsert('User', User);
}

// console.log('--------------------------Register--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
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
        archive: `AR${i}`,
        fond: `FOND${j}`,
        signature: k,
      };

      registers.push(Register);

      sqlInsert('Register', Register);
    }
  }
}

// console.log('--------------------------Name--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
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

const names = menNames.concat(womenNames);

// console.log('--------------------------Occupation--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------Occupation--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

for (let i = 0; i < Math.min(occupationsCount, PERSON_OCCUPATIONS.length); i++) {
  const Occupation = {
    _id_occup: i,
    name: PERSON_OCCUPATIONS.map(occ => occ).sort(() => Math.random() - 0.5)[i],
  };

  sqlInsert('Occupation', Occupation);
}

// console.log('--------------------------Director--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------Director--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const directorTitleIndices = randomIndexFrom(DIRECTOR_TITLES.length);
const directorSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, directorsCount);

for (let i = 0; i < directorsCount; i++) {

  const Director = {
    _id_director: i,
    surname: directorSurnames[i],
    title: DIRECTOR_TITLES[directorTitleIndices.next().value],
  };

  sqlInsert('Director', Director);
}

// console.log('--------------------------DirectorName--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------DirectorName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const directorNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < directorsCount; i++) {
  const DirectorName = {
    director_id: i,
    name_id: directorNameIndices.next().value,
  };

  sqlInsert('DirectorName', DirectorName);
}

// console.log('--------------------------Celebrant--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------Celebrant--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const celebrantTitleIndices = randomIndexFrom(CELEBRANT_TITLES.length);
const celebrantSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, celebrantsCount);

for (let i = 0; i < celebrantsCount; i++) {
  const Celebrant = {
    _id_celebrant: i,
    surname: celebrantSurnames[i],
    title_occup: CELEBRANT_TITLES[celebrantTitleIndices.next().value],
  };

  sqlInsert('Celebrant', Celebrant);
}

// console.log('--------------------------CelebrantName--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------CelebrantName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const celebrantNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < celebrantsCount; i++) {
  const CelebrantName = {
    celebrant_id: i,
    name_id: celebrantNameIndices.next().value,
  };

  sqlInsert('CelebrantName', CelebrantName);
}

// console.log('--------------------------Officiant--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------Officiant--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const officiantTitleIndices = randomIndexFrom(OFFICIANT_TITLES.length);
const officiantSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, officiantsCount);

for (let i = 0; i < officiantsCount; i++) {
  const Officiant = {
    _id_officiant: i,
    surname: officiantSurnames[i],
    title: OFFICIANT_TITLES[officiantTitleIndices.next().value],
  };

  sqlInsert('Officiant', Officiant);
}

// console.log('--------------------------OfficiantName--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------OfficiantName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const officiantNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < officiantsCount; i++) {
  const OfficiantName = {
    officiant_id: i,
    name_id: officiantNameIndices.next().value,
  };

  sqlInsert('OfficiantName', OfficiantName);
}

// console.log('--------------------------Person--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------Person--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const personManSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personManIndices = randomIndexFrom(personManSurnames.length);

const personWomanSurnames = SURNAMES_WOMEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personWomanIndices = randomIndexFrom(personWomanSurnames.length);

let persons = [];

for (let i = 0; i < personsCount; i += 3) {

  const [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');
  const sex = Math.random() > 0.6 ? 'muž' : 'žena';
  const surname = sex === 'muž'
    ? personManSurnames[personManIndices.next().value]
    : personWomanSurnames[personWomanIndices.next().value];
  const religion = Math.random() > 0.7 ? 'evangelík' : 'katolík';

  const motherSurname = sex === 'muž' ? `${surname}ová` : surname;
  const fatherSurname = sex === 'muž' ? surname : surname.slice(0, surname.indexOf('ová'));

  const mother = {
    _id_person: i,
    surname: motherSurname,
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(randomDate(new Date('1800-01-01'), new Date('1810-01-01')), 'YYYY-MM-DD'),
    sex: 'žena',
    religion: religion,
    // mother_id: 99999,
    // father_id: 99999,
  };

  const father = {
    _id_person: i+1,
    surname: fatherSurname,
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(randomDate(new Date('1800-01-01'), new Date('1810-01-01')), 'YYYY-MM-DD'),
    sex: 'muž',
    religion: religion,
    // mother_id: 99999,
    // father_id: 99999,
  };

  const Person = {
    _id_person: i + 2,
    surname: surname,
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(randomDate(new Date('1825-01-01'), new Date('1840-01-01')), 'YYYY-MM-DD'),
    sex: sex,
    religion: religion,
    mother_id: i,
    father_id: i + 1,
  };

  persons = [...persons, mother, father, Person];

  sqlInsert('Person', mother);
  sqlInsert('Person', father);
  sqlInsert('Person', Person);
}

// console.log('--------------------------PersonName--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------PersonName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const personNameIndices = randomIndexFrom(namesCount);
const menNameIndices = randomIndexFrom(NAMES_MEN.length);
const womenNameIndices = randomIndexFrom(NAMES_WOMEN.length);

for (let i = 0; i < personsCount; i++) {
  const isMan = persons[i].sex === 'muž';

  const PersonName = {
    person_id: i,
    name_id: isMan ? menNameIndices.next().value : NAMES_MEN.length + womenNameIndices.next().value
  };

  sqlInsert('PersonName', PersonName);
}

// console.log('--------------------------PersonOccupation--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------PersonOccupation--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

const occupationIndices = randomIndexFrom(namesCount);

for (let i = 0; i < personsCount; i++) {
  const PersonOccupation = {
    person_id: i,
    occup_id: occupationIndices.next().value,
  };

  sqlInsert('PersonOccupation', PersonOccupation);
}

// console.log('--------------------------Marriage--------------------------');
fs.appendFileSync(
  OUTPUT_FILE,
  '--------------------------Marriage--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let marriages = [];

for (let i = 0; i < marriagesCount; i++) {
  const marriageVillageIndices = randomIndexFrom(villagesCount);

  // console.log('--------------------------Witness--------------------------');
  fs.appendFileSync(
    OUTPUT_FILE,
    '--------------------------Witness--------------------------\n',
    'UTF-8',
    {'flags': 'a+'}
  );

  let randomPersons = persons.map(person => person).sort().sort(() => Math.random() - 0.5).slice(0, 4);
  // console.log(randomPersons);

  for (let j = 0; j < 4; j++) {
    let Witness = {
      person: randomPersons[j]._id_person,
      marriage: i,
      side: j > 1 ? 'nevěsty' : 'ženicha',
      relationship: Math.random() > 0.6 ? 'sourozenec' : Math.random() < 0.3 ? 'přítel': 'jiné',
    };

    // console.log(Witness);
    sqlInsert('Witness', Witness);
  }

  let Marriage = {
    _id_marriage: i,
    rec_ready: Math.random() > 0.2,
    rec_order: Math.floor(Math.random() * 1000),
    scan_order: Math.floor(Math.random() * 1000),
    scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P',
    date: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    village: VILLAGES[marriageVillageIndices.next().value],
    groom_y: 24,
    groom_m: 4,
    groom_d: 5,
    bride_y: 19,
    bride_m: 5,
    bride_d: 15,
    groom_adult: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    bride_adult: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    relationship: Math.random() > 0.8 ? 'ano' : 'ne', // TODO?,
    banns_1: 'aa',
    banns_2: 'aa',
    banns_3: 'aa',
    // user: 1,
    // register: 1,
    // groom: 1,
    // bride: 2,
    // officiant: 1,
  };

  marriages = [...marriages, Marriage];

  sqlInsert('Marriage', Marriage);
}
//
// console.log('--------------------------Death--------------------------');
//
// let deaths = [];
//
// for (let i = 0; i < deathsCount; i++) {
//
//   let [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');
//
//   let Death = {
//     _id_marriage: i,
//     rec_ready: Math.random() > 0.2,
//     rec_order: Math.floor(Math.random() * 1000),
//     scan_order: Math.floor(Math.random() * 1000),
//     scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P',
//     provision_date: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
//     death_date: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
//     funeral_date: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
//     death_village: 'aa',
//     death_street: 'aa',
//     death_descr: 42,
//     place_funeral: 'aa',
//     place_death: 'aa',
//     widowed: 'aa',
//     age_y: 'aa',
//     age_m: 'aa',
//     age_d: 'aa',
//     age_h: 'aa',
//     death_cause: 'aa',
//     inspection: 'aa',
//     inspection_by: 'aa',
//     notes: 'aa',
//     register_id: 1,
//     user_id: 1,
//     person_id: 1,
//     director_id: 1,
//     celebrant_id: 1,
//   };
//
//   deaths = [...deaths, Death];
//
//   sqlInsert('Death', Death);
// }

