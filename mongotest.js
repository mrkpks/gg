const MongoClient = require('mongodb').MongoClient;

// Connection URL for MongoDB
const mongodbServerUrl = 'mongodb://localhost:27017';

// Database Name
const mongodbName = 'test';
const dateFns = require('date-fns');

// Use connect method to connect to the server and fill deaths collection
MongoClient.connect(mongodbServerUrl, { useNewUrlParser: true }, function(err, client) {
  console.log("MongoDB: Connected successfully to server");
  const query = {village: 'Brno', date: {$gt: '1859-01-01', $lt: '1860-01-01'}};
  const db = client.db(mongodbName);

  const queryStart = new Date();
  db.collection('marriages').find({
    bride_y: {$lt: 18} // filter
  }, { // project
    bride_y: 1,
    "officiant.surname": 1,
    "officiant.name": 1,
    "bride.surname": 1,
    "bride.name": 1,
    "groom.surname": 1,
    "groom.name": 1,
    "bride.mother.surname": 1,
    "bride.mother.name": 1,
    "bride.father.surname": 1,
    "bride.father.name": 1,
    "groom.mother.surname": 1,
    "groom.mother.name": 1,
    "groom.father.surname": 1,
    "groom.father.name": 1,
  }).toArray(function(err, result) {
    if (err) throw err;
    console.log(`${dateFns.differenceInMilliseconds(new Date(), queryStart)}ms`);
    console.log('DOCUMENTS RETURNED: ', result.length);
    // console.log(result);
    client.close();
  });
});

const query = {
  bride_y: 1,
  "officiant.surname": 1,
  "officiant.name": 1,
  "bride.surname": 1,
  "bride.name": 1,
  "groom.surname": 1,
  "groom.name": 1,
  "bride.mother.surname": 1,
  "bride.mother.name": 1,
  "bride.father.surname": 1,
  "bride.father.name": 1,
  "groom.mother.surname": 1,
  "groom.mother.name": 1,
  "groom.father.surname": 1,
  "groom.father.name": 1,
};
