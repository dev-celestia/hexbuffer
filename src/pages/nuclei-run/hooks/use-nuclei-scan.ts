import { useRef, useCallback, useEffect } from 'react';
import { useNucleiStore } from '@/stores/nuclei';
import { useNotificationStore } from '@/stores/notifications';
import type { NucleiFinding, Severity } from '../types';
import {
  startNucleiScan,
  pauseNucleiScan,
  resumeNucleiScan,
  stopNucleiScan,
  subscribeNucleiEvents,
} from '../lib/nuclei-ipc';

export function useNucleiScan() {
  const {
    targetInput,
    config,
    status,
    setStatus,
    progress,
    setProgress,
    scanId,
    setScanId,
    findings,
    addFinding,
    addLog,
    templates,
    selectedTemplateIds,
    setActiveTab,
  } = useNucleiStore();

  const startTimeRef = useRef<number>(0);
  const lastProgressLogRef = useRef<number>(0);
  const unlistenRef = useRef<(() => void) | null>(null);

  // Parse targets from target input (preserve local dev http:// default)
  const parseTargets = useCallback((raw: string): string[] => {
    return raw
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !t.startsWith('#'))
      .map((t) => {
        if (!t.startsWith('http://') && !t.startsWith('https://')) {
          const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?/i.test(t);
          return isLocal ? `http://${t}` : `https://${t}`;
        }
        return t;
      });
  }, []);

  // Cleanup event listener on unmount
  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  // Stop Scan
  const stopScan = useCallback(async () => {
    try {
      await stopNucleiScan();
    } catch (e) {
      console.warn('Native scan cancel error:', e);
    }
    setStatus('cancelled');
    addLog({
      level: 'warn',
      message: 'Scan cancelled by user.',
    });
  }, [setStatus, addLog]);

  // Pause Scan
  const pauseScan = useCallback(async () => {
    if (status === 'running') {
      try {
        await pauseNucleiScan();
      } catch (e) {
        console.warn('Native scan pause error:', e);
      }
      setStatus('paused');
      addLog({
        level: 'info',
        message: 'Scan execution paused.',
      });
    }
  }, [status, setStatus, addLog]);

  // Resume Scan
  const resumeScan = useCallback(async () => {
    if (status === 'paused') {
      try {
        await resumeNucleiScan();
      } catch (e) {
        console.warn('Native scan resume error:', e);
      }
      setStatus('running');
      addLog({
        level: 'info',
        message: 'Scan execution resumed.',
      });
    }
  }, [status, setStatus, addLog]);

  // Start Scan via Rust engine (supports scanning all, group, or single item)
  const startScan = useCallback(async (overrideTemplateIds?: string[]) => {
    const targets = parseTargets(targetInput);
    if (targets.length === 0) {
      useNotificationStore.getState().addAlert({
        id: `nuclei-err-${Date.now()}`,
        title: 'Target Required',
        message: 'Please enter at least one valid target URL or host.',
        type: 'error',
        source: 'Nuclei Scanner',
      });
      return;
    }

    const templateIdsToScan =
      overrideTemplateIds && overrideTemplateIds.length > 0
        ? overrideTemplateIds
        : selectedTemplateIds;

    const selectedTemplates = templates.filter((t) => templateIdsToScan.includes(t.id));
    if (selectedTemplates.length === 0) {
      useNotificationStore.getState().addAlert({
        id: `nuclei-err-${Date.now()}`,
        title: 'No Templates Selected',
        message: 'Please select at least one Nuclei template to execute.',
        type: 'warning',
        source: 'Nuclei Scanner',
      });
      return;
    }

    // Automatically navigate to Step 3: Scan Results
    setActiveTab('results');

    // Cleanup previous unlisten
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }

    const newScanId = `scan-${Date.now()}`;
    setScanId(newScanId);
    setStatus('running');
    startTimeRef.current = Date.now();
    lastProgressLogRef.current = Date.now();

    const totalRequests = targets.length * selectedTemplates.length;
    setProgress({
      completed_requests: 0,
      total_requests: totalRequests,
      rps: 0,
      percentage: 0,
      elapsed_seconds: 0,
    });

    addLog({
      level: 'info',
      message: `Nuclei Rust engine starting. Loaded ${selectedTemplates.length} templates across ${targets.length} target(s). Concurrency: ${config.concurrency}, Rate limit: ${config.rate_limit_rps} RPS.`,
    });

    useNotificationStore.getState().addAlert({
      id: `nuclei-started-${Date.now()}`,
      title: 'Nuclei Engine Running',
      message: `Scanning ${targets[0]}${targets.length > 1 ? ` (+${targets.length - 1} more)` : ''} with ${selectedTemplates.length} templates.`,
      type: 'info',
      source: 'Nuclei Scanner',
    });

    // Subscribe to real-time events from Rust engine
    try {
      const unlisten = await subscribeNucleiEvents({
        onScanStarted: (data) => {
          addLog({
            level: 'info',
            message: `Rust scanner active: ${data.total_templates} templates initialized for ${data.total_targets} target(s).`,
          });
        },
        onProgress: (prog) => {
          const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
          const pct = prog.total_requests > 0
            ? Math.min(100, Math.round((prog.completed_requests / prog.total_requests) * 100))
            : 0;

          setProgress({
            completed_requests: prog.completed_requests,
            total_requests: prog.total_requests,
            rps: prog.rps,
            percentage: pct,
            elapsed_seconds: elapsed,
          });

          // Periodic progress log in console so users can observe active probe telemetry
          const now = Date.now();
          if (now - lastProgressLogRef.current >= 1500 && prog.completed_requests > 0) {
            lastProgressLogRef.current = now;
            addLog({
              level: 'info',
              message: `[SCANNING] ${prog.completed_requests}/${prog.total_requests} requests completed (${pct}%) at ${prog.rps} RPS`,
            });
          }
        },
        onFinding: (finding) => {
          const newFinding: NucleiFinding = {
            id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            template_id: finding.template_id,
            template_name: finding.template_name,
            severity: (finding.severity.toLowerCase() as Severity) || 'medium',
            protocol: 'http',
            matched_url: finding.matched_url,
            matched_at: new Date().toISOString(),
            extracted_results: finding.extracted_results,
            request_raw: '',
            response_raw: '',
            curl_command: `curl -s "${finding.matched_url}"`,
          };

          addFinding(newFinding);
          addLog({
            level: 'warn',
            message: `[DISCOVERED] [${finding.severity.toUpperCase()}] ${finding.template_name} on ${finding.matched_url}`,
            target: finding.matched_url,
            template_id: finding.template_id,
          });

          useNotificationStore.getState().addAlert({
            id: `finding-alert-${Date.now()}`,
            title: `Vulnerability: ${finding.template_name}`,
            message: `Discovered on ${finding.matched_url} (${finding.severity.toUpperCase()})`,
            type: 'warning',
            source: 'Nuclei Scanner',
          });
        },
        onScanError: (err) => {
          addLog({
            level: 'error',
            message: `[ERROR] [${err.target}] ${err.message}`,
            target: err.target,
          });
        },
        onScanCompleted: (res) => {
          setStatus('completed');
          const elapsedSec = (res.elapsed_millis / 1000).toFixed(1);
          addLog({
            level: 'info',
            message: `Scan finished in ${elapsedSec}s. Total vulnerabilities discovered: ${res.total_findings}.`,
          });

          useNotificationStore.getState().addAlert({
            id: `scan-complete-${Date.now()}`,
            title: 'Scan Finished',
            message: `Nuclei completed in ${elapsedSec}s with ${res.total_findings} finding(s).`,
            type: 'success',
            source: 'Nuclei Scanner',
          });
        },
      });

      unlistenRef.current = unlisten;

      // Separate disk template paths and raw memory templates
      const templatePaths = selectedTemplates
        .map((t) => t.source_path)
        .filter((p): p is string => Boolean(p && !p.startsWith('memory://')));

      const rawTemplates = selectedTemplates
        .filter((t) => !t.source_path || t.source_path.startsWith('memory://'))
        .map((t) => t.yaml_content)
        .filter((y): y is string => Boolean(y));

      await startNucleiScan({
        targets,
        template_paths: templatePaths,
        raw_templates: rawTemplates,
        concurrency: config.concurrency,
        rate_limit_rps: config.rate_limit_rps,
        timeout_seconds: config.timeout_seconds,
      });
    } catch (err: any) {
      console.error('Failed to start native Nuclei scan:', err);
      addLog({
        level: 'error',
        message: `Failed to initiate Rust scan engine: ${err?.message || err}`,
      });
      setStatus('error');
    }
  }, [
    targetInput,
    parseTargets,
    templates,
    selectedTemplateIds,
    setScanId,
    setStatus,
    setProgress,
    addLog,
    addFinding,
    config,
    setActiveTab,
  ]);

  return {
    scanId,
    status,
    progress,
    findings,
    startScan,
    pauseScan,
    resumeScan,
    stopScan,
  };
}
