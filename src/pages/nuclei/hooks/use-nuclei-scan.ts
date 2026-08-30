import { useRef, useCallback, useEffect } from 'react';
import { useNucleiStore } from '@/stores/nuclei';
import { useNotificationStore } from '@/stores/notifications';
import type { NucleiFinding } from '../types';

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
  } = useNucleiStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Parse targets from target input
  const parseTargets = useCallback((raw: string): string[] => {
    return raw
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !t.startsWith('#'))
      .map((t) => {
        if (!t.startsWith('http://') && !t.startsWith('https://')) {
          return `https://${t}`;
        }
        return t;
      });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const stopScan = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('cancelled');
    addLog({
      level: 'warn',
      message: 'Scan cancelled by user.',
    });
  }, [setStatus, addLog]);

  const pauseScan = useCallback(() => {
    if (status === 'running') {
      isPausedRef.current = true;
      setStatus('paused');
      addLog({
        level: 'info',
        message: 'Scan execution paused.',
      });
    }
  }, [status, setStatus, addLog]);

  const resumeScan = useCallback(() => {
    if (status === 'paused') {
      isPausedRef.current = false;
      setStatus('running');
      addLog({
        level: 'info',
        message: 'Scan execution resumed.',
      });
    }
  }, [status, setStatus, addLog]);

  const startScan = useCallback(() => {
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

    const selectedTemplates = templates.filter((t) => selectedTemplateIds.includes(t.id));
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

    // Reset previous scan run
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const newScanId = `scan-${Date.now()}`;
    setScanId(newScanId);
    setStatus('running');
    isPausedRef.current = false;
    startTimeRef.current = Date.now();
    pausedElapsedRef.current = 0;

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
      message: `Nuclei engine initialized. Loaded ${selectedTemplates.length} templates across ${targets.length} target(s). Concurrency: ${config.concurrency}, Rate Limit: ${config.rate_limit_rps} RPS.`,
    });

    useNotificationStore.getState().addAlert({
      id: `nuclei-started-${Date.now()}`,
      title: 'Scan Started',
      message: `Nuclei scanner initiated on ${targets[0]}${targets.length > 1 ? ` (+${targets.length - 1} more)` : ''}`,
      type: 'info',
      source: 'Nuclei Scanner',
    });

    // Client-side simulation runner (until native backend engine is running)
    let currentStep = 0;
    const intervalMs = Math.max(80, Math.floor(1000 / (config.rate_limit_rps / 5)));

    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;

      currentStep += Math.max(1, Math.floor(config.concurrency / 6));
      const completed = Math.min(currentStep, totalRequests);
      const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const rps = parseFloat((completed / elapsed).toFixed(1));
      const percentage = Math.min(100, Math.round((completed / totalRequests) * 100));

      setProgress({
        completed_requests: completed,
        total_requests: totalRequests,
        rps,
        percentage,
        elapsed_seconds: elapsed,
      });

      // Realistic discovery trigger
      const templateIdx = completed % selectedTemplates.length;
      const currentTemplate = selectedTemplates[templateIdx];
      const currentTarget = targets[completed % targets.length];

      // Emit simulated periodic log
      if (completed % Math.max(1, Math.floor(totalRequests / 15)) === 0) {
        addLog({
          level: 'info',
          message: `[${currentTemplate.protocol.toUpperCase()}] Executing "${currentTemplate.name}" on ${currentTarget}`,
          target: currentTarget,
          template_id: currentTemplate.id,
        });
      }

      // Check if this step simulates a finding discovery
      if (
        (completed === Math.floor(totalRequests * 0.15) ||
          completed === Math.floor(totalRequests * 0.4) ||
          completed === Math.floor(totalRequests * 0.72) ||
          completed === Math.floor(totalRequests * 0.88)) &&
        currentTemplate
      ) {
        const pathSuffix =
          currentTemplate.category === 'exposures'
            ? '/.env'
            : currentTemplate.category === 'default-logins'
            ? '/manager/html'
            : currentTemplate.category === 'cves'
            ? '/api/v1/totp/user-backup-code'
            : '/graphql';

        const matchedUrl = `${currentTarget.replace(/\/$/, '')}${pathSuffix}`;

        const simulatedFinding: NucleiFinding = {
          id: `finding-${Date.now()}-${currentTemplate.id}`,
          template_id: currentTemplate.id,
          template_name: currentTemplate.name,
          severity: currentTemplate.severity,
          matched_url: matchedUrl,
          matched_at: new Date().toISOString(),
          extracted_results:
            currentTemplate.severity === 'critical'
              ? ['build_version="22.3R1"', 'admin_token=eyJhbGciOi...']
              : currentTemplate.severity === 'high'
              ? ['DB_HOST=10.0.4.12', 'DB_PASSWORD=super_secret_pw']
              : currentTemplate.severity === 'medium'
              ? ['ref: refs/heads/main', 'repositoryformatversion=0']
              : ['query: __schema { types { name } }'],
          protocol: currentTemplate.protocol,
          tags: currentTemplate.tags,
          description: currentTemplate.description,
          author: currentTemplate.author,
          cve_id: currentTemplate.cve_id,
          remediation: `Review access controls and patch or restrict endpoint ${pathSuffix} immediately.`,
          curl_command: `curl -i -s -k -X GET "${matchedUrl}" -H "User-Agent: Nuclei-Engine/0.1.0"`,
        };

        addFinding(simulatedFinding);

        addLog({
          level: 'vuln',
          message: `[${simulatedFinding.severity.toUpperCase()}] Discovered: ${simulatedFinding.template_name} at ${matchedUrl}`,
          target: currentTarget,
          template_id: simulatedFinding.template_id,
          severity: simulatedFinding.severity,
        });

        useNotificationStore.getState().addAlert({
          id: `finding-alert-${Date.now()}`,
          title: `[${simulatedFinding.severity.toUpperCase()}] Finding Discovered`,
          message: `${simulatedFinding.template_name} on ${simulatedFinding.matched_url}`,
          type: simulatedFinding.severity === 'critical' || simulatedFinding.severity === 'high' ? 'error' : 'warning',
          source: 'Nuclei Scanner',
        });
      }

      // Check completion
      if (completed >= totalRequests) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setStatus('completed');
        addLog({
          level: 'success',
          message: `Scan finished in ${elapsed}s. Processed ${totalRequests} requests. ${findings.length} findings recorded.`,
        });

        useNotificationStore.getState().addAlert({
          id: `nuclei-completed-${Date.now()}`,
          title: 'Scan Completed',
          message: `Scan on ${targets[0]} completed with ${findings.length} findings.`,
          type: 'success',
          source: 'Nuclei Scanner',
        });
      }
    }, intervalMs);
  }, [
    targetInput,
    parseTargets,
    templates,
    selectedTemplateIds,
    config,
    setScanId,
    setStatus,
    setProgress,
    addLog,
    addFinding,
    findings.length,
  ]);

  return {
    status,
    progress,
    scanId,
    startScan,
    pauseScan,
    resumeScan,
    stopScan,
    parseTargets,
  };
}
