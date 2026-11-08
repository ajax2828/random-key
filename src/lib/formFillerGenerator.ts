import {
  INDONESIAN_MALE_NAMES,
  INDONESIAN_FEMALE_NAMES,
  INDONESIAN_SURNAMES,
  INDONESIAN_STREETS,
  INDONESIAN_CITIES,
  JOBS_BY_SECTOR,
  HOBBIES,
  RELIGIONS,
  PHONE_PREFIXES,
} from './indonesianData';

import {
  randomInt,
  randomPick,
  generatePassword,
  PasswordOptions,
  ADJECTIVES,
  NOUNS,
  DOMAINS
} from './generators';

export interface FormFillerProfileOptions {
  gender: 'random' | 'male' | 'female';
  nameStyle: 'full' | 'first' | 'last';
  emailDomain: 'random' | string;
  emailStyle: 'name' | 'random' | 'word';
  passOpts: PasswordOptions;
  phonePrefix: 'random' | string;
  phoneFormat: 'dash' | 'space' | 'plain' | 'plus62';
  ageMin: number;
  ageMax: number;
  dateFormat: 'id' | 'iso' | 'slash' | 'dash';
  usernameStyle: 'name_num' | 'word_word' | 'camel' | 'random';
  addressType: 'full' | 'street' | 'city';
  jobSector: 'random' | string;
  nikProvince: 'random' | string;
  hobbyCount: number;
  educationLevel: 'random' | string;
  religionVal: 'random' | string;
}

export interface GeneratedProfile {
  id: string;
  gender: string;
  fullname?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  birthdate?: string;
  username?: string;
  address?: string;
  job?: string;
  nik?: string;
  hobby?: string;
  education?: string;
  religion?: string;
  form_link?: string;
  created_at: string;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function generateIndonesianName(gender: 'male' | 'female', nameStyle: 'full' | 'first' | 'last'): { first: string; last: string; full: string } {
  const isMale = gender === 'male';
  const firstPool = isMale ? INDONESIAN_MALE_NAMES : INDONESIAN_FEMALE_NAMES;
  
  const first = randomPick(firstPool);
  let last = '';
  if (Math.random() < 0.4) {
    last = randomPick(firstPool.filter(n => n !== first));
  } else {
    last = randomPick(INDONESIAN_SURNAMES);
  }

  let full = '';
  if (nameStyle === 'first') {
    full = first;
  } else if (nameStyle === 'last') {
    full = last;
  } else {
    full = `${first} ${last}`;
    if (Math.random() < 0.25) {
      full += ` ${randomPick(INDONESIAN_SURNAMES)}`;
    }
  }

  return { first, last, full };
}

export function generateFormFillerProfile(
  activeFields: Record<string, boolean>,
  opts: FormFillerProfileOptions
): GeneratedProfile {
  const profileId = `local-${Date.now()}-${randomInt(1000, 9999)}`;
  const gender = opts.gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : opts.gender;
  
  const result: GeneratedProfile = {
    id: profileId,
    gender: gender === 'male' ? 'Laki-laki' : 'Perempuan',
    created_at: new Date().toISOString()
  };

  const nameData = generateIndonesianName(gender, opts.nameStyle);
  if (activeFields.fullname) {
    result.fullname = nameData.full;
    result.firstName = nameData.first;
    result.lastName = nameData.last;
  }

  if (activeFields.email) {
    let emailPrefix = '';
    if (opts.emailStyle === 'name') {
      const sep = Math.random() > 0.5 ? '.' : '';
      emailPrefix = `${nameData.first.toLowerCase()}${sep}${nameData.last.toLowerCase()}`;
      if (Math.random() > 0.3) emailPrefix += randomInt(1, 999);
    } else if (opts.emailStyle === 'word') {
      emailPrefix = `${randomPick(ADJECTIVES)}${randomPick(NOUNS)}${randomInt(10, 99)}`;
    } else {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      for (let i = 0; i < 8; i++) {
        emailPrefix += chars.charAt(randomInt(0, chars.length - 1));
      }
      emailPrefix += randomInt(10, 99);
    }
    const domain = opts.emailDomain === 'random' ? randomPick(DOMAINS) : `@${opts.emailDomain}`;
    result.email = emailPrefix + domain;
  }

  if (activeFields.password) {
    result.password = generatePassword(opts.passOpts);
  }

  if (activeFields.phone) {
    let prefix = '';
    if (opts.phonePrefix === 'random') {
      const keys = Object.keys(PHONE_PREFIXES);
      const randomKey = randomPick(keys);
      prefix = randomPick(PHONE_PREFIXES[randomKey]);
    } else {
      const keys = Object.keys(PHONE_PREFIXES);
      if (keys.includes(opts.phonePrefix)) {
        prefix = randomPick(PHONE_PREFIXES[opts.phonePrefix]);
      } else {
        prefix = opts.phonePrefix;
      }
    }

    const restLength = randomInt(7, 8);
    let restDigits = '';
    for (let i = 0; i < restLength; i++) {
      restDigits += randomInt(0, 9);
    }

    const fullPhone = prefix + restDigits;

    if (opts.phoneFormat === 'dash') {
      result.phone = `${fullPhone.slice(0, 4)}-${fullPhone.slice(4, 8)}-${fullPhone.slice(8)}`;
    } else if (opts.phoneFormat === 'space') {
      result.phone = `${fullPhone.slice(0, 4)} ${fullPhone.slice(4, 8)} ${fullPhone.slice(8)}`;
    } else if (opts.phoneFormat === 'plus62') {
      result.phone = `+62${fullPhone.slice(1)}`;
    } else {
      result.phone = fullPhone;
    }
  }

  const age = randomInt(opts.ageMin, opts.ageMax);
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const birthMonth = randomInt(0, 11);
  const maxDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][birthMonth];
  const birthDay = randomInt(1, maxDay);

  if (activeFields.birthdate) {
    if (opts.dateFormat === 'id') {
      result.birthdate = `${birthDay} ${INDONESIAN_MONTHS[birthMonth]} ${birthYear}`;
    } else if (opts.dateFormat === 'iso') {
      const mm = String(birthMonth + 1).padStart(2, '0');
      const dd = String(birthDay).padStart(2, '0');
      result.birthdate = `${birthYear}-${mm}-${dd}`;
    } else if (opts.dateFormat === 'slash') {
      const mm = String(birthMonth + 1).padStart(2, '0');
      const dd = String(birthDay).padStart(2, '0');
      result.birthdate = `${dd}/${mm}/${birthYear}`;
    } else {
      const mm = String(birthMonth + 1).padStart(2, '0');
      const dd = String(birthDay).padStart(2, '0');
      result.birthdate = `${dd}-${mm}-${birthYear}`;
    }
  }

  if (activeFields.username) {
    if (opts.usernameStyle === 'name_num') {
      result.username = `${nameData.first.toLowerCase()}_${nameData.last.toLowerCase()}${randomInt(1, 99)}`;
    } else if (opts.usernameStyle === 'word_word') {
      result.username = `${randomPick(ADJECTIVES)}_${randomPick(NOUNS)}`;
    } else if (opts.usernameStyle === 'camel') {
      result.username = `${nameData.first.toLowerCase()}${nameData.last.charAt(0).toUpperCase()}${nameData.last.slice(1).toLowerCase()}`;
    } else {
      const randomWord = randomPick(NOUNS);
      result.username = `${randomWord}${randomInt(100, 9999)}`;
    }
  }

  const selectedCityObj = randomPick(INDONESIAN_CITIES);

  if (activeFields.address) {
    const street = randomPick(INDONESIAN_STREETS);
    const block = randomPick(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'No. ']);
    const num = randomInt(1, 150);
    const rt = String(randomInt(1, 15)).padStart(3, '0');
    const rw = String(randomInt(1, 15)).padStart(3, '0');

    if (opts.addressType === 'street') {
      result.address = `${street} ${block}${num}`;
    } else if (opts.addressType === 'city') {
      result.address = `${selectedCityObj.city}, ${selectedCityObj.prov}`;
    } else {
      result.address = `${street} ${block}${num}, RT ${rt}/RW ${rw}, ${selectedCityObj.city}, ${selectedCityObj.prov}`;
    }
  }

  if (activeFields.job) {
    let sector = opts.jobSector;
    if (sector === 'random') {
      const keys = Object.keys(JOBS_BY_SECTOR);
      sector = randomPick(keys);
    }
    const jobPool = JOBS_BY_SECTOR[sector] || JOBS_BY_SECTOR.other;
    result.job = randomPick(jobPool);
  }

  if (activeFields.nik) {
    let cityCode = selectedCityObj.code;
    if (opts.nikProvince !== 'random') {
      const provCities = INDONESIAN_CITIES.filter(c => c.code.startsWith(opts.nikProvince));
      if (provCities.length > 0) {
        cityCode = randomPick(provCities).code;
      }
    }

    const distCode = String(randomInt(1, 12)).padStart(2, '0');

    let dd = birthDay;
    if (gender === 'female') dd += 40;
    
    const ddStr = String(dd).padStart(2, '0');
    const mmStr = String(birthMonth + 1).padStart(2, '0');
    const yyStr = String(birthYear).slice(-2);
    const counter = String(randomInt(1, 10)).padStart(4, '0');

    result.nik = `${cityCode}${distCode}${ddStr}${mmStr}${yyStr}${counter}`;
  }

  if (activeFields.hobby) {
    const list: string[] = [];
    const count = Math.min(opts.hobbyCount, HOBBIES.length);
    while (list.length < count) {
      const item = randomPick(HOBBIES);
      if (!list.includes(item)) list.push(item);
    }
    result.hobby = list.join(', ');
  }

  if (activeFields.education) {
    if (opts.educationLevel === 'random') {
      const weights = ['SD', 'SMP', 'SMA/SMK', 'SMA/SMK', 'SMA/SMK', 'D3', 'S1', 'S1', 'S2', 'S3'];
      result.education = randomPick(weights);
    } else {
      result.education = opts.educationLevel.toUpperCase();
    }
  }

  if (activeFields.religion) {
    if (opts.religionVal === 'random') {
      const rnd = Math.random() * 100;
      let cumulative = 0;
      let chosen = 'Islam';
      for (const r of RELIGIONS) {
        cumulative += r.weight;
        if (rnd <= cumulative) {
          chosen = r.name;
          break;
        }
      }
      result.religion = chosen;
    } else {
      result.religion = opts.religionVal;
    }
  }

  return result;
}

export function buildFormQueryString(profile: GeneratedProfile): string {
  const params = new URLSearchParams();
  if (profile.fullname) params.append('name', profile.fullname);
  if (profile.email) params.append('email', profile.email);
  if (profile.phone) params.append('phone', profile.phone);
  if (profile.username) params.append('username', profile.username);
  if (profile.address) params.append('address', profile.address);
  if (profile.nik) params.append('nik', profile.nik);
  if (profile.birthdate) params.append('dob', profile.birthdate);
  if (profile.job) params.append('job', profile.job);
  return params.toString();
}

export function buildFormAutofillScript(profile: GeneratedProfile): string {
  const data = JSON.stringify({
    fullname: profile.fullname || '',
    email: profile.email || '',
    password: profile.password || '',
    phone: profile.phone || '',
    username: profile.username || '',
    address: profile.address || '',
    birthdate: profile.birthdate || '',
    nik: profile.nik || '',
    job: profile.job || '',
    education: profile.education || '',
    religion: profile.religion || '',
    hobby: profile.hobby || '',
    gender: profile.gender || '',
  });

  return `javascript:(function(){
    var data = ${data};
    var inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(function(i){
      var n = (i.name || i.id || i.placeholder || i.getAttribute('aria-label') || '').toLowerCase();
      if(!n) return;
      if(n.includes('name') || n.includes('nama')) i.value = data.fullname;
      else if(n.includes('email') || n.includes('surel')) i.value = data.email;
      else if(n.includes('pass') || n.includes('sandi')) i.value = data.password;
      else if(n.includes('phone') || n.includes('telp') || n.includes('hp') || n.includes('mobile')) i.value = data.phone;
      else if(n.includes('user') || n.includes('username')) i.value = data.username;
      else if(n.includes('alamat') || n.includes('address')) i.value = data.address;
      else if(n.includes('nik') || n.includes('ktp')) i.value = data.nik;
      else if(n.includes('lahir') || n.includes('birth') || n.includes('dob')) i.value = data.birthdate;
      else if(n.includes('kerja') || n.includes('job') || n.includes('profesi')) i.value = data.job;
      else if(n.includes('didik') || n.includes('edu')) i.value = data.education;
      else if(n.includes('agama') || n.includes('religion')) i.value = data.religion;
      else if(n.includes('hobi') || n.includes('hobby')) i.value = data.hobby;
      i.dispatchEvent(new Event('input', { bubbles: true }));
      i.dispatchEvent(new Event('change', { bubbles: true }));
    });
    alert('Form berhasil di-fill secara otomatis dengan profil: ' + data.fullname);
  })();`;
}
