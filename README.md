# gg
gg - "genealogy generator" je *nodejs* skript, ktorý slúži na vygenerovanie dát pre oddacie a úmrtné matričné záznamy, ktoré slúžia ako testovacia sada pre porovnanie vhodnosti ukladania týchto záznamov v PostgreSQL a MongoDB.

Skript bol vytvorený ako pomôcka pre bakalársku prácu

---

### Autor 
Marek Pakes, xpakes00@stud.fit.vutbr.cz

- [GitHub](https://github.com/mrkpks/gg)

## Spustenie

Pre spustenie je nutné mať nainštalovaný nodejs: https://www.npmjs.com/get-npm

Kroky pre spustenie:

- `cd gg` - adresár skriptu
- `npm install` - nainštaluje potrebné závislosti
- `npm start` - spustenie skriptu

## Testovanie

#### PostgreSQL

- _postgres/postgres.tables.sql_ - CREATE príkazy pre vytvorenie tabuliek

- _postgres/postgres.inserts.sql_ - INSERT príkazy pre naplnenie databázy

- _postgres/postgres.queries.sql_ - testovacie príkazy
