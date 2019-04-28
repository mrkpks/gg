export interface User {
  _id_user: number;
  name: string;
}

export interface Register {
  _id_register: number;
  archive: string
  fond: string;
  signature: number;
}

export interface Name {
  _id_name: number;
  name: string;
}

export interface Occupation {
  _id_occup: number;
  name: string;
}

export interface Director {
  _id_director: number;
  surname: string;
  title: string;
}

export interface DirectorName {
  director: number;
  name: number;
}

export interface Celebrant {
    _id_celebrant: number;
    surname: string;
    title_occup: string;
}

export interface CelebrantName {
    celebrant: number;
    name: number;
}

export interface Officiant {
  _id_officiant: number;
  surname: string;
  title: string;
}

export interface OfficiantName {
  officiant: number;
  name: number;
}

export interface Person {
  _id_person: number;
  surname: string;
  village: string;
  street: string;
  descr: number;
  birth: string;
  sex: 'M' | 'Z';
  religion: string;
  mother?: number;
  father?: number;
}

export interface PersonOccupation {
  person: number;
  name: number;
}

export interface Witness {
  marriage: number;
  person: number;
  side: string;
  relationship: string;
}

export interface Death {
  _id_death: number;
  rec_ready: boolean;
  rec_order: number;
  scan_order: number;
  scan_layout: 'C' | 'L' | 'P';
  provision_date: string;
  death_date: string;
  funeral_date: string;
  death_village: string;
  death_street: string;
  death_descr: number;
  place_funeral: string;
  place_death: string;
  widowed: boolean;
  age_y: string;
  age_m: string;
  age_d: string;
  age_h: string;
  death_cause: string;
  inspection: boolean;
  inspection_by: string;
  notes: string;
  user?: number;
  director?: number;
  celebrant?: number;
  person?: number;
  register?: number;
}

export interface Marriage {
  _id_marriage: number;
  rec_ready: boolean;
  rec_order: number;
  scan_order: number;
  scan_layout: 'C' | 'L' | 'P';
  date: string;
  village: string;
  groom_y: string;
  groom_m: string;
  groom_d: string;
  bride_y: string;
  bride_m: string;
  bride_d: string;
  groom_adult: string;
  bride_adult: string;
  relationship: string;
  banns_1: string;
  banns_2: string;
  banns_3: string;
  user?: number;
  register?: number;
  groom?: number;
  bride?: number;
  officiant?: number;
}
