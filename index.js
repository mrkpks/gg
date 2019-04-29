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

let faker = require('faker');
let dateFns = require('date-fns');

const usersCount = 2;
const archivesCount = 2;
const fondsCount = 3;
const signaturesCount = 10; // TODO arg?
const registersCount = archivesCount * fondsCount * signaturesCount;

const deathsCount = Math.ceil((registersCount / 10) * 7); // TODO check
const marriagesCount = Math.floor((registersCount / 10) * 3); // TODO check
const villagesCount = Math.min(VILLAGES.length, 15); // TODO 15->arg?

const personsCount = 100; // TODO arg?
const namesCount = Math.min(NAMES_ALL.length, Math.floor(personsCount / 3)); // TODO check
const occupationsCount = Math.min(PERSON_OCCUPATIONS.length, 15); // TODO 15->arg?;

const directorsCount = 3;
const celebrantsCount = 3;
const officiantsCount = 3;

const witnessesCount = Math.min(marriagesCount * 4, personsCount); // TODO check

faker.locale = 'cz';

function sqlInsert(entityName, entity) {
  let columns = Object.keys(entity);

  let values = Object.values(entity).map(value => isNaN(value) ? `'${value}'` : value);

  console.log(`INSERT INTO "${entityName}" (${columns}) VALUES (${values});`);
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

console.log('--------------------------User--------------------------');

for (let i = 0; i < usersCount; i++) {
  let User = {
    _id_user: i,
    name: faker.fake("{{name.firstName}} {{name.lastName}}"),
  };

  // sqlInsert('User', User);
}

console.log('--------------------------Register--------------------------');

let registers = [];

for (let i = 0; i < archivesCount; i++) {
  for (let j = 0; j < fondsCount; j++) {
    for (let k = 0; k < signaturesCount; k++) {
      let Register = {
        _id_register: i * fondsCount * signaturesCount + j * signaturesCount + k,
        archive: `AR${i}`,
        fond: `FOND${j}`,
        signature: k,
      };

      registers.push(Register);

      // sqlInsert('Register', Register);
    }
  }
}

console.log('--------------------------Name--------------------------');

for (let i = 0; i < namesCount; i++) {
  let Name = {
    _id_name: i,
    name: NAMES_ALL[i],
  };

  // sqlInsert('Name', Name);
}

console.log('--------------------------Occupation--------------------------');

for (let i = 0; i < Math.min(occupationsCount, PERSON_OCCUPATIONS.length); i++) {
  let Occupation = {
    _id_occup: i,
    name: PERSON_OCCUPATIONS.map(occ => occ).sort(() => Math.random() - 0.5)[i],
  };

  // sqlInsert('Occupation', Occupation);
}

console.log('--------------------------Director--------------------------');

const directorTitleIndices = randomIndexFrom(DIRECTOR_TITLES.length);
const directorSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, directorsCount);

for (let i = 0; i < directorsCount; i++) {

  let Director = {
    _id_director: i,
    surname: directorSurnames[i],
    title: DIRECTOR_TITLES[directorTitleIndices.next().value],
  };

  // sqlInsert('Director', Director);
}

console.log('--------------------------DirectorName--------------------------');

const directorNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < directorsCount; i++) {
  let DirectorName = {
    director: i,
    name: directorNameIndices.next().value,
  };

  // sqlInsert('DirectorName', DirectorName);
}

console.log('--------------------------Celebrant--------------------------');

const celebrantTitleIndices = randomIndexFrom(CELEBRANT_TITLES.length);
const celebrantSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, celebrantsCount);

for (let i = 0; i < celebrantsCount; i++) {
  let Celebrant = {
    _id_celebrant: i,
    surname: celebrantSurnames[i],
    title: CELEBRANT_TITLES[celebrantTitleIndices.next().value],
  };

  // sqlInsert('Celebrant', Celebrant);
}

console.log('--------------------------CelebrantName--------------------------');

const celebrantNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < celebrantsCount; i++) {
  let CelebrantName = {
    celebrant: i,
    name: celebrantNameIndices.next().value,
  };

  // sqlInsert('CelebrantName', CelebrantName);
}

console.log('--------------------------Officiant--------------------------');

const officiantTitleIndices = randomIndexFrom(OFFICIANT_TITLES.length);
const officiantSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5).slice(0, officiantsCount);

for (let i = 0; i < officiantsCount; i++) {
  let Officiant = {
    _id_officiant: i,
    surname: officiantSurnames[i],
    title: OFFICIANT_TITLES[officiantTitleIndices.next().value],
  };

  // sqlInsert('Officiant', Officiant);
}

console.log('--------------------------OfficiantName--------------------------');

const officiantNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < officiantsCount; i++) {
  let OfficiantName = {
    officiant: i,
    name: officiantNameIndices.next().value,
  };

  // sqlInsert('OfficiantName', OfficiantName);
}

console.log('--------------------------Person--------------------------');

const personManSurnames = SURNAMES_MEN.map(sur => sur).sort(() => Math.random() - 0.5);
const personWomanSurnames = SURNAMES_WOMEN.map(sur => sur).sort(() => Math.random() - 0.5);

let persons = [];

for (let i = 0; i < personsCount; i += 3) {

  let [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');
  let sex = Math.random() > 0.6 ? 'muž' : 'žena';
  let surname = sex === 'muž' ? personManSurnames[i] : personWomanSurnames[i];
  let religion = Math.random() > 0.7 ? 'evangelík' : 'katolík';

  let mother = {
    _id_person: i,
    surname: surname,
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    sex: 'žena',
    religion: religion,
    mother: null,
    father: null,
  };

  let father = {
    _id_person: i+1,
    surname: surname,
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    sex: 'muž',
    religion: religion,
    mother: null,
    father: null,
  };

  let Person = {
    _id_person: i + 2,
    surname: surname,
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    sex: sex,
    religion: religion,
    mother: i,
    father: i + 1,
  };

  persons = [...persons, mother, father, Person];

  // sqlInsert('Person', mother);
  // sqlInsert('Person', father);
  // sqlInsert('Person', Person);
}

console.log('--------------------------PersonName--------------------------');

const personNameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < personsCount; i++) {
  let PersonName = {
    person: i,
    name: personNameIndices.next().value,
    // sex: '???' TODO
  };

  // sqlInsert('PersonName', PersonName);
}

console.log('--------------------------PersonOccupation--------------------------');

const occupationIndices = randomIndexFrom(namesCount);

for (let i = 0; i < personsCount; i++) {
  let PersonOccupation = {
    person: i,
    occup: occupationIndices.next().value,
  };

  // sqlInsert('PersonOccupation', PersonOccupation);
}

console.log('--------------------------Marriage--------------------------');

let marriages = [];

for (let i = 0; i < marriagesCount; i++) {
  const marriageVillageIndices = randomIndexFrom(villagesCount);
  const males = persons.filter(person => person.sex === 'muž');
  const females = persons.filter(person => person.sex === 'žena');

  // console.log(males);
  // console.log(females);

  console.log('--------------------------Witness--------------------------');

  let randomPersons = persons.map(person => person).sort().sort(() => Math.random() - 0.5).slice(0, 4);
  console.log(randomPersons);

  for (let j = 0; j < 4; j++) {
    let Witness = {
      person: randomPersons[j],
      marriage: i,
      side: j > 1 ? 'nevěsty' : 'ženicha',
      relationship: Math.random() > 0.6 ? 'sourozenec' : Math.random() < 0.3 ? 'přítel': 'jiné',
    };

    console.log(Witness);
    // sqlInsert('Witness', Witness);
  }

  let Marriage = {
    _id_marriage: i,
    rec_ready: Math.random() > 0.9,
    rec_order: Math.floor(Math.random() * 1000),
    scan_order: Math.floor(Math.random() * 1000),
    scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P',
    date: faker.fake("{{date.past}}"),
    village: VILLAGES[marriageVillageIndices.next().value],
    groom_y: 'aa',
    groom_m: 'aa',
    groom_d: 'aa',
    bride_y: 'aa',
    bride_m: 'aa',
    bride_d: 'aa',
    groom_adult: 'aa',
    bride_adult: 'aa',
    relationship: Math.random() > 0.8 ? 'ano' : 'ne', // TODO?,
    banns_1: 'aa',
    banns_2: 'aa',
    banns_3: 'aa',
    register: 1,
    user: 1,
    groom: 1,
    bride: 2,
    officiant: 1,
  };

  marriages = [...marriages, Marriage];

  // sqlInsert('Marriage', Marriage);
}

console.log('--------------------------Death--------------------------');

let deaths = [];

for (let i = 0; i < deathsCount; i++) {

  let [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');

  let Death = {
    _id_death: i,
  };

  deaths = [...deaths, Death];

  // sqlInsert('Death', Death);
}

// fs.writeFileSync('output/test.txt', 'yololo');
