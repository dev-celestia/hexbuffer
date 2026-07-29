import * as React from 'react';
import { ColorizedUrlInput as BaseColorizedUrlInput, type ColorizedUrlInputProps as BaseProps } from 'hexbuffer-ui';
import { useCollectionsStore } from '@/stores/collections';

function useEnvVarKeys(): string[] {
  const contexts = useCollectionsStore((s) => s.contexts);
  const activeContextId = useCollectionsStore((s) => s.activeContextId);
  return React.useMemo(() => {
    const keys = new Set<string>();
    const activeCtx = contexts.find((c) => c.id === activeContextId);
    if (activeCtx) {
      try {
        const vars = JSON.parse(activeCtx.variables);
        if (Array.isArray(vars)) {
          for (const v of vars) {
            if (v.key?.trim() && v.enabled !== false) keys.add(v.key.trim());
          }
        }
      } catch {
        // ignore malformed json
      }
    }
    return Array.from(keys).sort();
  }, [contexts, activeContextId]);
}

export function ColorizedUrlInput(props: BaseProps) {
  const envVarKeys = useEnvVarKeys();
  const activeContextId = useCollectionsStore((s) => s.activeContextId);
  return (
    <BaseColorizedUrlInput
      {...props}
      envVarKeys={props.envVarKeys ?? envVarKeys}
      activeContextId={props.activeContextId ?? activeContextId}
    />
  );
}
