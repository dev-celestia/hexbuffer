import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import type { HashType, TabMode, AttackConfig, TargetHash } from '../types';
import { useAttackEngine } from './use-attack-engine';

export function useHashPage() {
  // Tab management
  const [activeTab, setActiveTab] = useState<TabMode>('calculator');

  // Calculator mode state
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<HashType>('sha256');
  const [output, setOutput] = useState('');

  // Attack mode state
  const [attackConfig, setAttackConfig] = useState<AttackConfig | null>({
    mode: 'straight',
    wordlistPath: '',
    rules: []
  });
  const [attackAlgorithm, setAttackAlgorithm] = useState<HashType>('sha256');
  const [targets, setTargets] = useState<TargetHash[]>([]);

  // Attack engine
  const attackEngine = useAttackEngine();

  // Calculator: Auto-hash using Rust backend
  const handleHash = useCallback(async () => {
    if (!input) {
      setOutput('');
      return;
    }
    try {
      const result = await invoke<string>('compute_single_hash', {
        input,
        algorithm: activeType,
      });
      setOutput(result);
    } catch (error) {
      console.error('Failed to compute hash in Rust:', error);
    }
  }, [input, activeType]);

  useEffect(() => {
    if (activeTab === 'calculator') {
      handleHash();
    }
  }, [handleHash, activeTab]);

  // Calculator: Copy output
  const handleCopy = useCallback(async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      toast.success('Hash copied to clipboard');
    }
  }, [output]);

  // Calculator: Clear
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
  }, []);

  // Attack: Start attack
  const handleStartAttack = useCallback(() => {
    if (!attackConfig) {
      toast.error('Please configure attack settings');
      return;
    }

    if (targets.length === 0) {
      toast.error('Please add target hashes');
      return;
    }

    // Validate config based on mode
    if (attackConfig.mode === 'straight' && !attackConfig.wordlistPath?.trim()) {
      toast.error('Please select a wordlist file');
      return;
    }

    if (
      attackConfig.mode === 'combinator' &&
      (!attackConfig.leftWordlistPath?.trim() || !attackConfig.rightWordlistPath?.trim())
    ) {
      toast.error('Please select both wordlist files');
      return;
    }

    attackEngine.startAttack(attackConfig, targets, attackAlgorithm);
  }, [attackConfig, targets, attackAlgorithm, attackEngine]);

  // Attack: Stop attack
  const handleStopAttack = useCallback(() => {
    attackEngine.stopAttack();
  }, [attackEngine]);

  // Attack: Pause attack
  const handlePauseAttack = useCallback(() => {
    attackEngine.pauseAttack();
  }, [attackEngine]);

  // Attack: Resume attack
  const handleResumeAttack = useCallback(() => {
    attackEngine.resumeAttack();
  }, [attackEngine]);

  // Attack: Reset
  const handleResetAttack = useCallback(() => {
    attackEngine.resetEngine();
    setAttackConfig({
      mode: 'straight',
      wordlistPath: '',
      rules: []
    });
  }, [attackEngine]);

  // Attack: Export results
  const handleExportResults = useCallback(() => {
    if (attackEngine.results.length === 0) {
      toast.error('No results to export');
      return;
    }

    const content = attackEngine.results
      .map(r => `${r.hash}:${r.plaintext}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cracked-hashes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Results exported successfully');
  }, [attackEngine.results]);

  // Update targets when results come in
  useEffect(() => {
    if (attackEngine.results.length > 0) {
      setTargets(prevTargets => {
        return prevTargets.map(target => {
          const result = attackEngine.results.find(r => r.hash === target.hash);
          if (result) {
            return {
              ...target,
              cracked: true,
              plaintext: result.plaintext,
              crackedAt: result.crackedAt
            };
          }
          return target;
        });
      });
    }
  }, [attackEngine.results]);

  const isEmpty = !input && !output;

  return {
    // Tab management
    activeTab,
    setActiveTab,

    // Calculator mode
    input,
    setInput,
    activeType,
    setActiveType,
    output,
    handleCopy,
    handleClear,
    isEmpty,

    // Attack mode
    attackConfig,
    setAttackConfig,
    attackAlgorithm,
    setAttackAlgorithm,
    targets,
    setTargets,
    attackEngine,
    handleStartAttack,
    handleStopAttack,
    handlePauseAttack,
    handleResumeAttack,
    handleResetAttack,
    handleExportResults
  };
}
