import celestiaAvatar from '@/assets/celestia.png';
import httpAvatar from '@/assets/app-icon/http.png';
import repeaterAvatar from '@/assets/app-icon/repeater.png';
import intruderAvatar from '@/assets/app-icon/intruder.png';
import notesAvatar from '@/assets/app-icon/notes.png';
import portScannerAvatar from '@/assets/app-icon/port-scanner.png';
import jwtAvatar from '@/assets/app-icon/jwt.png';

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
  avatarUrl: string;
  /** Semantic token slug; see `--color-agent-*` in src/styles/globals.css. */
  token: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}

export const AGENTS_REGISTRY: Record<AgentId, AgentInfo> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Celestia',
    role: '',
    description: 'Coordinates specialized cyber agents and plans multi-step workflows.',
    avatarUrl: celestiaAvatar,
    token: 'agent-orchestrator',
    badgeClass: 'bg-agent-orchestrator/10 text-agent-orchestrator border-agent-orchestrator/30',
    borderClass: 'border-agent-orchestrator/30',
    textClass: 'text-agent-orchestrator',
    dotClass: 'bg-agent-orchestrator',
  },
  http_traffic: {
    id: 'http_traffic',
    name: 'HTTP Traffic Agent',
    role: 'Traffic & Intercept',
    description: 'Inspects proxy flows, manages live interception, and audits HTTP logs.',
    avatarUrl: httpAvatar,
    token: 'agent-traffic',
    badgeClass: 'bg-agent-traffic/10 text-agent-traffic border-agent-traffic/30',
    borderClass: 'border-agent-traffic/30',
    textClass: 'text-agent-traffic',
    dotClass: 'bg-agent-traffic',
  },
  repeater: {
    id: 'repeater',
    name: 'Repeater Agent',
    role: 'Request Replay',
    description: 'Crafts, normalizes, replays, and organizes requests into collections.',
    avatarUrl: repeaterAvatar,
    token: 'agent-repeater',
    badgeClass: 'bg-agent-repeater/10 text-agent-repeater border-agent-repeater/30',
    borderClass: 'border-agent-repeater/30',
    textClass: 'text-agent-repeater',
    dotClass: 'bg-agent-repeater',
  },
  intruder: {
    id: 'intruder',
    name: 'Intruder Agent',
    role: 'Fuzzing & Injection',
    description: 'Detects injection points, suggests $target$ markers, and runs attacks.',
    avatarUrl: intruderAvatar,
    token: 'agent-intruder',
    badgeClass: 'bg-agent-intruder/10 text-agent-intruder border-agent-intruder/30',
    borderClass: 'border-agent-intruder/30',
    textClass: 'text-agent-intruder',
    dotClass: 'bg-agent-intruder',
  },
  notes: {
    id: 'notes',
    name: 'Notes Agent',
    role: 'Knowledge & Memory',
    description: 'Stores research findings, credential formats, and persistent notes.',
    avatarUrl: notesAvatar,
    token: 'agent-notes',
    badgeClass: 'bg-agent-notes/10 text-agent-notes border-agent-notes/30',
    borderClass: 'border-agent-notes/30',
    textClass: 'text-agent-notes',
    dotClass: 'bg-agent-notes',
  },
  port_scanner: {
    id: 'port_scanner',
    name: 'Port Scanner Agent',
    role: 'Network Recon',
    description: 'Discovers open ports, identifies services and banners across targets.',
    avatarUrl: portScannerAvatar,
    token: 'agent-scanner',
    badgeClass: 'bg-agent-scanner/10 text-agent-scanner border-agent-scanner/30',
    borderClass: 'border-agent-scanner/30',
    textClass: 'text-agent-scanner',
    dotClass: 'bg-agent-scanner',
  },
  jwt: {
    id: 'jwt',
    name: 'JWT Agent',
    role: 'JWT Security',
    description: 'Decodes tokens, tests algorithm vulnerabilities, and generates tampered tokens.',
    avatarUrl: jwtAvatar,
    token: 'agent-jwt',
    badgeClass: 'bg-agent-jwt/10 text-agent-jwt border-agent-jwt/30',
    borderClass: 'border-agent-jwt/30',
    textClass: 'text-agent-jwt',
    dotClass: 'bg-agent-jwt',
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
  if (normalized.includes('celestia') || normalized.includes('orchestrat')) return AGENTS_REGISTRY.orchestrator;
  if (normalized.includes('traffic') || normalized.includes('http')) return AGENTS_REGISTRY.http_traffic;
  if (normalized.includes('repeat')) return AGENTS_REGISTRY.repeater;
  if (normalized.includes('intrud') || normalized.includes('fuzz')) return AGENTS_REGISTRY.intruder;
  if (normalized.includes('note') || normalized.includes('memo')) return AGENTS_REGISTRY.notes;
  if (normalized.includes('port') || normalized.includes('scan')) return AGENTS_REGISTRY.port_scanner;
  if (normalized.includes('jwt') || normalized.includes('token')) return AGENTS_REGISTRY.jwt;
  return AGENTS_REGISTRY.orchestrator;
}