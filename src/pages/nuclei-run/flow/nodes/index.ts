import { TemplateInfoNode } from './template-info-node';
import { RequestNode } from './request-node';
import { ExtractorNode } from './extractor-node';
import { MatcherNode } from './matcher-node';
import { FlowNode } from './flow-node';

export const NUCLEI_NODE_TYPES = {
  templateInfo: TemplateInfoNode,
  requestNode: RequestNode,
  extractorNode: ExtractorNode,
  matcherNode: MatcherNode,
  flowNode: FlowNode,
};

export {
  TemplateInfoNode,
  RequestNode,
  ExtractorNode,
  MatcherNode,
  FlowNode,
};
