import * as React from 'react';
import type { HttpSessionSummary, SessionCaptureMode } from '@/types';

export interface UseCreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    name: string,
    description?: string,
    captureMode?: SessionCaptureMode,
    captureFilter?: string[],
    excludeFilter?: string[]
  ) => Promise<void>;
}

export function useCreateSessionDialog({
  open,
  onOpenChange,
  onSubmit,
}: UseCreateSessionDialogProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [captureMode, setCaptureMode] = React.useState<SessionCaptureMode>('all');
  const [customHostInput, setCustomHostInput] = React.useState('');
  const [customHosts, setCustomHosts] = React.useState<string[]>([]);
  const [excludeHostInput, setExcludeHostInput] = React.useState('');
  const [excludeHosts, setExcludeHosts] = React.useState<string[]>([]);
  const [showAdvancedExclude, setShowAdvancedExclude] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setName(`Session - ${dateStr} ${timeStr}`);
      setDescription('');
      setCaptureMode('all');
      setCustomHostInput('');
      setCustomHosts([]);
      setExcludeHostInput('');
      setExcludeHosts([]);
      setShowAdvancedExclude(false);
    }
  }, [open]);

  const handleAddCustomHost = React.useCallback(() => {
    const trimmed = customHostInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!customHosts.includes(trimmed)) {
      setCustomHosts((prev) => [...prev, trimmed]);
    }
    setCustomHostInput('');
  }, [customHostInput, customHosts]);

  const handleRemoveCustomHost = React.useCallback((hostToRemove: string) => {
    setCustomHosts((prev) => prev.filter((h) => h !== hostToRemove));
  }, []);

  const handleAddExcludeHost = React.useCallback(() => {
    const trimmed = excludeHostInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!excludeHosts.includes(trimmed)) {
      setExcludeHosts((prev) => [...prev, trimmed]);
    }
    setExcludeHostInput('');
  }, [excludeHostInput, excludeHosts]);

  const handleRemoveExcludeHost = React.useCallback((hostToRemove: string) => {
    setExcludeHosts((prev) => prev.filter((h) => h !== hostToRemove));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(
      trimmed,
      description.trim() || undefined,
      captureMode,
      customHosts,
      excludeHosts
    );
    onOpenChange(false);
  }, [name, description, captureMode, customHosts, excludeHosts, onSubmit, onOpenChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return {
    name,
    setName,
    description,
    setDescription,
    captureMode,
    setCaptureMode,
    customHostInput,
    setCustomHostInput,
    customHosts,
    excludeHostInput,
    setExcludeHostInput,
    excludeHosts,
    showAdvancedExclude,
    setShowAdvancedExclude,
    handleAddCustomHost,
    handleRemoveCustomHost,
    handleAddExcludeHost,
    handleRemoveExcludeHost,
    handleSubmit,
    handleKeyDown,
  };
}

export interface UseEditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: HttpSessionSummary | null;
  onSubmit: (
    sessionId: string,
    name: string,
    captureMode: SessionCaptureMode,
    captureFilter: string[],
    excludeFilter: string[]
  ) => Promise<void>;
}

export function useEditSessionDialog({
  open,
  onOpenChange,
  session,
  onSubmit,
}: UseEditSessionDialogProps) {
  const [name, setName] = React.useState('');
  const [captureMode, setCaptureMode] = React.useState<SessionCaptureMode>('all');
  const [customHostInput, setCustomHostInput] = React.useState('');
  const [customHosts, setCustomHosts] = React.useState<string[]>([]);
  const [excludeHostInput, setExcludeHostInput] = React.useState('');
  const [excludeHosts, setExcludeHosts] = React.useState<string[]>([]);
  const [showAdvancedExclude, setShowAdvancedExclude] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && session) {
      setName(session.name);
      setCaptureMode((session.capture_mode as SessionCaptureMode) || 'all');
      try {
        setCustomHosts(
          session.capture_filter ? JSON.parse(session.capture_filter) : []
        );
      } catch {
        setCustomHosts([]);
      }
      try {
        setExcludeHosts(
          session.exclude_filter ? JSON.parse(session.exclude_filter) : []
        );
      } catch {
        setExcludeHosts([]);
      }
      setCustomHostInput('');
      setExcludeHostInput('');
      setShowAdvancedExclude(false);
    }
  }, [open, session]);

  const handleAddCustomHost = React.useCallback(() => {
    const trimmed = customHostInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!customHosts.includes(trimmed)) {
      setCustomHosts((prev) => [...prev, trimmed]);
    }
    setCustomHostInput('');
  }, [customHostInput, customHosts]);

  const handleRemoveCustomHost = React.useCallback((h: string) => {
    setCustomHosts((prev) => prev.filter((host) => host !== h));
  }, []);

  const handleAddExcludeHost = React.useCallback(() => {
    const trimmed = excludeHostInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!excludeHosts.includes(trimmed)) {
      setExcludeHosts((prev) => [...prev, trimmed]);
    }
    setExcludeHostInput('');
  }, [excludeHostInput, excludeHosts]);

  const handleRemoveExcludeHost = React.useCallback((h: string) => {
    setExcludeHosts((prev) => prev.filter((host) => host !== h));
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!session) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setIsSaving(true);
    try {
      await onSubmit(session.id, trimmedName, captureMode, customHosts, excludeHosts);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [session, name, captureMode, customHosts, excludeHosts, onSubmit, onOpenChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  const isSaveDisabled =
    !name.trim() || isSaving || (captureMode === 'custom' && customHosts.length === 0);

  return {
    name,
    setName,
    captureMode,
    setCaptureMode,
    customHostInput,
    setCustomHostInput,
    customHosts,
    excludeHostInput,
    setExcludeHostInput,
    excludeHosts,
    showAdvancedExclude,
    setShowAdvancedExclude,
    isSaving,
    isSaveDisabled,
    handleAddCustomHost,
    handleRemoveCustomHost,
    handleAddExcludeHost,
    handleRemoveExcludeHost,
    handleSave,
    handleKeyDown,
  };
}

export interface UseDeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: HttpSessionSummary | null;
  onConfirm: (sessionId: string) => Promise<void>;
}

export function useDeleteSessionDialog({
  onOpenChange,
  session,
  onConfirm,
}: UseDeleteSessionDialogProps) {
  const handleDelete = React.useCallback(async () => {
    if (!session) return;
    await onConfirm(session.id);
    onOpenChange(false);
  }, [session, onConfirm, onOpenChange]);

  return {
    handleDelete,
  };
}
