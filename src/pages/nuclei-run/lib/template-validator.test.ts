import { describe, expect, it } from 'vitest';
import { validateNucleiTemplate } from './template-validator';
import type { ProtocolType } from '../types';

/**
 * A template that satisfies every check. The "one thing changed" cases below start from this, so a
 * failure points at the single field under test rather than at an unrelated missing piece.
 */
const VALID_TEMPLATE = `id: cve-2024-1234

info:
  name: Example Check
  author: tester
  severity: high
  tags: cve,example

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
`;

/** Same template, with the protocol block replaced. */
function withProtocol(block: string): string {
  return `id: test-template

info:
  name: Test
  severity: info

${block}
  - method: GET
    path:
      - "{{BaseURL}}/"
`;
}

function errorsOf(result: ReturnType<typeof validateNucleiTemplate>) {
  return result.diagnostics.filter((d) => d.type === 'error');
}

function warningsOf(result: ReturnType<typeof validateNucleiTemplate>) {
  return result.diagnostics.filter((d) => d.type === 'warning');
}

describe('validateNucleiTemplate — acceptance', () => {
  it('accepts a complete template and reports no diagnostics', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE);

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('returns the metadata it detected', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE);

    expect(result.metadata).toEqual({
      id: 'cve-2024-1234',
      name: 'Example Check',
      severity: 'high',
      author: 'tester',
      protocol: 'http',
      tags: ['cve', 'example'],
    });
  });

  it('strips quotes from scalar values', () => {
    const result = validateNucleiTemplate(
      VALID_TEMPLATE.replace('id: cve-2024-1234', 'id: "cve-2024-1234"').replace(
        'name: Example Check',
        "name: 'Example Check'",
      ),
    );

    expect(result.metadata?.id).toBe('cve-2024-1234');
    expect(result.metadata?.name).toBe('Example Check');
  });

  it('matches severity case-insensitively', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('severity: high', 'severity: HIGH'));

    expect(result.valid).toBe(true);
    expect(result.metadata?.severity).toBe('high');
  });

  it('splits tags on commas and trims the parts', () => {
    const result = validateNucleiTemplate(
      VALID_TEMPLATE.replace('tags: cve,example', 'tags: cve , example ,owasp'),
    );

    expect(result.metadata?.tags).toEqual(['cve', 'example', 'owasp']);
  });

  it('ignores comments and blank lines', () => {
    // A commented-out `id:` must not satisfy the mandatory-field check.
    const result = validateNucleiTemplate(`# id: commented-out\n\ninfo:\n  name: Test\n`);

    expect(result.valid).toBe(false);
    expect(errorsOf(result).map((d) => d.message)).toContain(
      'Missing mandatory top-level field "id".',
    );
  });
});

describe('validateNucleiTemplate — empty input', () => {
  it('rejects empty content with a single error at 1:1', () => {
    const result = validateNucleiTemplate('');

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      { type: 'error', message: 'Template content cannot be empty.', line: 1, column: 1 },
    ]);
  });

  it('treats whitespace-only content as empty', () => {
    const result = validateNucleiTemplate('   \n\n\t\n');

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toBe('Template content cannot be empty.');
  });
});

describe('validateNucleiTemplate — mandatory fields', () => {
  it.each([
    ['id', 'Missing mandatory top-level field "id".'],
    ['info', 'Missing mandatory "info" metadata block.'],
    ['name', 'Missing mandatory field "info.name".'],
    ['protocol', 'Missing protocol execution block (e.g., http, dns, ssl, tcp, headless).'],
  ])('rejects a template with no %s', (field, message) => {
    const stripped = VALID_TEMPLATE.split('\n')
      .filter((line) => {
        const t = line.trim();
        if (field === 'id') return !t.startsWith('id:');
        if (field === 'info') return !t.startsWith('info:');
        if (field === 'name') return !t.startsWith('name:');
        return !t.startsWith('http:');
      })
      .join('\n');

    const result = validateNucleiTemplate(stripped);

    expect(result.valid).toBe(false);
    expect(errorsOf(result).map((d) => d.message)).toContain(message);
  });

  it('omits metadata entirely when the template is invalid', () => {
    // Metadata is what a caller would use to save the template, so a partial object here would be
    // worse than none.
    const result = validateNucleiTemplate('info:\n  name: No id or protocol\n');

    expect(result.valid).toBe(false);
    expect(result.metadata).toBeUndefined();
  });
});

describe('validateNucleiTemplate — severity', () => {
  it('treats a missing severity as a warning, not an error', () => {
    // Nuclei itself defaults this, so the template is still usable.
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('  severity: high\n', ''));

    expect(result.valid).toBe(true);
    expect(warningsOf(result).map((d) => d.message)).toEqual([
      'Missing field "info.severity". Defaulting to "info".',
    ]);
    expect(result.metadata?.severity).toBe('info');
  });

  it('rejects an unrecognised severity', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('severity: high', 'severity: urgent'));

    expect(result.valid).toBe(false);
    expect(errorsOf(result).map((d) => d.message)).toEqual([
      'Invalid severity "urgent". Must be one of: critical, high, medium, low, info.',
    ]);
  });
});

describe('validateNucleiTemplate — id format', () => {
  it('warns but still accepts an id with unusual characters', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('cve-2024-1234', 'cve 2024'));

    expect(result.valid).toBe(true);
    expect(warningsOf(result).map((d) => d.message)).toEqual([
      'Template ID should contain only alphanumeric characters, dashes, and underscores.',
    ]);
  });

  it('rejects an empty id value', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('id: cve-2024-1234', 'id:'));

    expect(result.valid).toBe(false);
    expect(errorsOf(result).map((d) => d.message)).toContain('Field "id" must not be empty.');
  });
});

describe('validateNucleiTemplate — defaults', () => {
  it('falls back to a placeholder name when info.name is present but empty', () => {
    // `name:` counts as present, so this is the one default that is actually reachable.
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('name: Example Check', 'name:'));

    expect(result.valid).toBe(true);
    expect(result.metadata?.name).toBe('Custom Vulnerability Check');
  });

  it('falls back to a default author', () => {
    const result = validateNucleiTemplate(VALID_TEMPLATE.replace('  author: tester\n', ''));

    expect(result.metadata?.author).toBe('custom');
  });
});

describe('validateNucleiTemplate — protocol detection', () => {
  // Every member of `ProtocolType` except `file` has an alias or a keyword here. `requests` is the
  // legacy alias for `http`.
  const PROTOCOL_BLOCKS: Array<[string, ProtocolType]> = [
    ['http:', 'http'],
    ['requests:', 'http'],
    ['dns:', 'dns'],
    ['ssl:', 'ssl'],
    ['tcp:', 'tcp'],
    ['websocket:', 'websocket'],
    ['headless:', 'headless'],
    ['javascript:', 'javascript'],
    ['code:', 'code'],
    ['whois:', 'whois'],
    ['file:', 'file'],
  ];

  it.each(PROTOCOL_BLOCKS)('accepts a %s block and detects it as %s', (block, protocol) => {
    const result = validateNucleiTemplate(withProtocol(block));

    expect(errorsOf(result).map((d) => d.message)).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.metadata?.protocol).toBe(protocol);
  });

  it('covers every member of ProtocolType', () => {
    // Guards against a protocol being added to the union without a branch here — the bug this suite
    // was written to catch was exactly that (`file` was in the union but not in the validator).
    const covered = new Set(PROTOCOL_BLOCKS.map(([, protocol]) => protocol));
    const everyProtocol: ProtocolType[] = [
      'http',
      'dns',
      'ssl',
      'tcp',
      'websocket',
      'headless',
      'javascript',
      'code',
      'file',
      'whois',
    ];

    expect([...covered].sort()).toEqual([...everyProtocol].sort());
  });
});

describe('validateNucleiTemplate — metadata is scoped to the info block', () => {
  // The metadata fields were matched anywhere in the file, so an indented key of the same name won.
  // The common case is an extractor's own `name:`, which made `metadata.name` report the extractor's
  // variable instead of the template name — four of the built-in templates did exactly this.
  it('reports the template name, not an extractor name', () => {
    const result = validateNucleiTemplate(`id: scoped-name

info:
  name: Real Template Name
  author: tester
  severity: high

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
    extractors:
      - type: regex
        name: wp_version
        regex:
          - "ver=([0-9.]+)"
`);

    expect(result.metadata?.name).toBe('Real Template Name');
  });

  it('ignores an indented severity rather than validating it', () => {
    // A nested `severity:` used to be checked and, if unrecognised, reported as an error.
    const result = validateNucleiTemplate(`id: scoped-severity

info:
  name: T
  author: a
  severity: high

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
    matchers:
      - type: word
        severity: nonsense
        words:
          - "x"
`);

    expect(errorsOf(result)).toEqual([]);
    expect(result.metadata?.severity).toBe('high');
  });

  it('ignores an indented tags key', () => {
    const result = validateNucleiTemplate(`id: scoped-tags

info:
  name: T
  author: a
  severity: high
  tags: cve

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
    extractors:
      - type: regex
        tags: not,a,template,tag
        regex:
          - "x"
`);

    expect(result.metadata?.tags).toEqual(['cve']);
  });

  it('does not accept an indented id as the mandatory top-level id', () => {
    const result = validateNucleiTemplate(`info:
  name: T
  author: a
  severity: high

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
    metadata:
      id: nested-id
`);

    expect(errorsOf(result).map((d) => d.message)).toContain(
      'Missing mandatory top-level field "id".'
    );
  });

  it('does not let an indented protocol-shaped key set the protocol', () => {
    // The flow-canvas parser scopes protocol detection to indent 0; the two must agree.
    const result = validateNucleiTemplate(`id: scoped-protocol

info:
  name: T
  author: a
  severity: high

http:
  - method: GET
    path:
      - "{{BaseURL}}/"
    headers:
      ssl: "on"
`);

    expect(result.metadata?.protocol).toBe('http');
  });
});
