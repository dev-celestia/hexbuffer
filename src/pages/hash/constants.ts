import type { HashType, AttackMode, RuleDefinition, CharsetConfig } from './types';

export const HASH_OPTIONS: { value: HashType; label: string; cryptoMethod: string }[] = [
  { value: 'sha256', label: 'SHA-256', cryptoMethod: 'SHA256' },
  { value: 'md5', label: 'MD5', cryptoMethod: 'MD5' },
  { value: 'sha1', label: 'SHA-1', cryptoMethod: 'SHA1' },
  { value: 'sha512', label: 'SHA-512', cryptoMethod: 'SHA512' },
  { value: 'sha224', label: 'SHA-224', cryptoMethod: 'SHA224' },
  { value: 'sha384', label: 'SHA-384', cryptoMethod: 'SHA384' },
  { value: 'blake3', label: 'BLAKE3', cryptoMethod: 'BLAKE3' },
  { value: 'ntlm', label: 'NTLM', cryptoMethod: 'NTLM' },
  { value: 'argon2', label: 'Argon2', cryptoMethod: 'ARGON2' },
  { value: 'bcrypt', label: 'bcrypt', cryptoMethod: 'BCRYPT' },
  { value: 'scrypt', label: 'scrypt', cryptoMethod: 'SCRYPT' },
  { value: 'sha3-224', label: 'SHA3-224', cryptoMethod: 'SHA3_224' },
  { value: 'sha3-256', label: 'SHA3-256', cryptoMethod: 'SHA3_256' },
  { value: 'sha3-384', label: 'SHA3-384', cryptoMethod: 'SHA3_384' },
  { value: 'sha3-512', label: 'SHA3-512', cryptoMethod: 'SHA3_512' },
  { value: 'ripemd160', label: 'RIPEMD-160', cryptoMethod: 'RIPEMD160' },
];

export const ATTACK_MODE_OPTIONS: { value: AttackMode; label: string; description: string }[] = [
  {
    value: 'straight',
    label: 'Straight',
    description: 'Dictionary attack with optional rule transformations'
  },
  {
    value: 'combinator',
    label: 'Combinator',
    description: 'Combine words from two wordlists'
  },
  {
    value: 'mask',
    label: 'Mask',
    description: 'Brute-force using character patterns'
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Dictionary + mask combination'
  }
];

export const RULE_PRESETS: RuleDefinition[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No transformations',
    rules: []
  },
  {
    id: 'best64',
    name: 'Best64',
    description: 'Top 64 most effective rules',
    rules: [
      'l', 'u', 'c', 't', 'r', 'd',
      'lc', 'lu', 'uc', 'uu',
      'c$1', 'c$!', 'c$0', 'c$9',
      'c$2', 'c$3', 'c$4', 'c$5',
      'l$1', 'l$!', 'l$0', 'l$9',
      'u$1', 'u$!', 'u$0', 'u$9',
      'T', 'L', 'r$1', 'r$!',
      'c^1', 'c^!', 'c^0', 'c^9',
      'l^1', 'l^!', 'l^0', 'l^9',
      'u^1', 'u^!', 'u^0', 'u^9'
    ]
  },
  {
    id: 'leetspeak',
    name: 'Leetspeak',
    description: 'Common leetspeak substitutions',
    rules: [
      'L',
      'lL',
      'uL',
      'cL',
      'L$1',
      'L$!',
      'L^1',
      'L^!'
    ]
  },
  {
    id: 'common',
    name: 'Common',
    description: 'Basic transformations',
    rules: [
      'l',
      'u',
      'c',
      'r',
      'd',
      'l$1',
      'l$!',
      'l$0',
      'c$1',
      'c$!',
      'u$1',
      'u$!'
    ]
  },
  {
    id: 'append-years',
    name: 'Append Years',
    description: 'Append common years',
    rules: [
      '$2$0$2$3',
      '$2$0$2$4',
      '$2$0$2$5',
      '$1$9$9$0',
      '$1$9$9$5',
      '$2$0$0$0',
      '$2$0$1$0'
    ]
  }
];

export const DEFAULT_CHARSET: CharsetConfig = {
  lower: true,
  upper: true,
  digits: true,
  special: false,
  custom: ''
};

export const CHARSET_PRESETS: { name: string; charset: CharsetConfig }[] = [
  {
    name: 'Alphanumeric',
    charset: { lower: true, upper: true, digits: true, special: false, custom: '' }
  },
  {
    name: 'Lowercase + Digits',
    charset: { lower: true, upper: false, digits: true, special: false, custom: '' }
  },
  {
    name: 'Uppercase + Digits',
    charset: { lower: false, upper: true, digits: true, special: false, custom: '' }
  },
  {
    name: 'All Printable',
    charset: { lower: true, upper: true, digits: true, special: true, custom: '' }
  },
  {
    name: 'Digits Only',
    charset: { lower: false, upper: false, digits: true, special: false, custom: '' }
  }
];

export const MASK_PLACEHOLDERS = [
  { symbol: '?l', description: 'Lowercase letter (a-z)' },
  { symbol: '?u', description: 'Uppercase letter (A-Z)' },
  { symbol: '?d', description: 'Digit (0-9)' },
  { symbol: '?s', description: 'Special character (!@#$...)' },
  { symbol: '?a', description: 'All printable ASCII' }
];

export const MASK_EXAMPLES = [
  { pattern: '?l?l?l?l?d?d', description: 'Four letters + two digits (e.g., pass12)' },
  { pattern: '?u?l?l?l?l?d?d?d', description: 'Capitalized word + three digits' },
  { pattern: '?d?d?d?d', description: 'Four-digit PIN' },
  { pattern: '?l?l?l?l?l?l?l?l', description: 'Eight lowercase letters' },
  { pattern: 'pass?d?d?d?d', description: 'Fixed prefix + four digits' }
];

export const INITIAL_TELEMETRY = {
  hashRate: 0,
  totalTested: 0,
  matchesFound: 0,
  progressPercent: 0,
  elapsedSeconds: 0,
  etaSeconds: null,
  cpuUtilization: 0,
  memoryUsage: 0
};
