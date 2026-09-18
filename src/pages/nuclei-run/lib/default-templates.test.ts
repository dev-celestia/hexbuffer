/**
 * Guards the shipped template catalogue: the 26 entries in `DEFAULT_TEMPLATES` are real inputs the
 * product feeds to the parser and the validator, so they are the best regression fixture the repo has.
 *
 * The parser side is already covered by `flow/lib/ast-translator.test.ts` ("built-in templates" —
 * root/probe structure, severity and id carried through). This file covers what that block does not:
 *
 *   - the **validator** is never run over the built-ins there, which is exactly where the live bug
 *     lived: `validateNucleiTemplate` reported an extractor's own `name:` as the template name for
 *     four of these templates (`wp_version`, `db_host`, `apache_version`, `ivanti_version`);
 *   - **body block scalars** are not asserted, so `body: |` being read as the literal `"|"` (which
 *     dropped every JSON POST body) would pass unnoticed;
 *   - **id uniqueness** is not asserted, and two entries here did collide on `env-file-disclosure` —
 *     both in the TS field and in the YAML `id:`.
 *
 * Everything is pure-function; no jsdom.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_TEMPLATES } from './default-templates';
import { validateNucleiTemplate } from './template-validator';
import { nucleiYamlToGraph, graphToNucleiYaml } from '../flow/lib/ast-translator';
import { validateNucleiGraph } from '../flow/lib/graph-validator';

const yamlOf = (t: (typeof DEFAULT_TEMPLATES)[number]) => t.yaml_content ?? '';

/** The template's own `id:` line inside its YAML, which nuclei uses to identify the check. */
function yamlIdOf(yaml: string): string | null {
  const match = yaml.match(/^\s*id:\s*(\S+)/m);
  return match ? match[1].replace(/['"]/g, '') : null;
}

/** Extractor names declared in the YAML — the values that used to be mistaken for the template name. */
function extractorNames(nodes: ReturnType<typeof nucleiYamlToGraph>['nodes']): string[] {
  return nodes
    .filter((n) => n.type === 'extractorNode')
    .map((n) => (n.data as { name?: string }).name)
    .filter((name): name is string => Boolean(name));
}

const templateName = (nodes: ReturnType<typeof nucleiYamlToGraph>['nodes']) => {
  const info = nodes.find((n) => n.type === 'templateInfo');
  return (info?.data as { name?: string } | undefined)?.name;
};

describe('the built-in template catalogue is well formed', () => {
  it('is not empty', () => {
    expect(DEFAULT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('has a unique TS id for every template', () => {
    const ids = DEFAULT_TEMPLATES.map((t) => t.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, 'duplicate ids break selection, scanning and React keys').toEqual([]);
  });

  it('has a unique YAML id for every template', () => {
    const ids = DEFAULT_TEMPLATES.map((t) => yamlIdOf(yamlOf(t)));
    const duplicates = ids.filter((id, i) => id !== null && ids.indexOf(id) !== i);
    expect(duplicates, 'nuclei identifies a check by its YAML id').toEqual([]);
  });

  it('agrees between the TS id and the YAML id', () => {
    for (const template of DEFAULT_TEMPLATES) {
      expect(yamlIdOf(yamlOf(template)), template.id).toBe(template.id);
    }
  });
});

describe('every built-in template passes the validator', () => {
  it('is valid with no error diagnostics', () => {
    for (const template of DEFAULT_TEMPLATES) {
      const result = validateNucleiTemplate(yamlOf(template));
      const errors = result.diagnostics.filter((d) => d.type === 'error').map((d) => d.message);
      expect(errors, `${template.id}: ${errors.join('; ')}`).toEqual([]);
      expect(result.valid, template.id).toBe(true);
    }
  });

  it('reports the template name, never an extractor name', () => {
    // The regression this pins: `name:` was matched at any indent, so an extractor's `name:` (indent
    // 8) won and `metadata.name` came back as "db_host" / "wp_version" / "apache_version".
    for (const template of DEFAULT_TEMPLATES) {
      const yaml = yamlOf(template);
      const { nodes } = nucleiYamlToGraph(yaml);
      const extractors = extractorNames(nodes);
      const reported = validateNucleiTemplate(yaml).metadata?.name ?? '';

      expect(reported, template.id).not.toBe('');
      if (extractors.length > 0) {
        expect(extractors, `${template.id} declares extractors to check against`).not.toContain(
          reported
        );
      }
    }
  });

  it('carries the declared severity and protocol into the metadata', () => {
    for (const template of DEFAULT_TEMPLATES) {
      const metadata = validateNucleiTemplate(yamlOf(template)).metadata;
      expect(metadata?.severity, template.id).toBe(template.severity);
      expect(metadata?.protocol, template.id).toBe(template.protocol);
    }
  });
});

describe('the validator and the parser agree about each built-in', () => {
  it('reports the same template name', () => {
    // These two walk the same YAML with separate hand-rolled scanners, and they have disagreed
    // before — the protocol-scoping fix in step 9b was needed in both. A disagreement is a bug in
    // one of them, so the invariant is worth pinning directly.
    for (const template of DEFAULT_TEMPLATES) {
      const { nodes } = nucleiYamlToGraph(yamlOf(template));
      const fromValidator = validateNucleiTemplate(yamlOf(template)).metadata?.name;
      expect(templateName(nodes), template.id).toBe(fromValidator);
    }
  });

  it('produces no graph diagnostics', () => {
    for (const template of DEFAULT_TEMPLATES) {
      const { nodes, edges } = nucleiYamlToGraph(yamlOf(template));
      expect(validateNucleiGraph(nodes, edges), template.id).toEqual([]);
    }
  });
});

/**
 * The `body:` value as written in the YAML, for the inline (quoted) form. Returns `null` for the
 * block-scalar form, whose content lives on the following lines.
 */
function declaredInlineBody(yaml: string): string | null {
  const match = yaml.match(/^\s*body:\s*(.+)$/m);
  if (!match) return null;
  const raw = match[1].trim();
  if (/^[|>][-+]?$/.test(raw)) return null;
  return raw.replace(/^['"]|['"]$/g, '');
}

describe('declared request bodies survive parsing', () => {
  const withBody = DEFAULT_TEMPLATES.filter((t) => /^\s*body:/m.test(yamlOf(t)));

  it('covers templates that declare a body', () => {
    expect(withBody.length, 'no built-in declares a body — this block would be vacuous').toBeGreaterThan(0);
  });

  it('parses each declared body back byte for byte', () => {
    for (const template of withBody) {
      const expected = declaredInlineBody(yamlOf(template));
      const bodies = nucleiYamlToGraph(yamlOf(template))
        .nodes.filter((n) => n.type === 'requestNode')
        .map((n) => (n.data as { body?: string }).body);

      expect(bodies.length, `${template.id} has no request node`).toBeGreaterThan(0);
      expect(bodies, `${template.id} body`).toContain(expected);
    }
  });

  it('never reports a bare block-scalar marker as the body', () => {
    // NOTE: this assertion is a guard for the future, not coverage of the `body: |` defect. All three
    // built-in bodies are inline quoted strings — none uses the block-scalar form — so mutating the
    // block-scalar branch in `ast-translator.ts` does NOT fail this file. That path is exercised with
    // synthetic input in `flow/lib/ast-translator.test.ts`, which is where the `"|"` regression is
    // actually pinned. Stated explicitly so this block is not mistaken for covering it.
    for (const template of DEFAULT_TEMPLATES) {
      const bodies = nucleiYamlToGraph(yamlOf(template))
        .nodes.filter((n) => n.type === 'requestNode')
        .map((n) => (n.data as { body?: string }).body);
      for (const body of bodies) {
        expect(body, `${template.id} kept the block-scalar marker`).not.toBe('|');
        expect(body, `${template.id} kept the block-scalar marker`).not.toBe('>');
      }
    }
  });
});

describe('the built-ins survive an export/re-import cycle', () => {
  it('preserves the graph shape and the template name', () => {
    for (const template of DEFAULT_TEMPLATES) {
      const first = nucleiYamlToGraph(yamlOf(template));
      const second = nucleiYamlToGraph(graphToNucleiYaml(first.nodes, first.edges));

      expect(second.nodes.length, `${template.id} node count`).toBe(first.nodes.length);
      expect(second.edges.length, `${template.id} edge count`).toBe(first.edges.length);
      expect(templateName(second.nodes), `${template.id} name`).toBe(templateName(first.nodes));
    }
  });
});
