const VILLAGES = require('./data/towns.cz');

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

// TODO discuss which should be used as optional arguments

const usersCount = 2;
const archivesCount = 2;
const fondsCount = 3;
const signaturesCount = 15; // arg?
const registersCount = archivesCount * fondsCount * signaturesCount;

const deathsCount = Math.ceil((registersCount / 10) * 7); // check
const marriagesCount = Math.floor((registersCount / 10) * 3); // check
const villagesCount = Math.min(VILLAGES.length, 15); // 15->arg?

const personsCount = deathsCount + marriagesCount * 8; // arg?
const occupationsCount = Math.min(PERSON_OCCUPATIONS.length, 15); // 15->arg?;

const directorsCount = 3;
const celebrantsCount = 3;
const officiantsCount = 3;

const POSTGRES_OUTPUT_FILE = 'postgres/postgres.inserts.sql';

faker.locale = 'cz';

function sqlInsert(entityName, entity) {
  let columns = Object.keys(entity);

  let values = Object.values(entity).map(value => isNaN(value) ? `'${value}'` : value);

  fs.appendFileSync(
    POSTGRES_OUTPUT_FILE,
    `INSERT INTO "${entityName}" (${columns}) VALUES (${values});\n`,
    'UTF-8',
    {'flags': 'a+'}
  );
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

fs.writeFileSync(POSTGRES_OUTPUT_FILE, '');

// console.log('--------------------------User--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  users.push(User);

  sqlInsert('User', User);
}

// console.log('--------------------------Register--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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
  POSTGRES_OUTPUT_FILE,
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

  menNames.push(ManName);

  sqlInsert('Name', ManName);
}

for (let i = 0; i < NAMES_WOMEN.length; i++) {
  const WomanName = {
    _id_name: i + NAMES_MEN.length,
    name: NAMES_WOMEN[i],
  };

  womenNames.push(WomanName);

  sqlInsert('Name', WomanName);
}

// const names = menNames.concat(womenNames);

// console.log('--------------------------Occupation--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
  '--------------------------Occupation--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let occupations = [];

for (let i = 0; i < Math.min(occupationsCount, PERSON_OCCUPATIONS.length); i++) {
  const Occupation = {
    _id_occup: i,
    name: PERSON_OCCUPATIONS.map(occ => occ).sort(() => Math.random() - 0.5)[i],
  };

  occupations.push(Occupation);

  sqlInsert('Occupation', Occupation);
}

// console.log('--------------------------Director--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  directors.push(Director);

  sqlInsert('Director', Director);
}

// console.log('--------------------------DirectorName--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  directorNames.push(DirectorName);

  sqlInsert('DirectorName', DirectorName);
}

// console.log('--------------------------Celebrant--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  celebrants.push(Celebrant);

  sqlInsert('Celebrant', Celebrant);
}

// console.log('--------------------------CelebrantName--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  celebrantNames.push(CelebrantName);

  sqlInsert('CelebrantName', CelebrantName);
}

// console.log('--------------------------Officiant--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  officiants.push(Officiant);

  sqlInsert('Officiant', Officiant);
}

// console.log('--------------------------OfficiantName--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  officiantNames.push(OfficiantName);

  sqlInsert('OfficiantName', OfficiantName);
}

// console.log('--------------------------Person--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

for (let i = 0; i < personsCount;) { // increment inside cycle for each person

  const [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');
  const personSex = Math.random() > 0.5 ? 'muž' : 'žena';
  const surname = personSex === 'muž'
    ? personManSurnames[personManIndices.next().value]
    : personWomanSurnames[personWomanIndices.next().value];

  const personVillage = VILLAGES[personVillageIndices.next().value];

  const randomReligion = Math.random() > 0.65 ? 'evangelík' :  Math.random() > 0.4 ? 'katolík' : 'nepokřtěn';
  const religionFather = Math.random() > 0.65 ? 'evangelík' :  Math.random() > 0.4 ? 'katolík' : 'nepokřtěn';
  const religionMother = Math.random() > 0.4 ? religionFather :  randomReligion;
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

  i++; // increment for each person !!!
  persons.push(Mother);
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

  i++; // increment for each person !!!
  persons.push(Father);
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

  i++; // increment for each person !!!
  persons.push(Person);
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
        religion: religionPerson, // same religion as person for simplicity FIXME - randomness?
      };

      // connect kid to mother / father - one of them is enough because it is needed only for Death records where dead_person is either of them (Person)
      Person.sex === 'žena' ? PersonKid.mother_id = Person._id_person : PersonKid.father_id = Person._id_person;

      persons.push(PersonKid);
      sqlInsert('Person', PersonKid);
      i++; // increment cycle index for each kid
    }
  }
}

// console.log('--------------------------PersonName--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
  '--------------------------PersonName--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let personNames = [];
const menNameIndices = randomIndexFrom(NAMES_MEN.length);
const womenNameIndices = randomIndexFrom(NAMES_WOMEN.length);

for (let i = 0; i < personsCount; i++) {
  const isMan = persons[i].sex === 'muž';

  const PersonName = {
    person_id: i,
    name_id: isMan ? menNameIndices.next().value : NAMES_MEN.length + womenNameIndices.next().value
  };

  personNames.push(PersonName);

  sqlInsert('PersonName', PersonName);
}

// console.log('--------------------------PersonOccupation--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
  '--------------------------PersonOccupation--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let personOccupations = [];
const occupationIndices = randomIndexFrom(PERSON_OCCUPATIONS.length);

for (let i = 0; i < personsCount; i++) {
  const PersonOccupation = {
    person_id: i,
    occup_id: occupationIndices.next().value,
  };

  personOccupations.push(PersonOccupation);

  sqlInsert('PersonOccupation', PersonOccupation);
}

// console.log('--------------------------Marriage--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
  '--------------------------Marriage--------------------------\n',
  'UTF-8',
  {'flags': 'a+'}
);

let marriages = [];
let witnesses = [];

const officiantsIndices = randomIndexFrom(officiants.length);
const marriageRegistersIndices = randomIndexFrom(registers.length);
const marriageUsersIndices = randomIndexFrom(users.length);

for (let i = 0; i < marriagesCount; i++) {
  const marriageVillageIndices = randomIndexFrom(villagesCount);

  const groom = persons
    .filter(person => person.sex === 'muž' && person.mother_id && person.father_id)
    .sort(() => Math.random() - 0.5)[0];

  const bride = persons
    .filter(person => person.sex === 'žena'
      && person.mother_id
      && person.father_id
      && person.surname !== `${groom.surname}ová`) // so groom won't marry his mother or bride her father :|
    .sort(() => Math.random() - 0.5)[0];
  // console.log(groom._id_person, groom.sex, groom.surname, groom.birth, groom.mother_id, groom.father_id);
  // console.log(bride._id_person, bride.sex, bride.surname, bride.birth, bride.mother_id, bride.father_id);

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
    rec_ready: Math.random() > 0.2,
    rec_order: Math.floor(Math.random() * 1000),
    scan_order: Math.floor(Math.random() * 1000),
    scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P',
    date: marriageDate,
    village: marriageVillage,
    groom_y: groom_y,
    groom_m: groom_m,
    groom_d: groom_d,
    bride_y: bride_y,
    bride_m: bride_m,
    bride_d: bride_d,
    groom_adult: groom_y >= 18,
    bride_adult: bride_y >= 18,
    relationship: relationship,
    banns_1: 'banns1', // TODO?
    banns_2: 'banns2', // TODO?
    banns_3: 'banns3', // TODO?
    groom_id: groom._id_person,
    bride_id: bride._id_person,
    user_id: users[marriageUsersIndices.next().value]._id_user,
    register_id: registers[marriageRegistersIndices.next().value]._id_register,
    officiant_id: officiants[officiantsIndices.next().value]._id_officiant,
  };

  marriages = [...marriages, Marriage];

  sqlInsert('Marriage', Marriage);

  // console.log('--------------------------Witness--------------------------');
  fs.appendFileSync(
    POSTGRES_OUTPUT_FILE,
    '--------------------------Witness--------------------------\n',
    'UTF-8',
    {'flags': 'a+'}
  );

  const marriageWitnesses = persons
    .filter(person => person._id_person !== groom._id_person && person._id_person !== bride._id_person)
    .sort(() => Math.random() - 0.5).slice(0, 4);

  // console.log('Marriage groom, bride IDs: ', Marriage.groom_id, Marriage.bride_id);
  // marriageWitnesses.map(witness => console.log('Witness ID: ', witness._id_person));
  // randomPersons.map(person => console.log(person._id_person));

  for (let j = 0; j < 4; j++) {
    const Witness = {
      person_id: marriageWitnesses[j]._id_person,
      marriage_id: i,
      side: j > 1 ? 'nevěsty' : 'ženicha',
      relationship: Math.random() > 0.6 ? 'sourozenec' : Math.random() < 0.3 ? 'přítel': 'jiné',
    };

    witnesses.push(Witness);

    sqlInsert('Witness', Witness);
  }
}

// witnesses.map(witness => console.log(witness.marriage_id, witness.person_id));

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

