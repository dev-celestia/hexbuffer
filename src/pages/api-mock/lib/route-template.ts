/**
 * Utility functions for parsing dynamic route paths (e.g. /api/resource/:id)
 * and rendering template strings (e.g. {{id}}, {{params.id}}).
 */

/**
 * Extracts dynamic parameter names from a route path.
 * Supports both Express-style (:id) and OpenAPI-style ({id}) parameters.
 * Example: "/api/resource/:id" -> ["id"]
 * Example: "/users/:userId/orders/{orderId}" -> ["userId", "orderId"]
 */
export function parseRouteParams(path: string): string[] {
  if (!path) return [];
  const clean = path.split('?')[0].trim();
  const segments = clean.split('/').filter(Boolean);
  const params: string[] = [];

  for (const seg of segments) {
    if (seg.startsWith(':') && seg.length > 1) {
      params.push(seg.slice(1));
    } else if (seg.startsWith('{') && seg.endsWith('}') && seg.length > 2) {
      params.push(seg.slice(1, -1));
    }
  }

  return Array.from(new Set(params));
}

/**
 * Generates a realistic sample request path replacing dynamic parameters with test values.
 * Example: "/api/resource/:id" -> "/api/resource/12"
 */
export function generateSamplePath(
  pattern: string,
  sampleValues: Record<string, string> = {}
): string {
  if (!pattern) return '/';
  const clean = pattern.split('?')[0].trim();
  const segments = clean.split('/').filter(Boolean);

  const defaultValues: Record<string, string> = {
    id: '12',
    userId: '101',
    user_id: '101',
    postId: '42',
    post_id: '42',
    slug: 'featured-item',
    token: 'tk_987xyz',
  };

  const replaced = segments.map((seg, idx) => {
    let paramName: string | null = null;
    if (seg.startsWith(':') && seg.length > 1) {
      paramName = seg.slice(1);
    } else if (seg.startsWith('{') && seg.endsWith('}') && seg.length > 2) {
      paramName = seg.slice(1, -1);
    }

    if (paramName) {
      return (
        sampleValues[paramName] ||
        defaultValues[paramName] ||
        (paramName.toLowerCase().includes('id') ? String(10 + idx * 2) : `sample_${paramName}`)
      );
    }
    return seg;
  });

  return `/${replaced.join('/')}`;
}

/**
 * Renders a template string locally on the frontend for live previewing.
 */
export function renderTemplatePreview(
  template: string,
  sampleParams: Record<string, string>,
  reqPath = '',
  reqMethod = 'GET'
): string {
  if (!template) return '';
  let rendered = template;

  for (const [k, v] of Object.entries(sampleParams)) {
    rendered = rendered.split(`{{${k}}}`).join(v);
    rendered = rendered.split(`{{params.${k}}}`).join(v);
    rendered = rendered.split(`{{param.${k}}}`).join(v);
    rendered = rendered.split(`\${${k}}`).join(v);
    rendered = rendered.split(`\${params.${k}}`).join(v);
    rendered = rendered.split(`\${param.${k}}`).join(v);
  }

  if (reqPath) {
    rendered = rendered.split('{{path}}').join(reqPath);
    rendered = rendered.split('${path}').join(reqPath);
  }

  if (reqMethod) {
    rendered = rendered.split('{{method}}').join(reqMethod);
    rendered = rendered.split('${method}').join(reqMethod);
  }

  return rendered;
}

/**
 * Generates a standard JSON response body incorporating detected dynamic parameters.
 */
export function generateDynamicBodyTemplate(params: string[]): string {
  if (!params || params.length === 0) {
    return JSON.stringify(
      {
        message: 'Success',
        data: {},
      },
      null,
      2
    );
  }

  const obj: Record<string, any> = {};
  for (const p of params) {
    obj[p] = `{{${p}}}`;
  }
  obj.message = params.length === 1
    ? `Resource {{${params[0]}}} retrieved successfully`
    : `Resource details retrieved successfully`;
  obj.status = 'success';

  return JSON.stringify(obj, null, 2);
}
