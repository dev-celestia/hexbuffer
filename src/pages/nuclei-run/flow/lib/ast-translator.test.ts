import { describe, expect, it } from 'vitest';
import { graphToNucleiYaml, nucleiYamlToGraph } from './ast-translator';
import { validateNucleiGraph } from './graph-validator';
import { DEFAULT_TEMPLATES } from '../../lib/default-templates';
import type { NucleiFlowEdge, NucleiFlowNode, NucleiNodeType } from '../types';

const yaml = (...lines: string[]) => lines.join('\n');

const INFO = ['info:', '  name: Example', '  author: tester', '  severity: high'];

const find = <T extends NucleiNodeType>(nodes: NucleiFlowNode[], type: T) =>
  nodes.find((n) => n.type === type);
const all = (nodes: NucleiFlowNode[], type: NucleiNodeType) => nodes.filter((n) => n.type === type);

const data = (node: NucleiFlowNode | undefined) => (node?.data ?? {}) as Record<string, unknown>;

/** A minimal but complete single-request HTTP template. */
const httpTemplate = (...extra: string[]) =>
  yaml(
    'id: example-template',
    ...INFO,
    '',
    'http:',
    '  - method: GET',
    '    path:',
    '      - "{{BaseURL}}/probe"',
    ...extra
  );

describe('nucleiYamlToGraph / empty input', () => {
  it('returns nothing for an empty string', () => {
    expect(nucleiYamlToGraph('')).toEqual({ nodes: [], edges: [] });
  });

  it('returns nothing for whitespace only', () => {
    expect(nucleiYamlToGraph('   \n\n  \t ')).toEqual({ nodes: [], edges: [] });
  });
});

describe('nucleiYamlToGraph / template metadata', () => {
  it('extracts id, name, author and severity', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    const info = data(find(nodes, 'templateInfo'));

    expect(info.id).toBe('example-template');
    expect(info.name).toBe('Example');
    expect(info.author).toBe('tester');
    expect(info.severity).toBe('high');
  });

  it('always puts a templateInfo node first, as the layout root', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    expect(nodes[0].id).toBe('template-root');
    expect(nodes[0].type).toBe('templateInfo');
  });

  it('falls back to defaults when the info block is missing entirely', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('http:', '  - method: GET', '    path:', '      - "{{BaseURL}}/"')
    );
    const info = data(find(nodes, 'templateInfo'));

    expect(info.id).toBe('custom-check');
    expect(info.name).toBe('custom-check');
    expect(info.author).toBe('community');
    expect(info.severity).toBe('medium');
  });

  it('ignores an unrecognised severity rather than passing it through', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', 'info:', '  name: T', '  author: a', '  severity: catastrophic')
    );
    expect(data(find(nodes, 'templateInfo')).severity).toBe('medium');
  });

  it('collects inline tags and strips the trailing comma', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', 'info:', '  name: T', '  author: a', '  severity: low', '  tags: cve,rce,')
    );
    expect(data(find(nodes, 'templateInfo')).tags).toEqual(['cve', 'rce']);
  });

  it('collects every entry of a reference list', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: T',
        '  author: a',
        '  severity: low',
        '  reference:',
        '    - https://one.example',
        '    - https://two.example'
      )
    );
    expect(data(find(nodes, 'templateInfo')).reference).toEqual([
      'https://one.example',
      'https://two.example',
    ]);
  });

  it('stops the info block at the next top-level key', () => {
    // `name:` also appears under `http:` as a request attribute; it must not win.
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: RealName',
        '  author: a',
        '  severity: low',
        'http:',
        '  - method: GET',
        '    name: NotTheTemplateName'
      )
    );
    expect(data(find(nodes, 'templateInfo')).name).toBe('RealName');
  });
});

describe('nucleiYamlToGraph / reference list boundaries (regression)', () => {
  // A `reference:` list used to be extended by *any* following `- ` item, because `inReference`
  // was never cleared. A block-style list under a later key was therefore appended to `reference`
  // and the later key came back empty.
  it('does not absorb a block-style list belonging to a later key', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: T',
        '  author: a',
        '  severity: low',
        '  reference:',
        '    - https://one.example',
        '  tags:',
        '    - cve',
        '    - rce'
      )
    );
    const info = data(find(nodes, 'templateInfo'));

    expect(info.reference).toEqual(['https://one.example']);
    // Block-style tags are still not collected as tags (only the inline `tags: a,b` form is).
    // What matters here is that they no longer corrupt `reference`.
    expect(info.tags).toEqual([]);
  });

  it('still collects consecutive reference entries', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: T',
        '  author: a',
        '  severity: low',
        '  reference:',
        '    - https://one.example',
        '    - https://two.example',
        '    - https://three.example'
      )
    );
    expect(data(find(nodes, 'templateInfo')).reference).toHaveLength(3);
  });
});

describe('nucleiYamlToGraph / description block scalar (regression)', () => {
  // `description: |` used to be read as the literal string "|" and the text was dropped.
  it('collects the indented lines of a literal block scalar', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: T',
        '  author: a',
        '  severity: low',
        '  description: |',
        '    First line.',
        '    Second line.',
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/"'
      )
    );
    expect(data(find(nodes, 'templateInfo')).description).toBe('First line.\nSecond line.');
  });

  it('collects a folded block scalar too', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', 'info:', '  name: T', '  author: a', '  severity: low', '  description: >', '    Folded text.')
    );
    expect(data(find(nodes, 'templateInfo')).description).toBe('Folded text.');
  });

  it('still reads an inline description', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', 'info:', '  name: T', '  author: a', '  severity: low', '  description: Short one.')
    );
    expect(data(find(nodes, 'templateInfo')).description).toBe('Short one.');
  });

  it('does not let a block body line be parsed as a key', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: T',
        '  author: a',
        '  severity: low',
        '  description: |',
        '    name: this is prose, not a key',
        '    tags: so is this'
      )
    );
    const info = data(find(nodes, 'templateInfo'));

    expect(info.name).toBe('T');
    expect(info.tags).toEqual([]);
    expect(info.description).toBe('name: this is prose, not a key\ntags: so is this');
  });

  it('ends the description at the next key at the same indent', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        'info:',
        '  name: T',
        '  author: a',
        '  severity: low',
        '  description: |',
        '    Body text.',
        '  tags: cve'
      )
    );
    const info = data(find(nodes, 'templateInfo'));

    expect(info.description).toBe('Body text.');
    expect(info.tags).toEqual(['cve']);
  });
});

describe('nucleiYamlToGraph / protocol detection', () => {
  const protocolCases: Array<[string, string]> = [
    ['http', 'http:'],
    ['dns', 'dns:'],
    ['tcp', 'tcp:'],
    ['ssl', 'ssl:'],
  ];

  it.each(protocolCases)('detects %s at the top level', (expected, key) => {
    const { nodes } = nucleiYamlToGraph(yaml('id: t', ...INFO, '', key, '  - method: GET'));
    expect(data(find(nodes, 'templateInfo')).protocol).toBe(expected);
  });

  it('defaults to http when no protocol key is present', () => {
    const { nodes } = nucleiYamlToGraph(yaml('id: t', ...INFO));
    expect(data(find(nodes, 'templateInfo')).protocol).toBe('http');
  });

  // Protocol detection used to run at every indent depth, so a request header that happened to be
  // named `ssl:` (or `http:`/`dns:`/`tcp:`) overrode the template's protocol - and that value is
  // copied onto every request node.
  it('is not overridden by an indented key that looks like a protocol', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/"',
        '    headers:',
        '      ssl: "on"',
        '      dns: "off"'
      )
    );
    expect(data(find(nodes, 'templateInfo')).protocol).toBe('http');
  });

  it('labels each request node with the template protocol', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    const protocol = data(find(nodes, 'templateInfo')).protocol;

    expect(protocol).toBe('http');
    expect(data(find(nodes, 'requestNode')).protocol).toBe(protocol);
  });
});

describe('nucleiYamlToGraph / flow block (regression)', () => {
  // A `flow:` block used to swallow everything after it. The termination check sat in the last arm
  // of an `else if` chain, so a following `http:` matched its own arm first and `continue`d past it.
  it('keeps the flow expression and does not swallow the following http section', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'flow: |',
        '  http(1) && http(2)',
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/a"',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/b"'
      )
    );

    expect(data(find(nodes, 'flowNode')).flowCode).toBe('http(1) && http(2)');
    expect(all(nodes, 'requestNode')).toHaveLength(2);
  });

  it('reads an inline flow expression', () => {
    const { nodes } = nucleiYamlToGraph(yaml('id: t', ...INFO, '', 'flow: http(1) && http(2)'));
    expect(data(find(nodes, 'flowNode')).flowCode).toBe('http(1) && http(2)');
  });

  it('ends the flow block at a following non-protocol key', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'flow: |', '  http(1)', 'stop-at-first-match: true')
    );
    expect(data(find(nodes, 'flowNode')).flowCode).toBe('http(1)');
  });

  it('keeps a multi-line flow expression', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'flow: |', '  http(1) &&', '  http(2)', '', 'http:', '  - method: GET')
    );
    expect(data(find(nodes, 'flowNode')).flowCode).toBe('http(1) &&\nhttp(2)');
  });

  it('links the flow node from the last request with a condition-true edge', () => {
    const { nodes, edges } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'flow: |', '  http(1)', '', 'http:', '  - method: GET', '    path:', '      - "{{BaseURL}}/"')
    );
    const flowEdge = edges.find((e) => e.target === 'flow-v3-engine');

    expect(flowEdge?.source).toBe('req-1');
    expect(flowEdge?.data?.edgeType).toBe('condition-true');
  });

  it('omits the flow node when there is no flow block', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    expect(find(nodes, 'flowNode')).toBeUndefined();
  });
});

describe('nucleiYamlToGraph / request nodes', () => {
  it('reads method, path and step id', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    const req = data(find(nodes, 'requestNode'));

    expect(req.method).toBe('GET');
    expect(req.path).toEqual(['{{BaseURL}}/probe']);
    expect(req.stepId).toBe('http-1');
  });

  it('defaults the method to GET when it is omitted', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'http:', '  - path:', '      - "{{BaseURL}}/a"')
    );
    expect(data(find(nodes, 'requestNode')).method).toBe('GET');
  });

  it('defaults the path when the block declares none', () => {
    const { nodes } = nucleiYamlToGraph(yaml('id: t', ...INFO, '', 'http:', '  - method: GET'));
    expect(data(find(nodes, 'requestNode')).path).toEqual(['{{BaseURL}}/']);
  });

  it('collects every path of a multi-path block', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/one"',
        '      - "{{BaseURL}}/two"'
      )
    );
    expect(data(find(nodes, 'requestNode')).path).toEqual([
      '{{BaseURL}}/one',
      '{{BaseURL}}/two',
    ]);
  });

  it('parses headers, preserving a colon inside the value', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/"',
        '    headers:',
        '      User-Agent: probe/1.0',
        '      X-Origin: https://example.test'
      )
    );
    expect(data(find(nodes, 'requestNode')).headers).toEqual({
      'User-Agent': 'probe/1.0',
      'X-Origin': 'https://example.test',
    });
  });

  it('reads stop-at-first-match', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'http:', '  - method: GET', '    stop-at-first-match: true')
    );
    expect(data(find(nodes, 'requestNode')).stopAtFirstMatch).toBe(true);
  });

  it('defaults stop-at-first-match to false', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    expect(data(find(nodes, 'requestNode')).stopAtFirstMatch).toBe(false);
  });

  it('splits multiple request blocks and chains them', () => {
    const { nodes, edges } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/one"',
        '  - method: POST',
        '    path:',
        '      - "{{BaseURL}}/two"'
      )
    );

    expect(all(nodes, 'requestNode')).toHaveLength(2);
    expect(edges.some((e) => e.source === 'req-1' && e.target === 'req-2')).toBe(true);
  });

  it('recognises the legacy `requests:` alias', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'requests:', '  - method: GET', '    path:', '      - "{{BaseURL}}/"')
    );
    expect(all(nodes, 'requestNode')).toHaveLength(1);
  });

  // `body: |` is the normal way to send a JSON payload, and it used to yield the literal "|".
  it('collects an inline body', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml('id: t', ...INFO, '', 'http:', '  - method: POST', '    body: hello')
    );
    expect(data(find(nodes, 'requestNode')).body).toBe('hello');
  });

  it('collects a body written as a block scalar', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: POST',
        '    path:',
        '      - "{{BaseURL}}/login"',
        '    body: |',
        '      {"username":"{{username}}"}',
        '    matchers:',
        '      - type: status',
        '        status:',
        '          - 200'
      )
    );

    expect(data(find(nodes, 'requestNode')).body).toBe('{"username":"{{username}}"}');
  });

  it('keeps every line of a multi-line block scalar body', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: POST',
        '    body: |',
        '      line one',
        '      line two'
      )
    );
    expect(data(find(nodes, 'requestNode')).body).toBe('line one\nline two');
  });
});

describe('nucleiYamlToGraph / matchers', () => {
  it('reads a status matcher and its status list', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate('    matchers:', '      - type: status', '        status:', '          - 200', '          - 302')
    );
    const matcher = data(find(nodes, 'matcherNode'));

    expect(matcher.type).toBe('status');
    expect(matcher.status).toEqual([200, 302]);
  });

  it('names a status matcher after its type when it has no words', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate('    matchers:', '      - type: status', '        status:', '          - 200')
    );
    expect(data(find(nodes, 'matcherNode')).name).toBe('match-status');
  });

  it('reads a word matcher and names it after its first word', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate('    matchers:', '      - type: word', '        words:', '          - "admin"', '          - "root"')
    );
    const matcher = data(find(nodes, 'matcherNode'));

    expect(matcher.words).toEqual(['admin', 'root']);
    expect(matcher.name).toBe('admin');
  });

  it('reads condition and negative', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate(
        '    matchers:',
        '      - type: word',
        '        condition: or',
        '        negative: true',
        '        words:',
        '          - "err"'
      )
    );
    const matcher = data(find(nodes, 'matcherNode'));

    expect(matcher.condition).toBe('or');
    expect(matcher.negative).toBe(true);
  });

  it('defaults condition to and and negative to false', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate('    matchers:', '      - type: word', '        words:', '          - "x"')
    );
    const matcher = data(find(nodes, 'matcherNode'));

    expect(matcher.condition).toBe('and');
    expect(matcher.negative).toBe(false);
  });

  it('reads part', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate('    matchers:', '      - type: regex', '        part: header', '        regex:', '          - "x"')
    );
    expect(data(find(nodes, 'matcherNode')).part).toBe('header');
  });

  it('creates one node per matcher and links each to its request', () => {
    const { nodes, edges } = nucleiYamlToGraph(
      httpTemplate(
        '    matchers:',
        '      - type: status',
        '        status:',
        '          - 200',
        '      - type: word',
        '        words:',
        '          - "ok"'
      )
    );

    expect(all(nodes, 'matcherNode')).toHaveLength(2);
    expect(
      edges.filter((e) => e.source === 'req-1' && e.target.startsWith('req-1-mat-')).length
    ).toBe(2);
  });
});

describe('nucleiYamlToGraph / extractors', () => {
  it('reads type, name, part, regex and internal', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate(
        '    extractors:',
        '      - type: regex',
        '        name: csrf_token',
        '        part: body',
        '        internal: true',
        '        regex:',
        '          - "token=([a-z0-9]+)"'
      )
    );
    const extractor = data(find(nodes, 'extractorNode'));

    expect(extractor.type).toBe('regex');
    expect(extractor.name).toBe('csrf_token');
    expect(extractor.part).toBe('body');
    expect(extractor.internal).toBe(true);
    expect(extractor.regex).toEqual(['token=([a-z0-9]+)']);
  });

  it('generates a name when the extractor declares none', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate('    extractors:', '      - type: regex', '        regex:', '          - "x"')
    );
    expect(data(find(nodes, 'extractorNode')).name).toBe('var_1');
  });

  it('numbers generated names consecutively', () => {
    const { nodes } = nucleiYamlToGraph(
      httpTemplate(
        '    extractors:',
        '      - type: regex',
        '        regex:',
        '          - "a"',
        '      - type: regex',
        '        regex:',
        '          - "b"'
      )
    );
    expect(all(nodes, 'extractorNode').map((n) => data(n).name)).toEqual(['var_1', 'var_2']);
  });
});

describe('nucleiYamlToGraph / graph wiring and layout', () => {
  it('links the first request from the template root', () => {
    const { edges } = nucleiYamlToGraph(httpTemplate());
    expect(edges).toContainEqual(
      expect.objectContaining({ source: 'template-root', target: 'req-1' })
    );
  });

  it('gives every edge the default edge type except the flow link', () => {
    const { edges } = nucleiYamlToGraph(httpTemplate());
    expect(edges.every((e) => e.data?.edgeType === 'default')).toBe(true);
  });

  it('assigns finite coordinates to every node', () => {
    const { nodes } = nucleiYamlToGraph(httpTemplate());
    for (const node of nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it('places children below their parent', () => {
    const { nodes } = nucleiYamlToGraph(
      yaml(
        'id: t',
        ...INFO,
        '',
        'http:',
        '  - method: GET',
        '    path:',
        '      - "{{BaseURL}}/a"',
        '    matchers:',
        '      - type: status',
        '        status:',
        '          - 200'
      )
    );
    const y = (id: string) => nodes.find((n) => n.id === id)!.position.y;

    expect(y('template-root')).toBeLessThan(y('req-1'));
    expect(y('req-1')).toBeLessThan(y('req-1-mat-1'));
  });

  it('produces a graph the validator accepts', () => {
    const { nodes, edges } = nucleiYamlToGraph(httpTemplate());
    expect(validateNucleiGraph(nodes, edges)).toEqual([]);
  });
});

describe('nucleiYamlToGraph / protocols with no HTTP request block', () => {
  // Known limitation, pinned so that changing it is a deliberate act: only `http:`/`requests:`
  // blocks are split into request nodes, so a dns/tcp/ssl template parses to a bare template node
  // and the validator then reports `missing-request-node`. Rendering those needs a non-HTTP node
  // model, which is a design change rather than a parser fix.
  it.each([['dns'], ['tcp'], ['ssl']])('parses a %s template to a bare template node', (key) => {
    const { nodes, edges } = nucleiYamlToGraph(yaml('id: t', ...INFO, '', `${key}:`, '  - address: "{{Host}}"'));
    const diagnostics = validateNucleiGraph(nodes, edges);

    expect(nodes.map((n) => n.type)).toEqual(['templateInfo']);
    expect(data(find(nodes, 'templateInfo')).protocol).toBe(key);
    expect(diagnostics.map((d) => d.id)).toContain('missing-request-node');
  });
});

describe('graphToNucleiYaml', () => {
  const node = (id: string, type: NucleiNodeType, nodeData: Record<string, unknown>) =>
    ({ id, type, position: { x: 0, y: 0 }, data: nodeData }) as unknown as NucleiFlowNode;
  const edge = (source: string, target: string) =>
    ({ id: `${source}-${target}`, source, target }) as unknown as NucleiFlowEdge;

  const templateNode = (overrides: Record<string, unknown> = {}) =>
    node('template-root', 'templateInfo', {
      id: 'round-trip',
      name: 'Round Trip',
      author: 'tester',
      severity: 'high',
      description: '',
      reference: [],
      tags: [],
      protocol: 'http',
      ...overrides,
    });

  it('returns an empty string when there are no nodes', () => {
    expect(graphToNucleiYaml([], [])).toBe('');
  });

  it('writes the id and info block', () => {
    const out = graphToNucleiYaml([templateNode()], []);

    expect(out).toContain('id: round-trip');
    expect(out).toContain('info:');
    expect(out).toContain('  name: Round Trip');
    expect(out).toContain('  author: tester');
    expect(out).toContain('  severity: high');
  });

  it('substitutes defaults for missing metadata', () => {
    const out = graphToNucleiYaml([node('template-root', 'templateInfo', {})], []);

    expect(out).toContain('id: custom-vulnerability-template');
    expect(out).toContain('name: Custom Vulnerability Template');
    expect(out).toContain('severity: high');
  });

  it('omits optional metadata when it is empty', () => {
    const out = graphToNucleiYaml([templateNode()], []);

    expect(out).not.toContain('description:');
    expect(out).not.toContain('reference:');
    expect(out).not.toContain('tags:');
  });

  it('writes references and tags when present', () => {
    const out = graphToNucleiYaml(
      [templateNode({ reference: ['https://one.example'], tags: ['cve', 'rce'] })],
      []
    );

    expect(out).toContain('  reference:');
    expect(out).toContain('    - https://one.example');
    expect(out).toContain('  tags: cve,rce');
  });

  it('writes a request node under the protocol key', () => {
    const out = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', {
          stepId: 'http-1',
          protocol: 'http',
          method: 'POST',
          path: ['{{BaseURL}}/submit'],
          headers: { 'X-Test': '1' },
          body: '',
          stopAtFirstMatch: false,
        }),
      ],
      [edge('template-root', 'req-1')]
    );

    expect(out).toContain('http:');
    expect(out).toContain('  - method: POST');
    expect(out).toContain('      - "{{BaseURL}}/submit"');
    expect(out).toContain('      X-Test: "1"');
  });

  it('falls back to the default path when a request has none', () => {
    const out = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', { stepId: 'http-1', protocol: 'http', method: 'GET', path: [] }),
      ],
      []
    );

    expect(out).toContain('- "{{BaseURL}}/"');
  });

  it('writes stop-at-first-match only when set', () => {
    const withFlag = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', {
          stepId: 'http-1',
          protocol: 'http',
          method: 'GET',
          path: ['{{BaseURL}}/'],
          stopAtFirstMatch: true,
        }),
      ],
      []
    );
    const withoutFlag = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', {
          stepId: 'http-1',
          protocol: 'http',
          method: 'GET',
          path: ['{{BaseURL}}/'],
          stopAtFirstMatch: false,
        }),
      ],
      []
    );

    expect(withFlag).toContain('stop-at-first-match: true');
    expect(withoutFlag).not.toContain('stop-at-first-match');
  });

  it('writes only the matchers wired to the request', () => {
    const out = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', { stepId: 'http-1', protocol: 'http', method: 'GET', path: ['{{BaseURL}}/'] }),
        node('req-1-mat-1', 'matcherNode', { type: 'status', part: 'status', status: [200], condition: 'and' }),
        node('orphan-mat', 'matcherNode', { type: 'status', part: 'status', status: [500], condition: 'and' }),
      ],
      [edge('template-root', 'req-1'), edge('req-1', 'req-1-mat-1')]
    );

    expect(out).toContain('    matchers:');
    expect(out).toContain('          - 200');
    expect(out).not.toContain('          - 500');
  });

  it('writes matcher words, condition and negative', () => {
    const out = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', { stepId: 'http-1', protocol: 'http', method: 'GET', path: ['{{BaseURL}}/'] }),
        node('req-1-mat-1', 'matcherNode', {
          type: 'word',
          part: 'body',
          words: ['admin'],
          condition: 'or',
          negative: true,
        }),
      ],
      [edge('req-1', 'req-1-mat-1')]
    );

    expect(out).toContain('        words:');
    expect(out).toContain('          - "admin"');
    expect(out).toContain('        condition: or');
    expect(out).toContain('        negative: true');
  });

  it('omits the part line for a status matcher', () => {
    const out = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', { stepId: 'http-1', protocol: 'http', method: 'GET', path: ['{{BaseURL}}/'] }),
        node('req-1-mat-1', 'matcherNode', { type: 'status', part: 'status', status: [200], condition: 'and' }),
      ],
      [edge('req-1', 'req-1-mat-1')]
    );

    expect(out).not.toContain('        part:');
  });

  it('writes extractors wired to the request', () => {
    const out = graphToNucleiYaml(
      [
        templateNode(),
        node('req-1', 'requestNode', { stepId: 'http-1', protocol: 'http', method: 'GET', path: ['{{BaseURL}}/'] }),
        node('req-1-ext-1', 'extractorNode', {
          name: 'token',
          type: 'regex',
          part: 'body',
          regex: ['abc([0-9]+)'],
          internal: true,
        }),
      ],
      [edge('req-1', 'req-1-ext-1')]
    );

    expect(out).toContain('    extractors:');
    expect(out).toContain('        name: token');
    expect(out).toContain("          - 'abc([0-9]+)'");
    expect(out).toContain('        internal: true');
  });

  it('writes the flow block when a flow node is present', () => {
    const out = graphToNucleiYaml(
      [templateNode(), node('flow-v3-engine', 'flowNode', { flowCode: 'http(1) && http(2)' })],
      []
    );

    expect(out).toContain('flow: |');
    expect(out).toContain('  http(1) && http(2)');
  });

  it('falls back to http(1) for an empty flow expression', () => {
    const out = graphToNucleiYaml([templateNode(), node('flow-v3-engine', 'flowNode', {})], []);
    expect(out).toContain('  http(1)');
  });

  it('writes no protocol section when there are no request nodes', () => {
    const out = graphToNucleiYaml([templateNode()], []);
    expect(out).not.toContain('http:');
  });

  it('uses the template protocol as the section key', () => {
    const out = graphToNucleiYaml(
      [
        templateNode({ protocol: 'dns' }),
        node('req-1', 'requestNode', { stepId: 'dns-1', protocol: 'dns', method: 'GET', path: ['{{BaseURL}}/'] }),
      ],
      []
    );

    expect(out).toContain('dns:');
  });
});

describe('built-in templates', () => {
  it('are all parseable into a graph with a root and a request probe', () => {
    expect(DEFAULT_TEMPLATES.length).toBeGreaterThan(0);

    for (const template of DEFAULT_TEMPLATES) {
      const { nodes, edges } = nucleiYamlToGraph(template.yaml_content ?? '');

      expect(nodes.filter((n) => n.type === 'templateInfo'), `${template.id} root`).toHaveLength(1);
      expect(nodes.filter((n) => n.type === 'requestNode').length, `${template.id} probe`).toBeGreaterThan(0);
      expect(validateNucleiGraph(nodes, edges), `${template.id} diagnostics`).toEqual([]);
    }
  });

  it('carry their declared severity through to the template node', () => {
    for (const template of DEFAULT_TEMPLATES) {
      const { nodes } = nucleiYamlToGraph(template.yaml_content ?? '');
      expect(data(find(nodes, 'templateInfo')).severity, template.id).toBe(template.severity);
    }
  });

  it('carry their declared id through to the template node', () => {
    for (const template of DEFAULT_TEMPLATES) {
      const { nodes } = nucleiYamlToGraph(template.yaml_content ?? '');
      expect(data(find(nodes, 'templateInfo')).id, template.id).toBe(template.id);
    }
  });
});
