export type HashType =
  | 'sha256'
  | 'md5'
  | 'sha1'
  | 'sha512'
  | 'sha224'
  | 'sha384'
  | 'blake3'
  | 'argon2'
  | 'bcrypt'
  | 'scrypt'
  | 'ntlm'
  | 'sha3-224'
  | 'sha3-256'
  | 'sha3-384'
  | 'sha3-512'
  | 'ripemd160';

// Attack Mode Types
export type AttackMode = 'straight' | 'combinator' | 'mask' | 'hybrid';

export interface StraightAttackConfig {
  mode: 'straight';
  wordlistPath: string;
  rules: string[];
}

export interface CombinatorAttackConfig {
  mode: 'combinator';
  leftWordlistPath: string;
  rightWordlistPath: string;
}

export interface MaskAttackConfig {
  mode: 'mask';
  pattern: string;
  charset: CharsetConfig;
}

export interface HybridAttackConfig {
  mode: 'hybrid';
  wordlistPath: string;
  mask: string;
}

export type AttackConfig =
  | StraightAttackConfig
  | CombinatorAttackConfig
  | MaskAttackConfig
  | HybridAttackConfig;

export interface CharsetConfig {
  lower: boolean;
  upper: boolean;
  digits: boolean;
  special: boolean;
  custom?: string;
}

export interface TargetHash {
  id: string;
  hash: string;
  algorithm: HashType;
  plaintext?: string;
  cracked: boolean;
  crackedAt?: Date;
}

export type AttackStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';

export interface TelemetryData {
  hashRate: number;
  totalTested: number;
  matchesFound: number;
  progressPercent: number;
  elapsedSeconds: number;
  etaSeconds: number | null;
  cpuUtilization: number;
  memoryUsage: number;
}

export interface AttackEngineState {
  status: AttackStatus;
  config: AttackConfig | null;
  targets: TargetHash[];
  telemetry: TelemetryData;
  results: CrackedResult[];
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
}

export interface CrackedResult {
  id: string;
  hash: string;
  plaintext: string;
  algorithm: HashType;
  crackedAt: Date;
  attempts?: number;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  rules: string[];
}

export type TabMode = 'calculator' | 'attack' | 'results';
