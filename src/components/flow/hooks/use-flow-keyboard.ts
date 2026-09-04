import React from 'react';

interface UseFlowKeyboardOptions {
  enableSpacePan?: boolean;
  onDelete?: () => void;
}

export function useFlowKeyboard({
  enableSpacePan = true,
  onDelete,
}: UseFlowKeyboardOptions = {}) {
  const [spacePressed, setSpacePressed] = React.useState(false);

  React.useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, select, [contenteditable="true"], .monaco-editor'));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (enableSpacePan && event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        setSpacePressed(true);
      }

      if (onDelete && (event.key === 'Delete' || event.key === 'Backspace')) {
        onDelete();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (enableSpacePan && event.code === 'Space') {
        event.preventDefault();
        setSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enableSpacePan, onDelete]);

  return {
    spacePressed,
  };
}
