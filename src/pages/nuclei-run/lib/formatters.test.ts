import { describe, expect, it } from 'vitest';
import {
  generateCsvReport,
  generateCurlCommand,
  generateJsonlReport,
  generateMarkdownSummary,
  generateSarifReport,
} from './formatters';
import type { NucleiFinding, ScanSummaryStats } from '../types';

function finding(overrides: Partial<NucleiFinding> = {}): NucleiFinding {
  return {
    id: 'f1',
    template_id: 'cve-2024-1234',
    template_name: 'Example Check',
    severity: 'high',
    matched_url: 'https://example.test/login',
    matched_at: '2026-01-01T00:00:00.000Z',
    extracted_results: [],
    protocol: 'http',
    ...overrides,
  };
}

function stats(overrides: Partial<ScanSummaryStats> = {}): ScanSummaryStats {
  return {
    total_findings: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total_requests: 0,
    avg_rps: 0,
    elapsed_millis: 0,
    targets_count: 0,
    templates_count: 0,
    ...overrides,
  };
}

describe('generateCurlCommand', () => {
  it('prefers the curl command recorded on the finding', () => {
    expect(generateCurlCommand(finding({ curl_command: 'curl -X POST https://x/' }))).toBe(
      'curl -X POST https://x/',
    );
  });

  it('builds a GET command from the matched url when none was recorded', () => {
    expect(generateCurlCommand(finding())).toBe(
      'curl -i -s -k -X GET "https://example.test/login"',
    );
  });

  it('treats an empty recorded command as absent', () => {
    expect(generateCurlCommand(finding({ curl_command: '' }))).toContain('curl -i -s -k');
  });
});

describe('generateJsonlReport', () => {
  it('emits one JSON object per line, in order', () => {
    const report = generateJsonlReport([
      finding({ id: 'a', template_id: 't-a' }),
      finding({ id: 'b', template_id: 't-b' }),
    ]);

    const lines = report.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => JSON.parse(l).id)).toEqual(['a', 'b']);
  });

  it('produces an empty string for no findings', () => {
    expect(generateJsonlReport([])).toBe('');
  });
});

describe('generateCsvReport', () => {
  it('emits the header row alone when there are no findings', () => {
    const report = generateCsvReport([]);

    expect(report.split('\n')).toHaveLength(1);
    expect(report).toBe(
      'Template ID,Template Name,Severity,Protocol,Matched URL,CVE ID,Timestamp,Extracted Data',
    );
  });

  it('emits one row per finding after the header', () => {
    const report = generateCsvReport([finding({ id: 'a' }), finding({ id: 'b' })]);

    expect(report.split('\n')).toHaveLength(3);
  });

  it('doubles embedded quotes so a value cannot break the row', () => {
    // The CSV rule: a `"` inside a quoted field is written as `""`.
    const report = generateCsvReport([finding({ template_name: 'He said "hi"' })]);

    expect(report).toContain('"He said ""hi"""');
  });

  it('joins extracted results with a semicolon', () => {
    const report = generateCsvReport([finding({ extracted_results: ['a', 'b'] })]);

    expect(report.split('\n')[1]).toContain('"a; b"');
  });

  it('writes an empty string for an absent CVE id', () => {
    const report = generateCsvReport([finding()]);

    expect(report.split('\n')[1].split(',')[5]).toBe('""');
  });
});

describe('generateSarifReport', () => {
  function parse(findings: NucleiFinding[]) {
    return JSON.parse(generateSarifReport(findings, 'example.test'));
  }

  it('emits a SARIF 2.1.0 document naming the driver', () => {
    const sarif = parse([finding()]);

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.$schema).toContain('sarif-schema-2.1.0');
    expect(sarif.runs[0].tool.driver.name).toBe('Nuclei-Run');
    expect(sarif.runs[0].invocations[0].executionSuccessful).toBe(true);
    expect(typeof sarif.runs[0].invocations[0].startTimeUtc).toBe('string');
  });

  it('emits one rule per template, not one per finding', () => {
    const sarif = parse([
      finding({ id: 'a', template_id: 'shared' }),
      finding({ id: 'b', template_id: 'shared' }),
      finding({ id: 'c', template_id: 'other' }),
    ]);

    expect(sarif.runs[0].tool.driver.rules.map((r: { id: string }) => r.id)).toEqual([
      'shared',
      'other',
    ]);
    // ...but every finding still gets its own result.
    expect(sarif.runs[0].results).toHaveLength(3);
  });

  it.each([
    ['critical', 'error', '9.8'],
    ['high', 'error', '7.5'],
    ['medium', 'warning', '5.0'],
    ['low', 'note', '2.0'],
    ['info', 'note', '2.0'],
  ] as const)('maps severity %s to level %s and score %s', (severity, level, score) => {
    const sarif = parse([finding({ severity })]);

    expect(sarif.runs[0].results[0].level).toBe(level);
    expect(sarif.runs[0].tool.driver.rules[0].properties['security-severity']).toBe(score);
  });

  it('falls back to the template name when the description is empty', () => {
    const sarif = parse([finding({ template_name: 'Fallback Name', description: '' })]);

    expect(sarif.runs[0].tool.driver.rules[0].shortDescription.text).toBe('Fallback Name');
  });

  it('falls back to a generic help text when remediation is empty', () => {
    const sarif = parse([finding({ template_id: 't-1', remediation: undefined })]);

    expect(sarif.runs[0].tool.driver.rules[0].help.text).toBe(
      'Detected via Nuclei template t-1',
    );
  });

  it('points each result at the matched url', () => {
    const sarif = parse([finding({ matched_url: 'https://example.test/admin' })]);

    const location = sarif.runs[0].results[0].locations[0].physicalLocation;
    expect(location.artifactLocation.uri).toBe('https://example.test/admin');
    expect(location.region.startLine).toBe(1);
  });

  it('lists extracted evidence in the message only when there is some', () => {
    const withEvidence = parse([finding({ extracted_results: ['user=admin'] })]);
    expect(withEvidence.runs[0].results[0].message.text).toContain('(Extracted: user=admin)');

    const without = parse([finding({ extracted_results: [] })]);
    expect(without.runs[0].results[0].message.text).not.toContain('Extracted');
  });

  it('uppercases the severity in the message', () => {
    const sarif = parse([finding({ severity: 'medium' })]);

    expect(sarif.runs[0].results[0].message.text).toMatch(/^\[MEDIUM\]/);
  });

  it('handles an empty finding list', () => {
    const sarif = parse([]);

    expect(sarif.runs[0].tool.driver.rules).toEqual([]);
    expect(sarif.runs[0].results).toEqual([]);
  });
});

describe('generateMarkdownSummary', () => {
  it('counts findings per severity', () => {
    const report = generateMarkdownSummary(
      [
        finding({ severity: 'critical' }),
        finding({ severity: 'critical' }),
        finding({ severity: 'high' }),
        finding({ severity: 'medium' }),
        finding({ severity: 'low' }),
        finding({ severity: 'info' }),
      ],
      stats(),
      'example.test',
    );

    expect(report).toContain('| **Total Findings** | **6** |');
    expect(report).toContain('| 🔴 **Critical** | 2 |');
    expect(report).toContain('| 🟠 **High** | 1 |');
    expect(report).toContain('| 🟡 **Medium** | 1 |');
    expect(report).toContain('| 🔵 **Low** | 1 |');
    expect(report).toContain('| ⚪ **Info** | 1 |');
  });

  it('renders a placeholder instead of a findings list when there are none', () => {
    const report = generateMarkdownSummary([], stats(), 'example.test');

    expect(report).toContain('_No vulnerabilities detected during this assessment._');
    expect(report).not.toContain('### 1.');
  });

  it('names the target, falling back when it is empty', () => {
    expect(generateMarkdownSummary([], stats(), 'example.test')).toContain(
      '**Target Scope:** `example.test`',
    );
    expect(generateMarkdownSummary([], stats(), '')).toContain(
      '**Target Scope:** `Multiple Targets`',
    );
  });

  it('formats the run statistics', () => {
    const report = generateMarkdownSummary(
      [],
      stats({ total_requests: 1234567, avg_rps: 12.345, elapsed_millis: 2500 }),
      'example.test',
    );

    // Delegates to locale formatting rather than printing raw digits.
    expect(report).toContain(`| **Requests Sent** | ${(1234567).toLocaleString()} |`);
    expect(report).toContain('| **Average RPS** | 12.3 req/s |');
    expect(report).toContain('| **Elapsed Duration** | 2.50s |');
  });

  it('numbers the findings from one and includes the CVE when present', () => {
    const report = generateMarkdownSummary(
      [finding({ cve_id: 'CVE-2024-1234' }), finding({ template_name: 'Second' })],
      stats(),
      'example.test',
    );

    expect(report).toContain('### 1. [HIGH] Example Check');
    expect(report).toContain('### 2. [HIGH] Second');
    expect(report).toContain('(`CVE-2024-1234`)');
  });

  it('includes remediation and evidence blocks only when present', () => {
    const withBoth = generateMarkdownSummary(
      [finding({ remediation: 'Upgrade it.', extracted_results: ['leaked=1'] })],
      stats(),
      't',
    );
    expect(withBoth).toContain('**Remediation:**');
    expect(withBoth).toContain('**Extracted Evidence:** `leaked=1`');

    const withNeither = generateMarkdownSummary([finding()], stats(), 't');
    expect(withNeither).not.toContain('**Remediation:**');
    expect(withNeither).not.toContain('**Extracted Evidence:**');
  });
});
