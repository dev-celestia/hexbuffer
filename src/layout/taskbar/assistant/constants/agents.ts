import type { ComponentType } from 'react';
import {
  ArrowClockwiseIcon,
  BroadcastIcon,
  CrownIcon,
  FileTextIcon,
  GlobeIcon,
  KeyIcon,
  SparkleIcon,
  TargetIcon,
} from '@phosphor-icons/react';

export type AgentId =
  | 'orchestrator'
  | 'http_traffic'
  | 'repeater'
  | 'intruder'
  | 'notes'
  | 'port_scanner'
  | 'jwt';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
  mentionTag: string;
}

export const AGENTS_REGISTRY: Record<AgentId, AgentInfo> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    role: 'Master Coordinator',
    description: 'Coordinates specialized cyber agents and plans multi-step workflows.',
    icon: CrownIcon,
    color: '#8B5CF6',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    borderClass: 'border-violet-500/30',
    textClass: 'text-violet-400',
    dotClass: 'bg-violet-500',
    mentionTag: '@orchestrator',
  },
  http_traffic: {
    id: 'http_traffic',
    name: 'HTTP Traffic Agent',
    role: 'Traffic & Intercept',
    description: 'Inspects proxy flows, manages live interception, and audits HTTP logs.',
    icon: GlobeIcon,
    color: '#3B82F6',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
    dotClass: 'bg-blue-500',
    mentionTag: '@traffic',
  },
  repeater: {
    id: 'repeater',
    name: 'Repeater Agent',
    role: 'Request Replay',
    description: 'Crafts, normalizes, replays, and organizes requests into collections.',
    icon: ArrowClockwiseIcon,
    color: '#10B981',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-500',
    mentionTag: '@repeater',
  },
  intruder: {
    id: 'intruder',
    name: 'Intruder Agent',
    role: 'Fuzzing & Injection',
    description: 'Detects injection points, suggests $target$ markers, and runs attacks.',
    icon: TargetIcon,
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-500',
    mentionTag: '@intruder',
  },
  notes: {
    id: 'notes',
    name: 'Notes Agent',
    role: 'Knowledge & Memory',
    description: 'Stores research findings, credential formats, and persistent notes.',
    icon: FileTextIcon,
    color: '#A855F7',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-400',
    dotClass: 'bg-purple-500',
    mentionTag: '@notes',
  },
  port_scanner: {
    id: 'port_scanner',
    name: 'Port Scanner Agent',
    role: 'Network Recon',
    description: 'Discovers open ports, identifies services and banners across targets.',
    icon: BroadcastIcon,
    color: '#06B6D4',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    borderClass: 'border-cyan-500/30',
    textClass: 'text-cyan-400',
    dotClass: 'bg-cyan-500',
    mentionTag: '@scanner',
  },
  jwt: {
    id: 'jwt',
    name: 'JWT Agent',
    role: 'JWT Security',
    description: 'Decodes tokens, tests algorithm vulnerabilities, and generates tampered tokens.',
    icon: KeyIcon,
    color: '#F43F5E',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-400',
    dotClass: 'bg-rose-500',
    mentionTag: '@jwt',
  },
};

export const ALL_AGENTS_LIST: AgentInfo[] = Object.values(AGENTS_REGISTRY);

export function getAgentInfo(agentId?: string | null): AgentInfo {
  if (!agentId) return AGENTS_REGISTRY.orchestrator;
  const normalized = agentId.toLowerCase().trim();
  if (normalized in AGENTS_REGISTRY) {
    return AGENTS_REGISTRY[normalized as AgentId];
  }
  // Loose matching for aliases
  if (normalized.includes('traffic') || normalized.includes('http')) return AGENTS_REGISTRY.http_traffic;
  if (normalized.includes('repeat')) return AGENTS_REGISTRY.repeater;
  if (normalized.includes('intrud') || normalized.includes('fuzz')) return AGENTS_REGISTRY.intruder;
  if (normalized.includes('note') || normalized.includes('memo')) return AGENTS_REGISTRY.notes;
  if (normalized.includes('port') || normalized.includes('scan')) return AGENTS_REGISTRY.port_scanner;
  if (normalized.includes('jwt') || normalized.includes('token')) return AGENTS_REGISTRY.jwt;
  return AGENTS_REGISTRY.orchestrator;
}
