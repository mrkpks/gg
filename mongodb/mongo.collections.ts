// WIP of collections overview as TypeScript interfaces

interface Death {
  _id_death: number;
  rec_ready?: boolean;
  rec_order?: number;
  scan_order?: number;
  scan_layout?: 'C' | 'L' | 'P';
  provision_date?: Date;
  death_date?: Date;
  funeral_date?: Date;
  death_village?: {
    village?: string;
    street?: string;
    descr?: number;
  };
  place_funeral?: string;
  place_death?: string;
  widowed?: boolean;
  age?: { // or Datetime ? TODO
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
  }
  death_cause?: string;
  inspection?: boolean; // or date? TODO
  inspection_by?: string; // for now only person name, can be Person
  notes?: string;
  user?: {
    _id_user: number;
    name?: string;
  };
  director?: {
    _id_director: number;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    title?: string;
  };
  celebrant?: {
    _id_celebrant: number;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    title_occup?: string;
  };
  register?: {
    _id_register: number;
    archive: string;
    fond: string;
    signature: number;
  };
  dead_person?: {
    _id_person: number;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    sex?: string;
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    religion?: string;
    occupation?: string[];
  };
  father?: {
    dead?: boolean;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    occupation?: string[];
  };
  mother?: {
    dead?: boolean;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    occupation?: string[];
  };
  mother_father?: {
    name?: string;
    surname?: string;
    village?: string;
    occupation?: string[];
  };
  bride_groom?: {
    sex?: string;
    dead?: boolean;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    occupation?: string[];
  };
  kids?: {
    sex?: string;
    dead?: boolean;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    occupation?: string[];
  }[];
}

interface Marriage {
  _id_marriage: number;
  rec_ready?: boolean;
  rec_order?: number;
  scan_order?: number;
  scan_layout?: 'C' | 'L' | 'P';
  date?: Date;
  banns: string[];
  village: string;
  groom_adult?: boolean;
  bride_adult?: boolean;
  relationship?: string;
  age_groom?: { // or Datetime ? TODO
    years?: number;
    months?: number;
    days?: number;
  }
  age_bride?: { // or Datetime ? TODO
    years?: number;
    months?: number;
    days?: number;
  }
  user: {
    _id_user: number;
    name?: string;
  };
  officiant: {
    _id_officiant: number;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    title?: string;
  };
  register: {
    _id_register: number;
    archive: string;
    fond: string;
    signature: number;
  };
  groom: {
    _id_person: number;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    widowed?: boolean; // TODO add to Rel
    from_marriage?: boolean; // TODO add to Rel
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    religion?: string;
    occupation?: string[];
    father?: {
      dead?: boolean;
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      address?: {
        village?: string;
        street?: string;
        descr?: number;
      };
      occupation?: string[];
      religion?: string;
      birth?: string;
    };
    mother?: {
      dead?: boolean;
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      address?: {
        village?: string;
        street?: string;
        descr?: number;
      };
      occupation?: string[];
      religion?: string;
      birth?: string;
    };
    mother_father?: {
      dead?: boolean;
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      address?: {
        village?: string;
        street?: string;
        descr?: number;
      };
      occupation?: string[];
    }
  };
  bride: {
    _id_person: number;
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    widowed?: boolean; // TODO add to Rel
    from_marriage?: boolean; // TODO add to Rel
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    religion?: string;
    occupation?: string[];
    widow_after?: {
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      village?: string;
    };
    father?: {
      dead?: boolean;
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      address?: {
        village?: string;
        street?: string;
        descr?: number;
      };
      occupation?: string[];
      religion?: string;
      birth?: string;
    };
    mother?: {
      dead?: boolean;
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      address?: {
        village?: string;
        street?: string;
        descr?: number;
      };
      occupation?: string[];
      religion?: string;
      birth?: string;
    };
    mother_father?: {
      dead?: boolean;
      name?: string;
      normalized_name?: string;
      middle_names?: string[];
      surname?: string;
      address?: {
        village?: string;
        street?: string;
        descr?: number;
      };
      occupation?: string[];
    };
  };
  witnesses: {
    name?: string;
    normalized_name?: string;
    middle_names?: string[];
    surname?: string;
    address?: {
      village?: string;
      street?: string;
      descr?: number;
    };
    side: string;
    relationship: string;
  }[];
}
