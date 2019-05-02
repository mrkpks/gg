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

const DEATH_CAUSES = require('./data/death.causes');

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

const personsCount = 20; // can get to + 6 due to kids, parents.. FIXME
const occupationsCount = Math.min(PERSON_OCCUPATIONS.length, 50); // 15->arg?;

const directorsCount = 3;
const celebrantsCount = 3;
const officiantsCount = 3;

const POSTGRES_OUTPUT_FILE = 'postgres/postgres.inserts.sql';
const MONGO_OUTPUT_FILE = 'mongodb/mongo.data.json';

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

function cleanObject(obj) {
  const propNames = Object.getOwnPropertyNames(obj);
  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i];

    if (obj[propName] === null || obj[propName] === undefined) {
      delete obj[propName];
    }
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

const allNames = menNames.concat(womenNames);

// console.log('--------------------------Occupation--------------------------');
fs.appendFileSync(
  POSTGRES_OUTPUT_FILE,
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

  i++; // increment for each person !!!
  // persons.push(Mother);
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

  i++; // increment for each person !!!
  // persons.push(Father);
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

  i++; // increment for each person !!!
  // persons.push(Person);
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

      // connect kid to mother / father - one of them is enough because it is needed only for Death records where dead_person is either of them (Person)
      Person.sex === 'žena' ? PersonKid.mother_id = Person._id_person : PersonKid.father_id = Person._id_person;

      persons.push(PersonKid);
      persons = [...persons, PersonKid]
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

    personNames.push(SecondName);

    sqlInsert('PersonName', SecondName);
  }

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

      personOccupations.push(PersonOccupation);

      sqlInsert('PersonOccupation', PersonOccupation);
    }
  }
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
    groom_id: groom._id_person,
    bride_id: bride._id_person,
    user_id: users[marriageUsersIndices.next().value]._id_user,
    register_id: registers[marriageRegistersIndices.next().value]._id_register,
    officiant_id: officiants[officiantsIndices.next().value]._id_officiant,
  };

  // add banns dates to some marriage records
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

const celebrantsIndices = randomIndexFrom(celebrants.length);
const directorsIndices = randomIndexFrom(directors.length);
const deathRegistersIndices = randomIndexFrom(registers.length);
const deathUsersIndices = randomIndexFrom(users.length);
const deathCausesIndices = randomIndexFrom(DEATH_CAUSES.length);
let deaths = [];

const deadPersons = persons
  .filter(person => person.mother_id && person.father_id)
  .sort(() => Math.random() - 0.5);

let deadPersonsBuffer = deadPersons;

for (let i = 0; i < Math.min(deathsCount, deadPersons.length); i++) {
  const deathVillageIndices = randomIndexFrom(villagesCount);
  const person = deadPersonsBuffer[deadPersonsBuffer.length - 1];
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
    rec_ready: Math.random() > 0.2,
    rec_order: Math.floor(Math.random() * 1000),
    scan_order: Math.floor(Math.random() * 1000),
    scan_layout: Math.random() < 0.5 ? 'C' : Math.random() > 0.7 ? 'L' : 'P',
    death_village: deathVillage,
    death_street: deathVillage === person.village ? person.street : street,
    death_descr: deathVillage === person.village ? person.descr : descr,
    place_funeral: person.village,
    widowed: Math.random() > 0.7,
    age_y: age_y,
    age_m: age_m,
    age_d: age_d,
    age_h: age_h,
    inspection: Math.random() > 0.7,
    person_id: person._id_person,
    user_id: users[deathUsersIndices.next().value]._id_user,
    register_id: registers[deathRegistersIndices.next().value]._id_register,
    director_id: directors[directorsIndices.next().value]._id_director,
    celebrant_id: celebrants[celebrantsIndices.next().value]._id_celebrant,
  };

  const placeProb = Math.random();

  // every 20th record has death place filled
  if (placeProb > 0.8) {
    if (placeProb > 0.9) {
      Death.place_death = 'v řece Svitavě u Bilovic';
    } else {
      Death.place_death = 'nemocnice';
    }
  }

  // every 2nd record has death cause filled
  const causeProb = Math.random();

  if (causeProb > 0.5) {
    if (causeProb > 0.9) {
      Death.death_cause = 'osýpky';
    } else if (causeProb > 0.7) {
      Death.death_cause = 'souchotiny';
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
  if (Math.random() > 0.8) {
    Death.provision_date = deathDate;
  } else {
    Death.death_date = deathDate;
    Death.funeral_date = dateFns.format(dateFns.addDays(new Date(deathDate), Math.floor(Math.random() * 2 + 1)), 'YYYY-MM-DD');
  }

  if (Death.inspection) {
    Death.inspection_by = Math.random() > 0.6 ? 'Dr. Hrachovina' : 'Dr. Nováček';
  }

  deadPersonsBuffer.pop(); // pop last person who has record

  deaths = [...deaths, Death];

  sqlInsert('Death', Death);
}

/**********************Generate Death document for MongoDB**********************/

deaths.map(deathRecord => {
  // Death record attributes
  let deathDoc = deathRecord;

  // Death record connected entities

  // Register
  deathDoc.register = registers.find(reg => reg._id_register === deathRecord.register_id);

  // User
  deathDoc.user = users.find(usr => usr._id_user === deathRecord.user_id);

  // Director
  deathDoc.director = directors.find(dir => dir._id_director === deathRecord.director_id);

  const dirNameRefs = directorNames
    .filter(dirName => dirName.director_id === deathRecord.director_id)
    .map(dirName => dirName.name_id);

  deathDoc.director.name = allNames.find(name => name._id_name === dirNameRefs[0]).name;

  // FIXME this is for more than 1 name :(
  // for (let i = 0; i < dirNameRefs.length; i++) {
  //   if (i === 0) {
  //     deathDoc.director.name = allNames.find(name => name._id_name === dirNameRefs[0]).name;
  //   } else { // each other name is stored in array middle_names
  //     deathDoc.director.middle_names = [
  //       ...deathDoc.director.middle_names,
  //       allNames.find(name => name._id_name === dirNameRefs[i]).name
  //     ];
  //   }
  // }
  //
  // console.log(deathDoc.director);

  // Celebrant
  deathDoc.celebrant = celebrants.find(cel => cel._id_celebrant === deathRecord.celebrant_id);

  const celNameRefs = celebrantNames
    .filter(celName => celName.celebrant_id === deathRecord.celebrant_id)
    .map(celName => celName.name_id);

  deathDoc.celebrant.name = allNames.find(name => name._id_name === celNameRefs[0]).name;

  // Dead person
  deathDoc.person = persons.find(person => person._id_person === deathRecord.person_id);

  if (deathDoc.person) {
    const personNameRefs = personNames
      .filter(personName => personName.person_id === deathRecord.person_id)
      .map(personName => personName.name_id);

    const personNameEntity = allNames.find(name => name._id_name === personNameRefs[0]);
    deathDoc.person.name = personNameEntity ? personNameEntity.name : '';

    // For now only counting with max 2 names FIXME?
    if (personNameRefs.length === 2) {
      deathDoc.person.middle_name = allNames.find(name => name._id_name === personNameRefs[1]).name;
    }

    const personOccupRefs = personOccupations
      .filter(personOccup => personOccup.person_id === deathRecord.person_id)
      .map(personOccup => personOccup.occup_id);

    if (personOccupRefs.length > 0) {
      deathDoc.person.occupations = [];

      for (let i = 0; i < personOccupRefs.length; i++) {
        deathDoc.person.occupations = [
          ...deathDoc.person.occupations,
          occupations.find(occup => occup._id_occup === personOccupRefs[i]).name
        ];
      }
    }

    // Dead person's father
    deathDoc.father = persons.find(person => person._id_person === deathDoc.person.father_id);

    if (deathDoc.father) {
      const fatherNameRefs = personNames
        .filter(personName => personName.person_id === deathDoc.father._id_person)
        .map(personName => personName.name_id);

      const fatherNameEntity = allNames.find(name => name._id_name === fatherNameRefs[0]);
      deathDoc.father.name = fatherNameEntity ? fatherNameEntity.name : '';

      // deathDoc.father.name = allNames.find(name => name._id_name === fatherNameRefs[0]).name;

      // For now only counting with max 2 names FIXME?
      if (fatherNameRefs.length === 2) {
        deathDoc.father.middle_name = allNames.find(name => name._id_name === fatherNameRefs[1]).name;
      }

      const fatherOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === deathDoc.father.person_id)
        .map(personOccup => personOccup.occup_id);

      if (fatherOccupRefs.length > 0) {
        deathDoc.father.occupations = [];

        for (let i = 0; i < fatherOccupRefs.length; i++) {
          deathDoc.father.occupations = [
            ...deathDoc.father.occupations,
            occupations.find(occup => occup._id_occup === fatherOccupRefs[i]).name
          ];
        }
      }
    }

    // Dead person's mother
    deathDoc.mother = persons.find(person => person._id_person === deathDoc.person.mother_id);

    if (deathDoc.mother) {
      const motherNameRefs = personNames
        .filter(personName => personName.person_id === deathDoc.mother._id_person)
        .map(personName => personName.name_id);

      // women have only 1 name for simplicity
      const motherNameEntity = allNames.find(name => name._id_name === motherNameRefs[0]);
      deathDoc.father.name = motherNameEntity ? motherNameEntity.name : '';
      // deathDoc.mother.name = allNames.find(name => name._id_name === motherNameRefs[0]).name;

      const motherOccupRefs = personOccupations
        .filter(personOccup => personOccup.person_id === deathDoc.mother.person_id)
        .map(personOccup => personOccup.occup_id);

      if (motherOccupRefs.length > 0) {
        deathDoc.mother.occupations = [];

        for (let i = 0; i < motherOccupRefs.length; i++) {
          deathDoc.mother.occupations = [
            ...deathDoc.mother.occupations,
            occupations.find(occup => occup._id_occup === motherOccupRefs[i]).name
          ];
        }
      }
    }

    // Dead person's mother's father // TODO - necessary? :/

    // Dead person's bride_groom

    // if is married
    if (!!marriages.find(mar => mar.groom_id === deathRecord.person_id) || !!marriages.find(mar => mar.bride_id === deathRecord.person_id)
    ) {
      const brideGroomId = deathDoc.person.sex === 'muž'
        ? marriages.find(mar => mar.groom_id === deathRecord.person_id).bride_id
        : marriages.find(mar => mar.bride_id === deathRecord.person_id).groom_id;

      deathDoc.bride_groom = persons.find(person => person._id_person === brideGroomId);

      if (deathDoc.bride_groom) {
        const brideGroomNameRefs = personNames
          .filter(personName => personName.person_id === brideGroomId)
          .map(personName => personName.name_id);

        const bgNameEntity = allNames.find(name => name._id_name === brideGroomNameRefs[0]);
        deathDoc.father.name = bgNameEntity ? bgNameEntity.name : '';
        // deathDoc.bride_groom.name = allNames.find(name => name._id_name === brideGroomNameRefs[0]).name;

        // For now only counting with max 2 names FIXME?
        if (brideGroomNameRefs.length === 2) {
          deathDoc.bride_groom.middle_name = allNames.find(name => name._id_name === brideGroomNameRefs[1]).name;
        }

        const brideGroomOccupRefs = personOccupations
          .filter(personOccup => personOccup.person_id === brideGroomId)
          .map(personOccup => personOccup.occup_id);

        if (brideGroomOccupRefs.length > 0) {
          deathDoc.bride_groom.occupations = [];

          for (let i = 0; i < brideGroomOccupRefs.length; i++) {
            deathDoc.bride_groom.occupations = [
              ...deathDoc.bride_groom.occupations,
              occupations.find(occup => occup._id_occup === brideGroomOccupRefs[i]).name
            ];
          }
        }

        // delete deathDoc.bride_groom['_id_person']; // TODO?
        // delete deathDoc.bride_groom['father_id'];
        // delete deathDoc.bride_groom['mother_id'];
      }
    }

    // Dead person's kids // TODO
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
  // TODO delete nested IDs?!

  // console.log(deathDoc);
});

