const MongoClient = require('mongodb').MongoClient;
const MONGODB_CREDENTIALS = require('./mongodb/credentials');

// Connection URL for MongoDB
const mongodbServerUrl = MONGODB_CREDENTIALS.mongodbServerUrl;

// Database Name
const mongodbName = MONGODB_CREDENTIALS.mongodbName;
const dateFns = require('date-fns');

// Use connect method to connect to the server and fill deaths collection
MongoClient.connect(mongodbServerUrl, { useNewUrlParser: true }, function(err, client) {
  console.log("MongoDB: Connected successfully to server");
  const db = client.db(mongodbName);

  const queryStart = new Date();

  /*** EDIT THE QUERY FOR YOUR TEST ***/
  db.collection('marriages').aggregate(
    [
      {
        $match: {
          village: 'Brno',
          date: {
            $gt: '1859-01-01',
            $lt: '1860-01-01'
          }
        }
      },
      {
        $count: "records"
      }
    ]
  )
    .toArray(function(err, result) { // OUTPUT LOG: LEAVE THIS PART AS IS
      if (err) throw err;

      // Log query time in ms
      console.log(`${dateFns.differenceInMilliseconds(new Date(), queryStart)}ms`);

      /*** EDIT IF YOU WANT TO LOG NUMBER OF DOCUMENTS OR WHOLE RESULT OR BOTH ***/
      console.log('Number of documents returned: ', result.length);
      // console.log(result);

      // Close connection
      client.close();
    });
});

