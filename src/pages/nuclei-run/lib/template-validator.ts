import type { TemplateValidationResult, ValidationDiagnostic, Severity, ProtocolType } from '../types';

export function validateNucleiTemplate(yamlContent: string): TemplateValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];

  if (!yamlContent.trim()) {
    return {
      valid: false,
      diagnostics: [
        {
          type: 'error',
          message: 'Template content cannot be empty.',
          line: 1,
          column: 1,
        },
      ],
    };
  }

  const lines = yamlContent.split('\n');

  let hasId = false;
  let hasInfo = false;
  let hasName = false;
  let hasSeverity = false;
  let hasProtocol = false;
  let detectedId = '';
  let detectedName = '';
  let detectedSeverity: Severity = 'info';
  let detectedAuthor = 'custom';
  let detectedProtocol: ProtocolType = 'http';
  const detectedTags: string[] = [];

  // `id:` and the protocol keys are top-level; the metadata fields live one level down inside
  // `info:`. Without tracking that, any indented `name:` counted as the template name — an
  // extractor's own `name:` (indent 8) is the common case, and it made `metadata.name` report
  // "wp_version" / "db_host" / "apache_version" for the built-in templates that have extractors.
  let inInfo = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('#') || !trimmed) continue;

    const indent = line.search(/\S|$/);
    const isTopLevel = indent === 0;

    if (isTopLevel) {
      inInfo = trimmed === 'info:' || trimmed.startsWith('info:');
    }

    // Check id
    if (isTopLevel && trimmed.startsWith('id:')) {
      hasId = true;
      detectedId = trimmed.replace('id:', '').trim().replace(/['"]/g, '');
      if (!detectedId) {
        diagnostics.push({
          type: 'error',
          line: lineNum,
          message: 'Field "id" must not be empty.',
        });
      } else if (!/^[a-zA-Z0-9_-]+$/.test(detectedId)) {
        diagnostics.push({
          type: 'warning',
          line: lineNum,
          message: 'Template ID should contain only alphanumeric characters, dashes, and underscores.',
        });
      }
    }

    // Check info block
    if (isTopLevel && (trimmed === 'info:' || trimmed.startsWith('info:'))) {
      hasInfo = true;
    }

    if (inInfo && trimmed.startsWith('name:')) {
      hasName = true;
      detectedName = trimmed.replace('name:', '').trim().replace(/['"]/g, '');
    }

    if (inInfo && trimmed.startsWith('author:')) {
      detectedAuthor = trimmed.replace('author:', '').trim().replace(/['"]/g, '');
    }

    if (inInfo && trimmed.startsWith('severity:')) {
      hasSeverity = true;
      const rawSev = trimmed.replace('severity:', '').trim().toLowerCase().replace(/['"]/g, '');
      if (['critical', 'high', 'medium', 'low', 'info'].includes(rawSev)) {
        detectedSeverity = rawSev as Severity;
      } else {
        diagnostics.push({
          type: 'error',
          line: lineNum,
          message: `Invalid severity "${rawSev}". Must be one of: critical, high, medium, low, info.`,
        });
      }
    }

    if (inInfo && trimmed.startsWith('tags:')) {
      const rawTags = trimmed.replace('tags:', '').trim().replace(/['"]/g, '');
      if (rawTags) {
        detectedTags.push(...rawTags.split(',').map((t) => t.trim()).filter(Boolean));
      }
    }

    // Protocol blocks. These are top-level keys, so require indent 0 — otherwise an indented key
    // that happens to be named `ssl:`/`http:`/`dns:`/`tcp:` overrides the template's protocol, and
    // the flow-canvas parser (which does scope this to indent 0) would then disagree with us.
    // The guard covers the whole chain below, which is the last thing the loop does.
    if (!isTopLevel) continue;

    if (
      trimmed === 'http:' ||
      trimmed === 'requests:' ||
      trimmed.startsWith('http:') ||
      trimmed.startsWith('requests:')
    ) {
      hasProtocol = true;
      detectedProtocol = 'http';
    } else if (trimmed === 'dns:' || trimmed.startsWith('dns:')) {
      hasProtocol = true;
      detectedProtocol = 'dns';
    } else if (trimmed === 'ssl:' || trimmed.startsWith('ssl:')) {
      hasProtocol = true;
      detectedProtocol = 'ssl';
    } else if (trimmed === 'tcp:' || trimmed.startsWith('tcp:')) {
      hasProtocol = true;
      detectedProtocol = 'tcp';
    } else if (trimmed === 'websocket:' || trimmed.startsWith('websocket:')) {
      hasProtocol = true;
      detectedProtocol = 'websocket';
    } else if (trimmed === 'headless:' || trimmed.startsWith('headless:')) {
      hasProtocol = true;
      detectedProtocol = 'headless';
    } else if (trimmed === 'javascript:' || trimmed.startsWith('javascript:')) {
      hasProtocol = true;
      detectedProtocol = 'javascript';
    } else if (trimmed === 'code:' || trimmed.startsWith('code:')) {
      hasProtocol = true;
      detectedProtocol = 'code';
    } else if (trimmed === 'file:' || trimmed.startsWith('file:')) {
      // `file` is a member of `ProtocolType` and has its own "File Inspection" category, so a
      // file-protocol template is valid. This branch was missing, which made every one of them report
      // "Missing protocol execution block" and fail validation.
      hasProtocol = true;
      detectedProtocol = 'file';
    } else if (trimmed === 'whois:' || trimmed.startsWith('whois:')) {
      hasProtocol = true;
      detectedProtocol = 'whois';
    }
  }

  if (!hasId) {
    diagnostics.push({
      type: 'error',
      line: 1,
      message: 'Missing mandatory top-level field "id".',
    });
  }

  if (!hasInfo) {
    diagnostics.push({
      type: 'error',
      line: 1,
      message: 'Missing mandatory "info" metadata block.',
    });
  }

  if (!hasName) {
    diagnostics.push({
      type: 'error',
      line: 2,
      message: 'Missing mandatory field "info.name".',
    });
  }

  if (!hasSeverity) {
    diagnostics.push({
      type: 'warning',
      line: 2,
      message: 'Missing field "info.severity". Defaulting to "info".',
    });
  }

  if (!hasProtocol) {
    diagnostics.push({
      type: 'error',
      line: 1,
      message: 'Missing protocol execution block (e.g., http, dns, ssl, tcp, headless).',
    });
  }

  const isValid = !diagnostics.some((d) => d.type === 'error');

  return {
    valid: isValid,
    diagnostics,
    metadata: isValid
      ? {
          id: detectedId || 'custom-template',
          name: detectedName || 'Custom Vulnerability Check',
          severity: detectedSeverity,
          author: detectedAuthor,
          protocol: detectedProtocol,
          tags: detectedTags,
        }
      : undefined,
  };
}
