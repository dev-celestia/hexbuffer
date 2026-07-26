import { writeDocument } from '@/triggers/documents';

export const DOCUMENTS_AI_TOOL_DEFINITION = {
  name: 'write_document',
  description: 'Write or update a markdown document or report draft.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the document',
      },
      content: {
        type: 'string',
        description: 'Markdown body text of the document',
      },
    },
    required: ['title', 'content'],
  },
};

export function executeWriteDocumentAiTool(args: Record<string, any>) {
  writeDocument({
    title: args.title,
    content: args.content,
  });
  return { status: 'success', tool: 'write_document', title: args.title };
}
