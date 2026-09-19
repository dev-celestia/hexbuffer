import * as React from 'react';

/**
 * The capture-host input's own state.
 *
 * This lived inline in the page entry, which meant `index.tsx` held both the composition of the
 * page *and* the typing state of one field inside it. It sits here instead so the toolbar stays a
 * thin declarative component and the page entry stays composition — the same split the rest of the
 * page already follows.
 *
 * Enter and the adjacent add button do the same thing, so both route through `submit`; there is one
 * place that decides what "add this host" means.
 */
export function useInterceptToolbar(onAddCaptureHost: (host: string) => void) {
  const [value, setValue] = React.useState('');

  const trimmed = value.trim();
  const canAdd = trimmed.length > 0;

  const submit = React.useCallback(() => {
    if (!trimmed) return;
    onAddCaptureHost(trimmed);
    setValue('');
  }, [onAddCaptureHost, trimmed]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    },
    [submit]
  );

  return { value, setValue, canAdd, submit, handleKeyDown };
}
