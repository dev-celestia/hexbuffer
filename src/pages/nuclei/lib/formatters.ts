import type { NucleiFinding, ScanSummaryStats } from '../types';

/**
 * Generates an OASIS SARIF v2.1.0 report for CI/CD and security dashboard integration.
 */
export function generateSarifReport(findings: NucleiFinding[], scanTarget = 'Target'): string {
  const levelMap: Record<string, 'error' | 'warning' | 'note' | 'none'> = {
    critical: 'error',
    high: 'error',
    medium: 'warning',
    low: 'note',
    info: 'note',
  };

  const rules = Array.from(new Set(findings.map((f) => f.template_id))).map((templateId) => {
    const finding = findings.find((f) => f.template_id === templateId)!;
    return {
      id: finding.template_id,
      name: finding.template_name,
      shortDescription: {
        text: finding.description || finding.template_name,
      },
      help: {
        text: finding.remediation || `Detected via Nuclei template ${finding.template_id}`,
      },
      properties: {
        tags: finding.tags || [],
        precision: 'high',
        'security-severity':
          finding.severity === 'critical'
            ? '9.8'
            : finding.severity === 'high'
            ? '7.5'
            : finding.severity === 'medium'
            ? '5.0'
            : '2.0',
      },
    };
  });

  const results = findings.map((f) => ({
    ruleId: f.template_id,
    level: levelMap[f.severity] || 'note',
    message: {
      text: `[${f.severity.toUpperCase()}] ${f.template_name} matched at ${f.matched_url}${
        f.extracted_results?.length ? ` (Extracted: ${f.extracted_results.join(', ')})` : ''
      }`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: f.matched_url,
          },
          region: {
            startLine: 1,
          },
        },
      },
    ],
  }));

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Nuclei-Run',
            version: '0.1.0',
            informationUri: 'https://github.com/projectdiscovery/nuclei',
            rules,
          },
        },
        invocations: [
          {
            executionSuccessful: true,
            startTimeUtc: new Date().toISOString(),
          },
        ],
        results,
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

/**
 * Generates JSON Lines (.jsonl) report.
 */
export function generateJsonlReport(findings: NucleiFinding[]): string {
  return findings.map((f) => JSON.stringify(f)).join('\n');
}

/**
 * Generates formatted CSV table report.
 */
export function generateCsvReport(findings: NucleiFinding[]): string {
  const headers = ['Template ID', 'Template Name', 'Severity', 'Protocol', 'Matched URL', 'CVE ID', 'Timestamp', 'Extracted Data'];
  const rows = findings.map((f) => [
    `"${(f.template_id || '').replace(/"/g, '""')}"`,
    `"${(f.template_name || '').replace(/"/g, '""')}"`,
    `"${f.severity}"`,
    `"${f.protocol}"`,
    `"${(f.matched_url || '').replace(/"/g, '""')}"`,
    `"${(f.cve_id || '').replace(/"/g, '""')}"`,
    `"${f.matched_at}"`,
    `"${(f.extracted_results?.join('; ') || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates Markdown Executive Summary Report.
 */
export function generateMarkdownSummary(findings: NucleiFinding[], stats: ScanSummaryStats, target: string): string {
  const criticals = findings.filter((f) => f.severity === 'critical');
  const highs = findings.filter((f) => f.severity === 'high');
  const mediums = findings.filter((f) => f.severity === 'medium');
  const lows = findings.filter((f) => f.severity === 'low');
  const infos = findings.filter((f) => f.severity === 'info');

  return `# Nuclei Vulnerability Assessment Report

**Target Scope:** \`${target || 'Multiple Targets'}\`  
**Scan Timestamp:** ${new Date().toUTCString()}  
**Engine:** Nuclei-Run v0.1.0 (Rust SIMD Acceleration)

---

## Executive Summary

| Metric | Value |
| --- | --- |
| **Total Findings** | **${findings.length}** |
| 🔴 **Critical** | ${criticals.length} |
| 🟠 **High** | ${highs.length} |
| 🟡 **Medium** | ${mediums.length} |
| 🔵 **Low** | ${lows.length} |
| ⚪ **Info** | ${infos.length} |
| **Requests Sent** | ${stats.total_requests.toLocaleString()} |
| **Average RPS** | ${stats.avg_rps.toFixed(1)} req/s |
| **Elapsed Duration** | ${(stats.elapsed_millis / 1000).toFixed(2)}s |

---

## Detailed Findings

${
  findings.length === 0
    ? '_No vulnerabilities detected during this assessment._'
    : findings
        .map(
          (f, idx) => `### ${idx + 1}. [${f.severity.toUpperCase()}] ${f.template_name}

- **Template ID:** \`${f.template_id}\` ${f.cve_id ? `(\`${f.cve_id}\`)` : ''}
- **Protocol:** \`${f.protocol.toUpperCase()}\`
- **Matched Location:** \`${f.matched_url}\`
- **Discovered At:** ${f.matched_at}
${f.extracted_results && f.extracted_results.length > 0 ? `- **Extracted Evidence:** \`${f.extracted_results.join(', ')}\`` : ''}
${f.description ? `\n> ${f.description}` : ''}
${f.remediation ? `\n**Remediation:**  \n${f.remediation}` : ''}
`
        )
        .join('\n---\n\n')
}
`;
}

/**
 * Builds copyable cURL command for testing or reproducing a finding.
 */
export function generateCurlCommand(finding: NucleiFinding): string {
  if (finding.curl_command) return finding.curl_command;
  return `curl -i -s -k -X GET "${finding.matched_url}"`;
}
