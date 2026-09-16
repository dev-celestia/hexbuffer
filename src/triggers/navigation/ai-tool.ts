import { openApp } from './index';

export const NAVIGATE_TO_APP_AI_TOOL_DEFINITION = {
  name: 'navigate_to_app',
  description: 'Navigate to, open, and focus a HexBuffer application window or tool page.',
  parameters: {
    type: 'object',
    properties: {
      app: {
        type: 'string',
        description: 'The target application or window name: "repeater", "http-history", "intercept", "intruder", "notes", "port-scanner", "jwt", "browser", "settings", "api-mock", or "api-override".',
      },
    },
    required: ['app'],
  },
};

export async function executeNavigateToAppAiTool(args: { app?: string }): Promise<string> {
  const app = args.app?.trim();
  if (!app) {
    throw new Error('Target application name is required.');
  }

  const success = openApp(app);
  if (!success) {
    return `Could not find application window "${app}". Available windows: repeater, http-history, intercept, intruder, notes, port-scanner, jwt, browser, settings, api-mock, api-override.`;
  }

  return `Successfully opened and focused the ${app} window.`;
}
