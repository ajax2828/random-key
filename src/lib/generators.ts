export const FIRST_NAMES = [
  'james','emma','liam','olivia','noah','ava','william','sophia','benjamin','isabella',
  'lucas','mia','henry','charlotte','alexander','amelia','daniel','harper','matthew','evelyn',
  'jackson','aria','sebastian','luna','david','chloe','joseph','penelope','samuel','layla',
  'john','riley','owen','zoey','dylan','nora','luke','lily','andrew','eleanor',
  'gabriel','hannah','anthony','lillian','isaac','addison','elijah','aubrey','caleb','stella'
];

export const LAST_NAMES = [
  'smith','johnson','williams','brown','jones','garcia','miller','davis','rodriguez','martinez',
  'anderson','taylor','thomas','moore','jackson','martin','lee','thompson','white','harris',
  'clark','lewis','robinson','walker','young','allen','king','wright','scott','hill',
  'green','adams','baker','nelson','carter','mitchell','perez','roberts','turner','phillips'
];

export const ADJECTIVES = [
  'cool','fast','bright','dark','wild','calm','bold','keen','warm','swift',
  'brave','clever','happy','lucky','noble','sharp','smart','witty','epic','prime'
];

export const NOUNS = [
  'wolf','hawk','star','moon','fire','storm','blade','knight','shadow','thunder',
  'dragon','phoenix','tiger','falcon','viper','cobra','eagle','raven','lion','bear'
];

export const DOMAINS = ['@gmail.com','@yahoo.com','@outlook.com','@hotmail.com','@protonmail.com','@mail.com'];

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export interface EmailOptions {
  style: 'random' | 'name' | 'word';
  length: number;
  domain: string;
  includeNumbers: boolean;
  includeDots: boolean;
}

export interface PasswordOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
}

export function generateEmailPrefix(style: string, length: number, includeNumbers: boolean, includeDots: boolean): string {
  let prefix = '';

  switch (style) {
    case 'name': {
      const first = randomPick(FIRST_NAMES);
      const last = randomPick(LAST_NAMES);
      const separator = includeDots ? '.' : '';
      prefix = first + separator + last;
      if (includeNumbers) {
        prefix += randomInt(1, 999);
      }
      break;
    }
    case 'word': {
      const adj = randomPick(ADJECTIVES);
      const noun = randomPick(NOUNS);
      const separator = includeDots ? '.' : '';
      prefix = adj + separator + noun;
      if (includeNumbers) {
        prefix += randomInt(10, 99);
      }
      break;
    }
    case 'random':
    default: {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const nums = '0123456789';
      let pool = chars;
      if (includeNumbers) pool += nums;

      for (let i = 0; i < length; i++) {
        if (includeDots && i > 0 && i < length - 1 && Math.random() < 0.15) {
          prefix += '.';
        } else {
          prefix += pool.charAt(Math.floor(Math.random() * pool.length));
        }
      }
      prefix = prefix.replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');
      break;
    }
  }

  return prefix.toLowerCase();
}

export function generateEmail(opts: EmailOptions): string {
  const prefix = generateEmailPrefix(opts.style, opts.length, opts.includeNumbers, opts.includeDots);
  const domain = opts.domain === 'random' ? randomPick(DOMAINS) : opts.domain;
  return prefix + domain;
}

export function generatePassword(opts: PasswordOptions): string {
  const { length, useUpper, useLower, useNumbers, useSymbols } = opts;

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let pool = '';
  let required = '';

  if (useUpper) { pool += upper; required += upper.charAt(randomInt(0, upper.length - 1)); }
  if (useLower) { pool += lower; required += lower.charAt(randomInt(0, lower.length - 1)); }
  if (useNumbers) { pool += numbers; required += numbers.charAt(randomInt(0, numbers.length - 1)); }
  if (useSymbols) { pool += symbols; required += symbols.charAt(randomInt(0, symbols.length - 1)); }

  if (pool === '') {
    pool = lower;
    required = lower.charAt(randomInt(0, lower.length - 1));
  }

  let password = required;
  for (let i = password.length; i < length; i++) {
    password += pool.charAt(Math.floor(Math.random() * pool.length));
  }

  return shuffleString(password);
}
