#!/usr/bin/env node
/**
 * Dry-run scanner: finds className props on @celestia-project/ui component usages.
 * Outputs a JSON report without modifying any files.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); } catch { console.error("typescript not found — install it first"); process.exit(1); }

const ROOT = "/Users/870041/Desktop/project/hexbuffer/src";
const CELESTIA_PKG = "@celestia-project/ui";

// Collect all celestia-imported identifiers per file
function getCelestiaImports(sourceFile) {
  const names = new Set();
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const mod = stmt.moduleSpecifier;
    if (!ts.isStringLiteral(mod) || mod.text !== CELESTIA_PKG) continue;
    const clause = stmt.importClause;
    if (!clause?.namedBindings) continue;
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        // skip type-only imports
        if (el.isTypeOnly) continue;
        names.add(el.name.text);
      }
    }
  }
  return names;
}

// Walk JSX elements and find className attrs on celestia components
function scanFile(filePath) {
  const src = readFileSync(filePath, "utf-8");
  const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const celestiaNames = getCelestiaImports(sf);
  if (celestiaNames.size === 0) return [];

  const results = [];

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName;
      let componentName = null;
      if (ts.isIdentifier(tagName)) {
        componentName = tagName.text;
      } else if (ts.isPropertyAccessExpression(tagName)) {
        // e.g. Dialog.Content — check root identifier
        const root = tagName.expression;
        if (ts.isIdentifier(root)) componentName = root.text + "." + tagName.name.text;
      }
      if (componentName && celestiaNames.has(componentName.split(".")[0])) {
        // Find className attribute
        const attrs = node.attributes.properties;
        for (const attr of attrs) {
          if (!ts.isJsxAttribute(attr)) continue;
          if (attr.name.getText() !== "className") continue;
          const init = attr.initializer;
          let valueStr = "";
          if (init && ts.isStringLiteral(init)) {
            valueStr = init.text;
          } else if (init && ts.isJsxExpression(init) && init.expression) {
            valueStr = init.expression.getFullText().trim();
          }
          const { line } = sf.getLineAndCharacterOfPosition(attr.getStart());
          results.push({
            file: filePath,
            line: line + 1,
            component: componentName,
            // Keep the full expression: classification downstream depends on every
            // token, so truncating here silently understates the risk buckets.
            className: valueStr,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return results;
}

// Recursive file walker
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const allFindings = [];
for (const f of files) {
  const findings = scanFile(f);
  allFindings.push(...findings);
}

console.log(JSON.stringify(allFindings, null, 2));
console.error(`\nScanned ${files.length} files → ${allFindings.length} className-on-celestia hits.`);