export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
export type MockApiSubTab = 'endpoints' | 'logs';

export interface MockServerConfig {
  port: number;
  domainId?: string | null;
  corsEnabled: boolean;
}

export interface MockServerStatus {
  running: boolean;
  port: number;
  domainId: string | null;
  corsEnabled: boolean;
  url: string | null;
}

export interface MockDomain {
  id: string;
  hostname: string;
  ssl: boolean;
  status: string;
  createdAt: string;
}

export interface RequestMatcher {
  headerKey?: string;
  headerValue?: string;
  queryKey?: string;
  queryValue?: string;
  bodyContains?: string;
}

export interface ChaosConfig {
  latencyMode: 'none' | 'fixed' | 'random';
  latencyFixed?: number;
  latencyMin?: number;
  latencyMax?: number;
  errorRate?: number;
  errorStatus?: number;
}

export interface MockRoute {
  id: string;
  domainId: string;
  method: HttpMethod;
  path: string; // e.g. /api/users/:id
  statusCode: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  matchers: RequestMatcher[];
  chaos?: ChaosConfig;
  enabled: boolean;
  matcherEnabled: boolean;
  requestQueryParams?: { key: string; value: string; enabled: boolean }[];
  requestBody?: string;
}

export interface RequestLog {
  id: string;
  domainId: string;
  routeId: string | null;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  source?: string;
}
