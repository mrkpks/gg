// import { Person } from './interfaces';


// const randomName = require('node-random-name');
// const moment = require('moment');
// const fs = require('fs');

let VILLAGES = require('./data/cr_cities.json');
let OCCUPATIONS = require('./data/occupations.json');
let faker = require('faker');
let dateFns = require('date-fns');


const archivesCount = 3;
const fonds = 5;
const signatures = 10;
const users = 2;
const personsCount = 10;
const occupations = 15;
const namesCount = 6;

faker.locale = 'cz';

faker.seed(123);

let firstRandom = faker.random.number();

// Setting the seed again resets the sequence.
// faker.seed(123);

let secondRandom = faker.random.number();

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

for (let i = 0; i < users; i++) {
  let User = {
    _id_user: i,
    name: faker.fake("{{name.firstName}} {{name.lastName}}"),
  };
}

console.log('--------------------------Register--------------------------');

let registers = [];

for (let i = 0; i < archivesCount; i++) {
  for (let j = 0; j < fonds; j++) {
    for (let k = 0; k < signatures; k++) {
      registers.push({
        _id_register: i * fonds * signatures + j * signatures + k,
        archive: `AR${i}`,
        fond: `FOND${j}`,
        signature: k,
      });
    }
  }
}

console.log('--------------------------Name--------------------------');

for (let i = 0; i < namesCount; i++) {
  let Name = {
    _id_name: i,
    name: faker.fake("{{name.lastName}}"),
  };
}

console.log('--------------------------Occupation--------------------------');

for (let i = 0; i < Math.min(occupations, OCCUPATIONS.length); i++) {
  let Occupation = {
    _id_occup: i,
    name: OCCUPATIONS.sort(() => Math.random() - 0.5)[i],
  };
}

console.log('--------------------------Person--------------------------');

let persons = [];

for (let i = 0; i < personsCount; i++) {

  let [descr, street] = faker.fake("{{address.streetAddress}}").split(' ');



  let Person = {
    _id_person: i,
    surname: faker.fake("{{name.lastName}}"),
    village: VILLAGES[i],
    street: street,
    descr: descr,
    birth: dateFns.format(faker.fake("{{date.past}}"), 'YYYY-MM-DD'),
    sex: Math.random() > 0.5 ? 'M' : 'Z',
    religion: Math.random() > 0.65 ? 'religion1' : 'religion2',
    mother: 42,
    father: 69,
  };

  persons = [...persons, Person];

  // let table = 'Person';
  // let columns = Object.keys(Person);
  //
  // let values = Object.values(Person).map(value => isNaN(value) ? `'${value}'` : value);
  // let insertSql = `INSERT INTO "${table}" (${columns}) VALUES (${values});`;
  // console.log(insertSql);
  sqlInsert('Person', Person);
}

console.log('--------------------------PersonName--------------------------');

const nameIndices = randomIndexFrom(namesCount);

for (let i = 0; i < personsCount; i++) {
  let PersonName = {
    person: i,
    name: nameIndices.next().value,
  };
}

console.log('--------------------------PersonOccup--------------------------');

const occupIndices = randomIndexFrom(namesCount);

for (let i = 0; i < personsCount; i++) {
  let PersonOccup = {
    person: i,
    occup: occupIndices.next().value,
  };
}


console.log(firstRandom);
console.log(secondRandom);

console.log(faker.fake("{{name.firstName}} {{name.firstName}} {{name.lastName}}"));


// fs.writeFileSync('output/test.txt', 'yololo');
