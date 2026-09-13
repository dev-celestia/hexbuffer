import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useRegressionStore } from '@/stores/regression';
import { STARTER_YAML } from '../constants';
import type {
  RegressionScript,
  RunProgress,
  ScriptDraft,
  ValidationResult,
} from '../types';

export type RegressionTab = 'script' | 'run';

function draftFromScript(script: RegressionScript): ScriptDraft {
  return {
    name: script.name,
    description: script.description,
    targetUrl: script.targetUrl,
    yaml: script.yaml,
  };
}

export function useRegressionPage() {
  const scripts = useRegressionStore((s) => s.scripts);
  const runsByScript = useRegressionStore((s) => s.runsByScript);
  const activeRun = useRegressionStore((s) => s.activeRun);
  const liveConditions = useRegressionStore((s) => s.liveConditions);
  const liveFindings = useRegressionStore((s) => s.liveFindings);
  const liveMessages = useRegressionStore((s) => s.liveMessages);
  const progress: RunProgress | null = useRegressionStore((s) => s.progress);
  const loadScripts = useRegressionStore((s) => s.loadScripts);
  const saveScript = useRegressionStore((s) => s.saveScript);
  const deleteScript = useRegressionStore((s) => s.deleteScript);
  const loadRuns = useRegressionStore((s) => s.loadRuns);
  const runScript = useRegressionStore((s) => s.runScript);
  const abortRun = useRegressionStore((s) => s.abortRun);

  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RegressionTab>('script');
  const [draft, setDraft] = useState<ScriptDraft | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    loadScripts().catch((error) => toast.error(`Failed to load test cases: ${error}`));
  }, [loadScripts]);

  const activeScript = useMemo(
    () => scripts.find((s) => s.id === activeScriptId) ?? null,
    [scripts, activeScriptId],
  );

  const scriptRuns = activeScriptId ? runsByScript[activeScriptId] ?? [] : [];

  const isRunning = activeRun?.status === 'running';
  const activeRunForScript =
    activeRun && activeRun.scriptId === activeScriptId ? activeRun : null;

  // Select the first script on initial load
  useEffect(() => {
    if (activeScriptId === null && scripts.length > 0) {
      setActiveScriptId(scripts[0].id);
    }
  }, [scripts, activeScriptId]);

  // Sync draft + run history when the selected script changes
  useEffect(() => {
    if (activeScript) {
      setDraft(draftFromScript(activeScript));
      setIsDirty(false);
      setValidation(null);
      loadRuns(activeScript.id).catch(() => {});
    } else {
      setDraft(null);
      setValidation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScriptId]);

  const handleSelectScript = useCallback((id: string) => {
    setActiveScriptId(id);
  }, []);

  const handleCreate = useCallback(async () => {
    const newScript: RegressionScript = {
      id: '',
      name: `Test Case ${Date.now() % 1000}`,
      description: '',
      targetUrl: activeScript?.targetUrl ?? 'https://example.com',
      yaml: STARTER_YAML,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    };
    try {
      const saved = await saveScript(newScript);
      setActiveScriptId(saved.id);
      setDraft(draftFromScript(saved));
      setIsDirty(false);
      setValidation(null);
      toast.success('Test case created');
    } catch (error) {
      toast.error(`Failed to create test case: ${error}`);
    }
  }, [activeScript, saveScript]);

  const handleDraftChange = useCallback((patch: Partial<ScriptDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsDirty(true);
  }, []);

  const handleValidate = useCallback(async () => {
    if (!draft) return;
    setIsValidating(true);
    try {
      const result = await invoke<ValidationResult>('validate_regression_script', {
        yaml: draft.yaml,
      });
      setValidation(result);
    } catch (error) {
      toast.error(`Validation failed: ${error}`);
    } finally {
      setIsValidating(false);
    }
  }, [draft]);

  const handleSave = useCallback(async () => {
    if (!draft || !activeScriptId) return;
    setIsSaving(true);
    try {
      const result = await invoke<ValidationResult>('validate_regression_script', {
        yaml: draft.yaml,
      });
      setValidation(result);
      if (!result.valid) {
        toast.error('Cannot save — fix the YAML errors first');
        return;
      }
      const saved = await saveScript({
        id: activeScriptId,
        name: draft.name.trim() || 'Untitled Test Case',
        description: draft.description,
        targetUrl: draft.targetUrl.trim(),
        yaml: draft.yaml,
        enabled: true,
      });
      setDraft(draftFromScript(saved));
      setIsDirty(false);
      toast.success('Test case saved');
    } catch (error) {
      toast.error(`Failed to save test case: ${error}`);
    } finally {
      setIsSaving(false);
    }
  }, [draft, activeScriptId, saveScript]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteScript(id);
        if (activeScriptId === id) {
          const remaining = scripts.filter((s) => s.id !== id);
          setActiveScriptId(remaining[0]?.id ?? null);
        }
        toast.success('Test case deleted');
      } catch (error) {
        toast.error(`Failed to delete test case: ${error}`);
      }
    },
    [activeScriptId, scripts, deleteScript],
  );

  const handleRun = useCallback(async () => {
    if (!activeScriptId || !draft) return;
    if (isDirty) {
      toast.error('Save your changes before running');
      return;
    }
    if (!draft.targetUrl.trim()) {
      toast.error('Set a target URL before running');
      return;
    }
    try {
      await runScript(activeScriptId);
      setActiveTab('run');
    } catch (error) {
      toast.error(`Failed to start run: ${error}`);
    }
  }, [activeScriptId, draft, isDirty, runScript]);

  const handleAbort = useCallback(async () => {
    await abortRun();
  }, [abortRun]);

  const conditionCount = validation?.templates.length ?? 0;

  return {
    // data
    scripts,
    activeScript,
    activeScriptId,
    scriptRuns,
    draft,
    isDirty,
    validation,
    conditionCount,
    activeTab,
    // live run state
    activeRun,
    activeRunForScript,
    liveConditions,
    liveFindings,
    liveMessages,
    progress,
    isRunning,
    isSaving,
    isValidating,
    // handlers
    setActiveTab,
    handleSelectScript,
    handleCreate,
    handleDraftChange,
    handleValidate,
    handleSave,
    handleDelete,
    handleRun,
    handleAbort,
  };
}
