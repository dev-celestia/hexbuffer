import type {
  NucleiFlowNode,
  NucleiFlowEdge,
  TemplateInfoNodeData,
  RequestNodeData,
  ExtractorNodeData,
  MatcherNodeData,
  FlowNodeData,
  HttpMethod,
  Severity,
  ProtocolType,
} from '../types';
import { calculateDagLayout } from './dag-layout';

/**
 * Parses a Nuclei YAML string into React Flow nodes and edges.
 */
export function nucleiYamlToGraph(yamlText: string): {
  nodes: NucleiFlowNode[];
  edges: NucleiFlowEdge[];
} {
  const nodes: NucleiFlowNode[] = [];
  const edges: NucleiFlowEdge[] = [];

  if (!yamlText || !yamlText.trim()) {
    return { nodes: [], edges: [] };
  }

  const lines = yamlText.split('\n');

  // Extract ID
  let templateId = 'custom-check';
  const idLine = lines.find((l) => l.trim().startsWith('id:'));
  if (idLine) {
    templateId = idLine.split(':')[1]?.trim().replace(/['"]/g, '') || templateId;
  }

  // Extract Info block
  let name = templateId;
  let author = 'community';
  let severity: Severity = 'medium';
  let description = '';
  const references: string[] = [];
  const tags: string[] = [];
  let detectedProtocol: ProtocolType = 'http';

  let inInfo = false;
  let inReference = false;
  let inHttp = false;
  let inFlow = false;
  let flowCode = '';

  // Scan info
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.search(/\S|$/);

    if (trimmed.startsWith('info:')) {
      inInfo = true;
      inReference = false;
      continue;
    }

    if (inInfo) {
      if (indent === 0 && trimmed && !trimmed.startsWith('info:')) {
        inInfo = false;
        inReference = false;
      } else {
        if (trimmed.startsWith('name:')) {
          name = trimmed.replace('name:', '').trim().replace(/^['"]|['"]$/g, '');
        } else if (trimmed.startsWith('author:')) {
          author = trimmed.replace('author:', '').trim().replace(/^['"]|['"]$/g, '');
        } else if (trimmed.startsWith('severity:')) {
          const sev = trimmed.replace('severity:', '').trim().toLowerCase();
          if (['critical', 'high', 'medium', 'low', 'info'].includes(sev)) {
            severity = sev as Severity;
          }
        } else if (trimmed.startsWith('description:')) {
          description = trimmed.replace('description:', '').trim().replace(/^['"]|['"]$/g, '');
        } else if (trimmed.startsWith('tags:')) {
          const tagsStr = trimmed.replace('tags:', '').trim().replace(/^['"]|['"]$/g, '');
          tagsStr.split(',').forEach((t) => {
            const clean = t.trim();
            if (clean) tags.push(clean);
          });
        } else if (trimmed.startsWith('reference:')) {
          inReference = true;
          continue;
        } else if (inReference) {
          if (trimmed.startsWith('-')) {
            const ref = trimmed.replace(/^[-\s]+/, '').trim();
            if (ref) references.push(ref);
          } else if (indent <= 2) {
            inReference = false;
          }
        }
      }
    }

    // Protocol detection
    if (trimmed.startsWith('http:')) {
      detectedProtocol = 'http';
      inHttp = true;
    } else if (trimmed.startsWith('dns:')) {
      detectedProtocol = 'dns';
    } else if (trimmed.startsWith('tcp:')) {
      detectedProtocol = 'tcp';
    } else if (trimmed.startsWith('ssl:')) {
      detectedProtocol = 'ssl';
    } else if (trimmed.startsWith('flow:')) {
      inFlow = true;
      const inlineFlow = trimmed.replace('flow:', '').replace(/[|>]/g, '').trim();
      if (inlineFlow) flowCode += inlineFlow + '\n';
      continue;
    } else if (inFlow) {
      if (indent > 0 && trimmed) {
        flowCode += trimmed + '\n';
      } else if (indent === 0 && trimmed) {
        inFlow = false;
      }
    }
  }

  // 1. Create Template Info Root Node
  const templateNodeId = 'template-root';
  nodes.push({
    id: templateNodeId,
    type: 'templateInfo',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'templateInfo',
      id: templateId,
      name,
      author,
      severity,
      description,
      reference: references,
      tags,
      protocol: detectedProtocol,
    } as unknown as TemplateInfoNodeData & { nodeType: 'templateInfo' },
  });

  // 2. Parse Requests, Matchers, and Extractors
  // Helper to extract nested HTTP requests blocks
  const httpBlocks: string[] = [];
  let currentBlock: string[] = [];
  let collectingRequests = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('http:') || trimmed.startsWith('requests:')) {
      collectingRequests = true;
      continue;
    }

    if (collectingRequests) {
      if (line.search(/\S|$/) === 0 && trimmed && !trimmed.startsWith('#')) {
        collectingRequests = false;
        if (currentBlock.length > 0) {
          httpBlocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
      } else {
        if (trimmed.startsWith('- method:') || (trimmed.startsWith('-') && trimmed.includes('path:'))) {
          if (currentBlock.length > 0) {
            httpBlocks.push(currentBlock.join('\n'));
            currentBlock = [];
          }
        }
        currentBlock.push(line);
      }
    }
  }
  if (currentBlock.length > 0) {
    httpBlocks.push(currentBlock.join('\n'));
  }

  let prevReqNodeId = templateNodeId;

  // Process each request block
  httpBlocks.forEach((block, reqIdx) => {
    const reqLines = block.split('\n');
    let method: HttpMethod = 'GET';
    const paths: string[] = [];
    const headers: Record<string, string> = {};
    let body = '';
    let stopAtFirstMatch = false;

    // Matcher items
    const matchers: Array<{
      type: string;
      part: string;
      words: string[];
      status: number[];
      condition: 'and' | 'or';
      negative: boolean;
    }> = [];

    // Extractor items
    const extractors: Array<{
      type: string;
      name: string;
      part: string;
      regex: string[];
      internal: boolean;
    }> = [];

    let inPaths = false;
    let inHeaders = false;
    let inMatchers = false;
    let inExtractors = false;
    let currentMatcher: {
      type: string;
      part: string;
      words: string[];
      status: number[];
      condition: 'and' | 'or';
      negative: boolean;
    } | null = null;
    let currentExtractor: {
      type: string;
      name: string;
      part: string;
      regex: string[];
      internal: boolean;
    } | null = null;
    let inWords = false;
    let inStatus = false;
    let inRegex = false;

    for (const rLine of reqLines) {
      const tr = rLine.trim();
      if (!tr) continue;

      if (tr.startsWith('method:') || tr.startsWith('- method:')) {
        method = (tr.replace(/^[-\s]*method:\s*/, '').trim().toUpperCase() as HttpMethod) || 'GET';
      } else if (tr.startsWith('path:')) {
        inPaths = true;
        inHeaders = false;
        inMatchers = false;
        inExtractors = false;
      } else if (tr.startsWith('headers:')) {
        inHeaders = true;
        inPaths = false;
        inMatchers = false;
        inExtractors = false;
      } else if (tr.startsWith('body:')) {
        body = tr.replace('body:', '').trim().replace(/^['"]|['"]$/g, '');
      } else if (tr.startsWith('stop-at-first-match:')) {
        stopAtFirstMatch = tr.includes('true');
      } else if (tr.startsWith('matchers:')) {
        inMatchers = true;
        inExtractors = false;
        inPaths = false;
        inHeaders = false;
      } else if (tr.startsWith('extractors:')) {
        inExtractors = true;
        inMatchers = false;
        inPaths = false;
        inHeaders = false;
      } else if (inPaths && tr.startsWith('-')) {
        paths.push(tr.replace(/^[-\s]+/, '').replace(/['"]/g, '').trim());
      } else if (inHeaders && tr.includes(':')) {
        const [hKey, ...hVal] = tr.replace(/^[-\s]+/, '').split(':');
        if (hKey && hVal.length > 0) {
          headers[hKey.trim()] = hVal.join(':').trim().replace(/['"]/g, '');
        }
      } else if (inMatchers) {
        if (tr.startsWith('- type:') || tr.startsWith('type:')) {
          if (currentMatcher) matchers.push(currentMatcher);
          const mType = tr.replace(/^[-\s]*type:\s*/, '').trim();
          currentMatcher = {
            type: mType || 'word',
            part: 'body',
            words: [],
            status: [],
            condition: 'and',
            negative: false,
          };
          inWords = false;
          inStatus = false;
        } else if (currentMatcher) {
          if (tr.startsWith('part:')) {
            currentMatcher.part = tr.replace('part:', '').trim();
          } else if (tr.startsWith('condition:')) {
            currentMatcher.condition = tr.includes('or') ? 'or' : 'and';
          } else if (tr.startsWith('negative:')) {
            currentMatcher.negative = tr.includes('true');
          } else if (tr.startsWith('status:')) {
            inStatus = true;
            inWords = false;
          } else if (tr.startsWith('words:')) {
            inWords = true;
            inStatus = false;
          } else if (inStatus && tr.startsWith('-')) {
            const code = parseInt(tr.replace(/^[-\s]+/, '').trim(), 10);
            if (!isNaN(code)) currentMatcher.status.push(code);
          } else if (inWords && tr.startsWith('-')) {
            currentMatcher.words.push(tr.replace(/^[-\s]+/, '').replace(/^['"]|['"]$/g, '').trim());
          }
        }
      } else if (inExtractors) {
        if (tr.startsWith('- type:') || tr.startsWith('type:')) {
          if (currentExtractor) extractors.push(currentExtractor);
          const eType = tr.replace(/^[-\s]*type:\s*/, '').trim();
          currentExtractor = {
            type: eType || 'regex',
            name: `var_${extractors.length + 1}`,
            part: 'body',
            regex: [],
            internal: false,
          };
          inRegex = false;
        } else if (currentExtractor) {
          if (tr.startsWith('name:')) {
            currentExtractor.name = tr.replace('name:', '').trim();
          } else if (tr.startsWith('part:')) {
            currentExtractor.part = tr.replace('part:', '').trim();
          } else if (tr.startsWith('internal:')) {
            currentExtractor.internal = tr.includes('true');
          } else if (tr.startsWith('regex:')) {
            inRegex = true;
          } else if (inRegex && tr.startsWith('-')) {
            currentExtractor.regex.push(tr.replace(/^[-\s]+/, '').replace(/^['"]|['"]$/g, '').trim());
          }
        }
      }
    }
    if (currentMatcher) matchers.push(currentMatcher);
    if (currentExtractor) extractors.push(currentExtractor);

    // Create Request Node
    const reqNodeId = `req-${reqIdx + 1}`;
    nodes.push({
      id: reqNodeId,
      type: 'requestNode',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'requestNode',
        stepId: `http-${reqIdx + 1}`,
        protocol: detectedProtocol,
        method,
        path: paths.length > 0 ? paths : ['{{BaseURL}}/'],
        headers,
        body,
        stopAtFirstMatch,
      } as unknown as RequestNodeData & { nodeType: 'requestNode' },
    });

    // Connect from previous node
    edges.push({
      id: `edge-${prevReqNodeId}-${reqNodeId}`,
      source: prevReqNodeId,
      target: reqNodeId,
      sourceHandle: 'source',
      targetHandle: 'target',
      data: { edgeType: 'default' },
    });

    // Create Extractor Nodes & connect with variable-pipe
    extractors.forEach((ext, extIdx) => {
      const extNodeId = `${reqNodeId}-ext-${extIdx + 1}`;
      nodes.push({
        id: extNodeId,
        type: 'extractorNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'extractorNode',
          name: ext.name,
          type: ext.type as any,
          part: ext.part as any,
          regex: ext.regex,
          internal: ext.internal,
        } as unknown as ExtractorNodeData & { nodeType: 'extractorNode' },
      });

      // Sequential connection from request to extractor
      edges.push({
        id: `edge-${reqNodeId}-${extNodeId}`,
        source: reqNodeId,
        target: extNodeId,
        sourceHandle: 'source',
        targetHandle: 'target',
        data: { edgeType: 'default' },
      });
    });

    // Create Matcher Nodes
    matchers.forEach((mat, matIdx) => {
      const matNodeId = `${reqNodeId}-mat-${matIdx + 1}`;
      nodes.push({
        id: matNodeId,
        type: 'matcherNode',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'matcherNode',
          name: mat.words[0] || `match-${mat.type}`,
          type: mat.type as any,
          part: mat.part as any,
          condition: mat.condition,
          negative: mat.negative,
          status: mat.status,
          words: mat.words,
        } as unknown as MatcherNodeData & { nodeType: 'matcherNode' },
      });

      edges.push({
        id: `edge-${reqNodeId}-${matNodeId}`,
        source: reqNodeId,
        target: matNodeId,
        sourceHandle: 'source',
        targetHandle: 'target',
        data: { edgeType: 'default' },
      });
    });

    prevReqNodeId = reqNodeId;
  });

  // 3. Flow Node (if v3 flow present)
  if (flowCode.trim()) {
    const flowNodeId = 'flow-v3-engine';
    nodes.push({
      id: flowNodeId,
      type: 'flowNode',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'flowNode',
        flowCode: flowCode.trim(),
        description: 'Nuclei v3 programmatic flow condition',
      } as unknown as FlowNodeData & { nodeType: 'flowNode' },
    });

    edges.push({
      id: `edge-${prevReqNodeId}-${flowNodeId}`,
      source: prevReqNodeId,
      target: flowNodeId,
      sourceHandle: 'source',
      targetHandle: 'target',
      data: { edgeType: 'condition-true' },
    });
  }

  // Calculate layout coordinates
  const layoutedNodes = calculateDagLayout(nodes, edges);

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * Serializes React Flow nodes and edges back into valid Nuclei v3 YAML.
 */
export function graphToNucleiYaml(
  nodes: NucleiFlowNode[],
  edges: NucleiFlowEdge[]
): string {
  if (nodes.length === 0) return '';

  const templateNode = nodes.find((n) => n.type === 'templateInfo');
  const tData = (templateNode?.data || {}) as Partial<TemplateInfoNodeData>;

  const id = tData.id || 'custom-vulnerability-template';
  const name = tData.name || 'Custom Vulnerability Template';
  const author = tData.author || 'security-analyst';
  const severity = tData.severity || 'high';
  const description = tData.description || '';
  const tags = tData.tags || ['custom'];
  const references = tData.reference || [];
  const protocol = tData.protocol || 'http';

  let yaml = `id: ${id}\n\n`;
  yaml += `info:\n`;
  yaml += `  name: ${name}\n`;
  yaml += `  author: ${author}\n`;
  yaml += `  severity: ${severity}\n`;
  if (description) {
    yaml += `  description: ${description}\n`;
  }
  if (references.length > 0) {
    yaml += `  reference:\n`;
    references.forEach((ref) => {
      yaml += `    - ${ref}\n`;
    });
  }
  if (tags.length > 0) {
    yaml += `  tags: ${tags.join(',')}\n`;
  }
  yaml += `\n`;

  // Flow node if present
  const flowNode = nodes.find((n) => n.type === 'flowNode');
  if (flowNode) {
    const fData = flowNode.data as unknown as FlowNodeData;
    yaml += `flow: |\n`;
    (fData.flowCode || 'http(1)').split('\n').forEach((fl) => {
      yaml += `  ${fl}\n`;
    });
    yaml += `\n`;
  }

  // Request Nodes
  const requestNodes = nodes.filter((n) => n.type === 'requestNode');

  if (requestNodes.length > 0) {
    yaml += `${protocol}:\n`;

    requestNodes.forEach((req) => {
      const rData = req.data as unknown as RequestNodeData;
      yaml += `  - method: ${rData.method || 'GET'}\n`;

      const paths = rData.path && rData.path.length > 0 ? rData.path : ['{{BaseURL}}/'];
      yaml += `    path:\n`;
      paths.forEach((p) => {
        yaml += `      - "${p}"\n`;
      });

      if (rData.headers && Object.keys(rData.headers).length > 0) {
        yaml += `    headers:\n`;
        Object.entries(rData.headers).forEach(([k, v]) => {
          yaml += `      ${k}: "${v}"\n`;
        });
      }

      if (rData.body) {
        yaml += `    body: |\n`;
        rData.body.split('\n').forEach((bl) => {
          yaml += `      ${bl}\n`;
        });
      }

      if (rData.stopAtFirstMatch) {
        yaml += `    stop-at-first-match: true\n`;
      }

      // Matchers connected to this request
      const connectedMatcherIds = new Set(
        edges
          .filter((e) => e.source === req.id)
          .map((e) => e.target)
      );

      const reqMatchers = nodes.filter(
        (n) => n.type === 'matcherNode' && connectedMatcherIds.has(n.id)
      );

      if (reqMatchers.length > 0) {
        yaml += `    matchers-condition: and\n`;
        yaml += `    matchers:\n`;

        reqMatchers.forEach((mat) => {
          const mData = mat.data as unknown as MatcherNodeData;
          yaml += `      - type: ${mData.type || 'status'}\n`;

          if (mData.part && mData.type !== 'status') {
            yaml += `        part: ${mData.part}\n`;
          }

          if (mData.type === 'status' && mData.status && mData.status.length > 0) {
            yaml += `        status:\n`;
            mData.status.forEach((st) => {
              yaml += `          - ${st}\n`;
            });
          }

          if (mData.words && mData.words.length > 0) {
            yaml += `        words:\n`;
            mData.words.forEach((w) => {
              yaml += `          - "${w}"\n`;
            });
          }

          if (mData.condition && mData.condition !== 'and') {
            yaml += `        condition: ${mData.condition}\n`;
          }

          if (mData.negative) {
            yaml += `        negative: true\n`;
          }
        });
      }

      // Extractors connected to this request
      const connectedExtractorIds = new Set(
        edges
          .filter((e) => e.source === req.id)
          .map((e) => e.target)
      );

      const reqExtractors = nodes.filter(
        (n) => n.type === 'extractorNode' && connectedExtractorIds.has(n.id)
      );

      if (reqExtractors.length > 0) {
        yaml += `    extractors:\n`;

        reqExtractors.forEach((ext) => {
          const eData = ext.data as unknown as ExtractorNodeData;
          yaml += `      - type: ${eData.type || 'regex'}\n`;
          yaml += `        name: ${eData.name || 'token'}\n`;
          yaml += `        part: ${eData.part || 'body'}\n`;

          if (eData.internal) {
            yaml += `        internal: true\n`;
          }

          if (eData.regex && eData.regex.length > 0) {
            yaml += `        regex:\n`;
            eData.regex.forEach((rg) => {
              yaml += `          - '${rg}'\n`;
            });
          }
        });
      }
    });
  }

  return yaml;
}
