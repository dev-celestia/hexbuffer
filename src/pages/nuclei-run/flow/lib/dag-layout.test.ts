import { describe, expect, it } from 'vitest';
import { calculateDagLayout } from './dag-layout';
import type { NucleiFlowEdge, NucleiFlowNode } from '../types';

const node = (id: string, type = 'requestNode'): NucleiFlowNode =>
  ({ id, type, position: { x: 0, y: 0 }, data: {} }) as unknown as NucleiFlowNode;

const edge = (source: string, target: string): NucleiFlowEdge =>
  ({ id: `${source}->${target}`, source, target }) as unknown as NucleiFlowEdge;

const at = (nodes: NucleiFlowNode[], id: string) => nodes.find((n) => n.id === id)!.position;

describe('calculateDagLayout', () => {
  it('returns an empty array for an empty graph', () => {
    expect(calculateDagLayout([], [])).toEqual([]);
  });

  it('places a lone node at the origin rank', () => {
    // Defaults: nodeWidth 290, nodeHeight 170, rankSep 90. A single node is centred on x = 0 and
    // sits one rank down, at y = 40.
    expect(calculateDagLayout([node('a')], []).map((n) => n.position)).toEqual([{ x: 0, y: 40 }]);
  });

  it('stacks a chain down the y axis', () => {
    const out = calculateDagLayout([node('a'), node('b'), node('c')], [edge('a', 'b'), edge('b', 'c')]);

    expect(at(out, 'a').y).toBeLessThan(at(out, 'b').y);
    expect(at(out, 'b').y).toBeLessThan(at(out, 'c').y);
  });

  it('gives every node in a rank the same y', () => {
    const out = calculateDagLayout(
      [node('root', 'templateInfo'), node('m1'), node('m2')],
      [edge('root', 'm1'), edge('root', 'm2')]
    );

    expect(at(out, 'm1').y).toBe(at(out, 'm2').y);
  });

  it('separates siblings by nodeWidth + nodeSep and centres the rank on x = 0', () => {
    const out = calculateDagLayout(
      [node('root', 'templateInfo'), node('m1'), node('m2')],
      [edge('root', 'm1'), edge('root', 'm2')]
    );

    // 2 nodes: total width = 2*290 + 50 = 630, so the group spans -315..315 and the centres are
    // -170 and +170 (a 340 = nodeWidth + nodeSep gap).
    expect(at(out, 'm1').x).toBe(-170);
    expect(at(out, 'm2').x).toBe(170);
    expect(at(out, 'm2').x - at(out, 'm1').x).toBe(340);
  });

  it('places a node below the longest path that reaches it', () => {
    // root -> a -> b and root -> b: b must sit below a, not beside it.
    const out = calculateDagLayout(
      [node('root', 'templateInfo'), node('a'), node('b')],
      [edge('root', 'a'), edge('a', 'b'), edge('root', 'b')]
    );

    expect(at(out, 'b').y).toBeGreaterThan(at(out, 'a').y);
  });

  it('seeds the template root at the origin rank', () => {
    const out = calculateDagLayout([node('root', 'templateInfo'), node('a')], [edge('root', 'a')]);

    expect(at(out, 'root').y).toBe(40);
  });

  it('honours the layout options', () => {
    const out = calculateDagLayout([node('a'), node('b')], [edge('a', 'b')], {
      nodeHeight: 10,
      rankSep: 5,
    });

    // y = rank * (nodeHeight + rankSep) + 40
    expect(at(out, 'b').y).toBe(55);
  });

  it('does not mutate the nodes it is given', () => {
    const input = [node('a'), node('b')];
    calculateDagLayout(input, [edge('a', 'b')]);

    expect(input[0].position).toEqual({ x: 0, y: 0 });
  });

  it('ignores edges that reference an unknown node', () => {
    const out = calculateDagLayout([node('a')], [edge('a', 'ghost')]);
    expect(out.map((n) => n.id)).toEqual(['a']);
  });

  it('returns every node even when the graph has no edges', () => {
    const out = calculateDagLayout([node('a'), node('b')], []);
    expect(out).toHaveLength(2);
  });
});

describe('calculateDagLayout / cyclic input (regression)', () => {
  // Ranks are relaxed while `newRank > existingRank`, which never converges on a cycle: the queue
  // never drains and the loop hangs forever, taking the process with it. The rank is now capped at
  // the longest possible simple path. These tests must finish; a hang means the guard was lost.
  it('terminates on a three-node cycle', () => {
    const out = calculateDagLayout(
      [node('a'), node('b'), node('c')],
      [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]
    );

    expect(out).toHaveLength(3);
    for (const n of out) {
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
  });

  it('terminates on a two-node cycle', () => {
    const out = calculateDagLayout([node('a'), node('b')], [edge('a', 'b'), edge('b', 'a')]);
    expect(out).toHaveLength(2);
  });

  it('terminates on a self-loop', () => {
    const out = calculateDagLayout([node('a')], [edge('a', 'a')]);
    expect(out).toHaveLength(1);
  });

  it('terminates on a cycle hanging off an acyclic root', () => {
    const out = calculateDagLayout(
      [node('root', 'templateInfo'), node('a'), node('b')],
      [edge('root', 'a'), edge('a', 'b'), edge('b', 'a')]
    );

    expect(out).toHaveLength(3);
  });

  it('leaves the layout of an acyclic graph unchanged by the cycle guard', () => {
    const out = calculateDagLayout([node('a'), node('b'), node('c')], [edge('a', 'b'), edge('b', 'c')]);

    expect(out.map((n) => n.position.y)).toEqual([40, 300, 560]);
  });
});
