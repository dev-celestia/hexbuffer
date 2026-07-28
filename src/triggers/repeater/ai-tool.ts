import { useNavStore } from '@/stores/nav';
import { createCollection, createFolder, createEndpoint, selectEndpoint } from './management';
import { sendRawToRepeater } from './send-to';

export const REPEATER_AI_TOOL_DEFINITION = {
  name: 'send_to_repeater',
  description: 'Send an HTTP request to the Repeater tab for manual inspection and modification.',
  parameters: {
    type: 'object',
    properties: {
      raw_request: {
        type: 'string',
        description: 'Raw HTTP request string including headers and body',
      },
      target_url: {
        type: 'string',
        description: 'Optional target URL or host',
      },
    },
    required: ['raw_request'],
  },
};

export const CREATE_COLLECTION_AI_TOOL_DEFINITION = {
  name: 'create_collection',
  description: 'Create a new collection inside a Repeater workspace.',
  parameters: {
    type: 'object',
    properties: {
      workspace_id: {
        type: 'string',
        description: 'Target workspace ID',
      },
      name: {
        type: 'string',
        description: 'Collection name',
      },
    },
    required: ['workspace_id', 'name'],
  },
};

export const CREATE_FOLDER_AI_TOOL_DEFINITION = {
  name: 'create_folder',
  description: 'Create a subfolder inside a Repeater collection or folder.',
  parameters: {
    type: 'object',
    properties: {
      parent_id: {
        type: 'string',
        description: 'Parent collection or folder ID',
      },
      name: {
        type: 'string',
        description: 'Folder name',
      },
    },
    required: ['parent_id', 'name'],
  },
};

export const CREATE_ENDPOINT_AI_TOOL_DEFINITION = {
  name: 'create_endpoint',
  description: 'Add an API endpoint/request to a Repeater collection or folder.',
  parameters: {
    type: 'object',
    properties: {
      collection_id: {
        type: 'string',
        description: 'Target collection or folder ID',
      },
      name: {
        type: 'string',
        description: 'API Endpoint/Request name',
      },
      method: {
        type: 'string',
        description: 'HTTP Method (GET, POST, etc.)',
      },
      url: {
        type: 'string',
        description: 'Endpoint URL',
      },
      headers: {
        type: 'object',
        description: 'HTTP Request headers key-value map',
      },
      body: {
        type: 'string',
        description: 'HTTP Request payload body',
      },
    },
    required: ['collection_id', 'name'],
  },
};

export async function executeSendToRepeaterAiTool(args: Record<string, any>) {
  const raw = args.raw_request || '';
  const url = args.target_url || '';
  await sendRawToRepeater({ raw, url });
  return { status: 'success', tool: 'send_to_repeater' };
}

export async function executeCreateCollectionAiTool(args: Record<string, any>) {
  const id = await createCollection(args.workspace_id, args.name);
  useNavStore.getState().triggerNavBlink('/repeater');
  return { status: 'success', tool: 'create_collection', id, name: args.name };
}

export async function executeCreateFolderAiTool(args: Record<string, any>) {
  const id = await createFolder(args.parent_id, args.name);
  return { status: 'success', tool: 'create_folder', id, name: args.name };
}

export async function executeCreateEndpointAiTool(args: Record<string, any>) {
  const id = await createEndpoint(args.collection_id, args.name, {
    method: args.method,
    url: args.url,
    headers: args.headers,
    body: args.body,
  });
  selectEndpoint(id);
  useNavStore.getState().triggerNavBlink('/repeater');
  return { status: 'success', tool: 'create_endpoint', id, name: args.name };
}
