enum TABLES {
  user = 'User',
  register = 'Register',
  name = 'Name',
  occupation = 'Occupation',
  director = 'Director',
  directorName = 'DirectorName',
  celebrant = 'Celebrant',
  celebrantName = 'CelebrantName',
  officiant = 'Officiant',
  officiantName = 'OfficiantName',
  person = 'Person',
  personName = 'PersonName',
  personOccupation = 'PersonOccupation',
  witness = 'Witness',
  death = 'Death',
  marriage = 'Marriage',
}

enum COLUMNS {
  user = '_id_user, name',
  register = '_id_register, archive, fond, signature',
  name = '_id_name, name',
  occupation = '_id_occup, name',
  director = '_id_director, surname, title',
  directorName = 'director, name',
  celebrant = '_id_celebrant, surname, title_occup',
  celebrantName = 'celebrant, name',
  officiant = '_id_officiant, surname, title',
  officiantName = 'officiant, name',
  person = '_id_person, surname, village, street, descr, birth, sex, religion', // + FK: mother, father
  personName = 'person, name',
  personOccupation = 'person, occup',
  witness = 'marriage, person, side, relationship',
  death = '_id_death, rec_ready, rec_order, scan_order, scan_layout, provision_date, death_date, funeral_date, death_village, death_street, death_descr, place_funeral, place_death, widowed, age_y, age_m, age_d, age_h, death_cause, inspection, inspection_by, notes', // + FK: user, director, celebrant, person, register
  marriage = '_id_marriage, rec_ready, rec_order, scan_order, scan_layout, date, village, groom_y, groom_m, groom_d, bride_y, bride_m, bride_d, groom_adult, bride_adult, relationship, banns_1, banns_2, banns_3', // + FK user, register, groom, bride, officiant
}
