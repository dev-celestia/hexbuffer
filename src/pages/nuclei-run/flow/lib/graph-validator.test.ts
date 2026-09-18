import { describe, expect, it } from 'vitest';
import { validateNucleiGraph } from './graph-validator';
import type { FlowDiagnostic, NucleiFlowEdge, NucleiFlowNode, NucleiNodeType } from '../types';

const node = (id: string, type: NucleiNodeType, data: Record<string, unknown> = {}): NucleiFlowNode =>
  ({ id, type, position: { x: 0, y: 0 }, data }) as unknown as NucleiFlowNode;

const edge = (source: string, target: string): NucleiFlowEdge =>
  ({ id: `${source}->${target}`, source, target }) as unknown as NucleiFlowEdge;

const ids = (diagnostics: FlowDiagnostic[]) => diagnostics.map((d) => d.id);

/** templateInfo root -> request probe -> status matcher, wired and warning-free. */
const validGraph = () => ({
  nodes: [
    node('template-root', 'templateInfo'),
    node('req-1', 'requestNode', { path: ['{{BaseURL}}/probe'] }),
    node('req-1-mat-1', 'matcherNode', { type: 'status' }),
  ],
  edges: [edge('template-root', 'req-1'), edge('req-1', 'req-1-mat-1')],
});

describe('validateNucleiGraph / structure', () => {
  it('reports both required pieces for an empty graph', () => {
    expect(ids(validateNucleiGraph([], []))).toEqual([
      'missing-template-info',
      'missing-request-node',
    ]);
  });

  it('reports a missing template root as an error', () => {
    const diagnostics = validateNucleiGraph([node('req-1', 'requestNode')], []);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ id: 'missing-template-info', type: 'error' })
    );
  });

  it('does not report a missing root when one is present', () => {
    expect(ids(validateNucleiGraph([node('template-root', 'templateInfo')], []))).not.toContain(
      'missing-template-info'
    );
  });

  it('reports a missing request probe as an error', () => {
    const diagnostics = validateNucleiGraph([node('template-root', 'templateInfo')], []);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ id: 'missing-request-node', type: 'error' })
    );
  });

  it('accepts a minimal wired graph with no diagnostics', () => {
    const { nodes, edges } = validGraph();
    expect(validateNucleiGraph(nodes, edges)).toEqual([]);
  });
});

describe('validateNucleiGraph / duplicate roots', () => {
  it('warns once and points at the node that will be ignored', () => {
    const diagnostics = validateNucleiGraph(
      [
        node('template-root', 'templateInfo'),
        node('template-root-2', 'templateInfo'),
        node('req-1', 'requestNode'),
      ],
      []
    );

    const duplicates = diagnostics.filter((d) => d.id === 'multiple-template-info');
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual(
      expect.objectContaining({ type: 'warning', nodeId: 'template-root-2' })
    );
  });
});

describe('validateNucleiGraph / unresolved variables', () => {
  it('warns about a variable no extractor produces', () => {
    const diagnostics = validateNucleiGraph(
      [node('template-root', 'templateInfo'), node('req-1', 'requestNode', { path: ['{{BaseURL}}/{{token}}'] })],
      []
    );

    expect(ids(diagnostics)).toContain('unresolved-var-req-1-token');
  });

  it('names the diagnostic after the node and the variable', () => {
    const diagnostics = validateNucleiGraph(
      [node('req-9', 'requestNode', { path: ['{{missing}}'] })],
      []
    );

    expect(diagnostics.find((d) => d.id === 'unresolved-var-req-9-missing')).toEqual(
      expect.objectContaining({ type: 'warning', nodeId: 'req-9' })
    );
  });

  const builtIns = [
    'BaseURL',
    'RootURL',
    'Hostname',
    'Host',
    'Port',
    'Path',
    'File',
    'Scheme',
    'randstr',
    'rand_int',
    'rand_text_alphanumeric',
  ];

  it.each(builtIns)('does not warn about the built-in %s', (name) => {
    const diagnostics = validateNucleiGraph(
      [node('req-1', 'requestNode', { path: [`{{${name}}}/x`] })],
      []
    );

    expect(ids(diagnostics).filter((id) => id.startsWith('unresolved-var-'))).toEqual([]);
  });

  it('does not warn when an extractor produces the variable', () => {
    const diagnostics = validateNucleiGraph(
      [
        node('req-1', 'requestNode', { path: ['{{BaseURL}}/{{csrf}}'] }),
        node('req-1-ext-1', 'extractorNode', { name: 'csrf' }),
      ],
      []
    );

    expect(ids(diagnostics).filter((id) => id.startsWith('unresolved-var-'))).toEqual([]);
  });

  it('inspects the body as well as the path', () => {
    const diagnostics = validateNucleiGraph(
      [node('req-1', 'requestNode', { path: ['{{BaseURL}}/'], body: '{"t":"{{secret}}"}' })],
      []
    );

    expect(ids(diagnostics)).toContain('unresolved-var-req-1-secret');
  });

  it('inspects header values', () => {
    const diagnostics = validateNucleiGraph(
      [node('req-1', 'requestNode', { path: ['{{BaseURL}}/'], headers: { Authorization: 'Bearer {{jwt}}' } })],
      []
    );

    expect(ids(diagnostics)).toContain('unresolved-var-req-1-jwt');
  });

  it('does not inspect a matcher node for variables', () => {
    const diagnostics = validateNucleiGraph(
      [node('req-1-mat-1', 'matcherNode', { words: ['{{nope}}'] })],
      []
    );

    expect(ids(diagnostics).filter((id) => id.startsWith('unresolved-var-'))).toEqual([]);
  });

  it('gives each unresolved variable its own diagnostic', () => {
    const diagnostics = validateNucleiGraph(
      [node('req-1', 'requestNode', { path: ['{{one}}', '{{two}}'] })],
      []
    );

    expect(ids(diagnostics).filter((id) => id.startsWith('unresolved-var-'))).toEqual([
      'unresolved-var-req-1-one',
      'unresolved-var-req-1-two',
    ]);
  });

  it('ignores a placeholder that is not a valid variable reference', () => {
    // The pattern only accepts word characters, so `{{ spaced }}` is not treated as a reference.
    const diagnostics = validateNucleiGraph(
      [node('req-1', 'requestNode', { path: ['{{BaseURL}}/{{ spaced }}'] })],
      []
    );

    expect(ids(diagnostics).filter((id) => id.startsWith('unresolved-var-'))).toEqual([]);
  });
});

describe('validateNucleiGraph / disconnected nodes', () => {
  it('reports a node with no edges as info', () => {
    const diagnostics = validateNucleiGraph(
      [node('template-root', 'templateInfo'), node('orphan', 'extractorNode')],
      []
    );

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ id: 'disconnected-node-orphan', type: 'info', nodeId: 'orphan' })
    );
  });

  it('does not report connected nodes', () => {
    const { nodes, edges } = validGraph();
    expect(ids(validateNucleiGraph(nodes, edges)).filter((id) => id.startsWith('disconnected-node-'))).toEqual([]);
  });

  it('skips the check for a single-node graph', () => {
    expect(ids(validateNucleiGraph([node('only', 'templateInfo')], []))).not.toContain(
      'disconnected-node-only'
    );
  });
});

describe('validateNucleiGraph / cycles', () => {
  it('accepts a diamond DAG', () => {
    const diagnostics = validateNucleiGraph(
      [node('a', 'templateInfo'), node('b', 'requestNode'), node('c', 'requestNode')],
      [edge('a', 'b'), edge('a', 'c')]
    );

    expect(ids(diagnostics)).not.toContain('cycle-detected');
  });

  it('reports a two-node cycle as an error', () => {
    const diagnostics = validateNucleiGraph(
      [node('a', 'templateInfo'), node('b', 'requestNode')],
      [edge('a', 'b'), edge('b', 'a')]
    );

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ id: 'cycle-detected', type: 'error' })
    );
  });

  it('reports a self-loop as a cycle', () => {
    const diagnostics = validateNucleiGraph([node('a', 'templateInfo')], [edge('a', 'a')]);

    expect(ids(diagnostics)).toContain('cycle-detected');
  });

  it('reports only one cycle diagnostic for a graph with several cycles', () => {
    const diagnostics = validateNucleiGraph(
      [node('a', 'templateInfo'), node('b', 'requestNode'), node('c', 'requestNode'), node('d', 'requestNode')],
      [edge('a', 'b'), edge('b', 'a'), edge('c', 'd'), edge('d', 'c')]
    );

    expect(diagnostics.filter((d) => d.id === 'cycle-detected')).toHaveLength(1);
  });
});
