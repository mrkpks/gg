# gg
gg - "genealogy generator" is a *nodejs* script which generates testing data of vital records (marriage and death certificates). The dataset is used for comparison of PostgreSQL and MongoDB databases.

This repository and script were made as a part of work on a bachelor's thesis: "Comparison of Relational and Document Database Systems (for genealogy)".

---

### Author 
Marek Pakes, xpakes00@stud.fit.vutbr.cz

- [GitHub](https://github.com/mrkpks/gg)

#### Before running script: 

- install Node.JS https://nodejs.org/en/
- install MongoDB: https://www.mongodb.com/download-center/community
- install PostgreSQL: https://www.postgresql.org/download/

- fill in credentials for MongoDB into `gg/mongodb/credentials.json`
- fill in credentials for PostgreSQL into `gg/postgres/credentials.json`

#### Steps to run script:

- `$ cd gg` - script directory
- `$ npm install` - install dependencies
- `$ npm start` or `npm run generate` - run generator

#### Optional arguments:

- `--createIndexes=<true|false>` - vytvorí/nevytvorí indexy v databázach

- `--recordsCount=<number>` - počet požadovaných matričných záznamov. Implicitne 1000.

Example: 
`$ npm start -- --records=10000 --createIndexes=false`

### Queries testing

#### PostgreSQL
2 ways to test queries in PostgreSQL
 - GUI: `pgAdmin 4` with Query tool
 - CLI: `psql` run `$ psql -U postgres postgres` (for default username and database name)


#### MongoDB
2 ways to test queries in MongoDB
 - GUI: `MongoDB Compass`
 - CLI: `mongod` (server), `mongo` (client)
 
NOTE: MongoDB Compass does not show the full query time!!!
 - use `gg/mongotest.js` for the database querying to show exact time of the query
 - edit highlighted code for your query
