const randomName = require('node-random-name');
const moment =require('moment')

const VILLAGES = require('./cr_cities.json');

const wololo = randomName({random: Math.random, first: true, gender: 'female'}) + randomName({first: true, gender: 'female'}) + randomName({last: true});

console.log(wololo);
console.log(VILLAGES.slice(0, 5));
console.log(moment());

