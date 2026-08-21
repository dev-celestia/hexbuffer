import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import type {
  AttackConfig,
  AttackStatus,
  TelemetryData,
  TargetHash,
  CrackedResult,
  HashType
} from '../types';
import { INITIAL_TELEMETRY } from '../constants';

interface RustCrackedMatch {
  id: string;
  hash: string;
  plaintext: string;
  algorithm: HashType;
  crackedAt: string;
  attempts: number;
}

export function useAttackEngine() {
  const [status, setStatus] = useState<AttackStatus>('idle');
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [results, setResults] = useState<CrackedResult[]>([]);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unlistenTelemetryRef = useRef<UnlistenFn | null>(null);
  const unlistenMatchRef = useRef<UnlistenFn | null>(null);
  const unlistenCompletedRef = useRef<UnlistenFn | null>(null);
  const unlistenErrorRef = useRef<UnlistenFn | null>(null);

  // Start attack via Rust engine
  const startAttack = useCallback(
    async (config: AttackConfig, targets: TargetHash[], algorithm: HashType) => {
      // Validation
      if (targets.length === 0) {
        toast.error('No target hashes provided');
        return;
      }

      if (status === 'running') {
        toast.error('Attack is already running');
        return;
      }

      try {
        // Reset state
        setStatus('running');
        setStartedAt(new Date());
        setCompletedAt(null);
        setErrorMessage(null);
        setResults([]);
        setTelemetry(INITIAL_TELEMETRY);

        // Build rust payload
        const rustTargets = targets.map((t) => ({
          id: t.id,
          hash: t.hash,
          algorithm: t.algorithm || algorithm,
        }));

        let rustMode: Record<string, unknown>;
        let rules: string[] = [];

        switch (config.mode) {
          case 'straight':
            rustMode = {
              mode: 'straight',
              wordlistPath: config.wordlistPath,
            };
            rules = config.rules || [];
            break;
          case 'combinator':
            rustMode = {
              mode: 'combinator',
              leftWordlistPath: config.leftWordlistPath,
              rightWordlistPath: config.rightWordlistPath,
            };
            break;
          case 'mask':
            rustMode = {
              mode: 'mask',
              pattern: config.pattern,
              charset: config.charset,
            };
            break;
          case 'hybrid':
            rustMode = {
              mode: 'hybrid',
              wordlistPath: config.wordlistPath,
              mask: config.mask,
            };
            break;
        }

        const rustConfig = {
          mode: rustMode,
          algorithm,
          targets: rustTargets,
          rules,
          threads: null,
        };

        await invoke('start_hash_attack', { config: rustConfig });
        toast.success('Rust attack engine started');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus('error');
        setErrorMessage(message);
        toast.error(`Attack failed to start: ${message}`);
        console.error('Failed to start hash attack:', error);
      }
    },
    [status]
  );

  // Stop attack
  const stopAttack = useCallback(async () => {
    if (status !== 'running' && status !== 'paused') {
      return;
    }

    try {
      await invoke('stop_hash_attack');
    } catch (error) {
      console.error('Failed to stop attack:', error);
    }
    setStatus('stopped');
    setCompletedAt(new Date());
    toast.info('Attack stopped');
  }, [status]);

  // Pause attack
  const pauseAttack = useCallback(async () => {
    if (status !== 'running') {
      toast.error('No running attack to pause');
      return;
    }

    try {
      await invoke('pause_hash_attack');
      setStatus('paused');
      toast.info('Attack paused');
    } catch (error) {
      toast.error('Failed to pause attack');
    }
  }, [status]);

  // Resume attack
  const resumeAttack = useCallback(async () => {
    if (status !== 'paused') {
      toast.error('No paused attack to resume');
      return;
    }

    try {
      await invoke('resume_hash_attack');
      setStatus('running');
      toast.info('Attack resumed');
    } catch (error) {
      toast.error('Failed to resume attack');
    }
  }, [status]);

  // Reset engine
  const resetEngine = useCallback(async () => {
    if (status === 'running' || status === 'paused') {
      try {
        await invoke('stop_hash_attack');
      } catch {
        // ignore
      }
    }

    setStatus('idle');
    setTelemetry(INITIAL_TELEMETRY);
    setResults([]);
    setStartedAt(null);
    setCompletedAt(null);
    setErrorMessage(null);
  }, [status]);

  // Subscribe to Tauri events
  useEffect(() => {
    let isMounted = true;

    async function setupListeners() {
      // Telemetry updates
      unlistenTelemetryRef.current = await listen<TelemetryData>('hash-telemetry', (event) => {
        if (!isMounted) return;
        setTelemetry(event.payload);
      });

      // Match found
      unlistenMatchRef.current = await listen<RustCrackedMatch>('hash-match', (event) => {
        if (!isMounted) return;
        const match = event.payload;
        const result: CrackedResult = {
          id: match.id,
          hash: match.hash,
          plaintext: match.plaintext,
          algorithm: match.algorithm,
          crackedAt: new Date(match.crackedAt),
          attempts: match.attempts,
        };
        setResults((prev) => {
          if (prev.some((r) => r.hash === result.hash && r.plaintext === result.plaintext)) {
            return prev;
          }
          return [...prev, result];
        });
        toast.success(`Cracked: ${match.plaintext}`);
      });

      // Attack completed
      unlistenCompletedRef.current = await listen('hash-completed', () => {
        if (!isMounted) return;
        setStatus('completed');
        setCompletedAt(new Date());
        toast.info('Hash attack finished');
      });

      // Attack error
      unlistenErrorRef.current = await listen<string>('hash-error', (event) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(event.payload);
        toast.error(`Engine error: ${event.payload}`);
      });
    }

    setupListeners();

    return () => {
      isMounted = false;
      if (unlistenTelemetryRef.current) unlistenTelemetryRef.current();
      if (unlistenMatchRef.current) unlistenMatchRef.current();
      if (unlistenCompletedRef.current) unlistenCompletedRef.current();
      if (unlistenErrorRef.current) unlistenErrorRef.current();
    };
  }, []);

  return {
    status,
    telemetry,
    results,
    startedAt,
    completedAt,
    errorMessage,
    startAttack,
    stopAttack,
    pauseAttack,
    resumeAttack,
    resetEngine,
  };
}
