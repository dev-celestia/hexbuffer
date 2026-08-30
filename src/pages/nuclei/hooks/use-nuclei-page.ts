import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNucleiStore } from '@/stores/nuclei';
import { useNucleiScan } from './use-nuclei-scan';
import { useTemplateStudio } from './use-template-studio';
import { useNotificationStore } from '@/stores/notifications';
import { useRepeaterStore } from '@/stores/repeater';
import type { NucleiFinding, Severity, ProtocolType } from '../types';
import { generateCurlCommand, generateSarifReport, generateJsonlReport, generateCsvReport, generateMarkdownSummary } from '../lib/formatters';

export function useNucleiPage() {
  const navigate = useNavigate();
  const store = useNucleiStore();
  const scan = useNucleiScan();
  const studio = useTemplateStudio();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');

  // ── Filtered Findings ──────────────────────────────────
  const filteredFindings = useMemo(() => {
    return store.findings.filter((finding) => {
      // Search text match
      if (store.findingSearchQuery.trim()) {
        const q = store.findingSearchQuery.toLowerCase();
        const matchesQuery =
          finding.template_name.toLowerCase().includes(q) ||
          finding.template_id.toLowerCase().includes(q) ||
          finding.matched_url.toLowerCase().includes(q) ||
          (finding.cve_id && finding.cve_id.toLowerCase().includes(q)) ||
          (finding.tags && finding.tags.some((t) => t.toLowerCase().includes(q)));
        if (!matchesQuery) return false;
      }

      // Severity match
      if (store.severityFilter.length > 0) {
        if (!store.severityFilter.includes(finding.severity)) return false;
      }

      // Protocol match
      if (store.protocolFilter.length > 0) {
        if (!store.protocolFilter.includes(finding.protocol)) return false;
      }

      return true;
    });
  }, [store.findings, store.findingSearchQuery, store.severityFilter, store.protocolFilter]);

  // ── Selected Finding ───────────────────────────────────
  const selectedFinding = useMemo(() => {
    if (!store.selectedFindingId) return null;
    return store.findings.find((f) => f.id === store.selectedFindingId) || null;
  }, [store.findings, store.selectedFindingId]);

  // ── Filtered Templates in Hub ──────────────────────────
  const filteredTemplates = useMemo(() => {
    return store.templates.filter((tmpl) => {
      if (templateCategory !== 'all' && tmpl.category !== templateCategory) {
        return false;
      }
      if (templateSearchQuery.trim()) {
        const q = templateSearchQuery.toLowerCase();
        const matches =
          tmpl.name.toLowerCase().includes(q) ||
          tmpl.id.toLowerCase().includes(q) ||
          (tmpl.cve_id && tmpl.cve_id.toLowerCase().includes(q)) ||
          tmpl.tags.some((t) => t.toLowerCase().includes(q)) ||
          tmpl.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [store.templates, templateCategory, templateSearchQuery]);

  // ── Actions ───────────────────────────────────────────
  const handleToggleSeverityFilter = useCallback(
    (sev: Severity) => {
      const current = store.severityFilter;
      if (current.includes(sev)) {
        store.setSeverityFilter(current.filter((s) => s !== sev));
      } else {
        store.setSeverityFilter([...current, sev]);
      }
    },
    [store]
  );

  const handleToggleProtocolFilter = useCallback(
    (proto: ProtocolType) => {
      const current = store.protocolFilter;
      if (current.includes(proto)) {
        store.setProtocolFilter(current.filter((p) => p !== proto));
      } else {
        store.setProtocolFilter([...current, proto]);
      }
    },
    [store]
  );

  const copyFindingCurl = useCallback(
    (finding: NucleiFinding) => {
      const curl = generateCurlCommand(finding);
      navigator.clipboard.writeText(curl);
      useNotificationStore.getState().addAlert({
        id: `copy-curl-${Date.now()}`,
        title: 'cURL Command Copied',
        message: 'Command has been copied to clipboard.',
        type: 'info',
        source: 'Nuclei Scanner',
      });
    },
    []
  );

  const sendToRepeater = useCallback(
    (finding: NucleiFinding) => {
      try {
        const wsId = useRepeaterStore.getState().createWorkspace(`Vuln: ${finding.template_id}`);
        useRepeaterStore.getState().setActiveWorkspaceId(wsId);
        useNotificationStore.getState().addAlert({
          id: `repeater-sent-${Date.now()}`,
          title: 'Sent to Repeater',
          message: `Finding ${finding.template_name} forwarded to Repeater workspace.`,
          type: 'success',
          source: 'Nuclei Scanner',
        });
        navigate('/repeater');
      } catch (e) {
        console.error('Failed to forward to Repeater:', e);
      }
    },
    [navigate]
  );

  const sendToComparer = useCallback(
    (finding: NucleiFinding) => {
      navigate('/comparer');
    },
    [navigate]
  );

  const stats = useMemo(() => store.getSummaryStats(), [store]);

  return {
    ...store,
    ...scan,
    studio,
    stats,
    filteredFindings,
    selectedFinding,
    filteredTemplates,
    templateCategory,
    setTemplateCategory,
    templateSearchQuery,
    setTemplateSearchQuery,
    isConfigOpen,
    setIsConfigOpen,
    isExportOpen,
    setIsExportOpen,
    handleToggleSeverityFilter,
    handleToggleProtocolFilter,
    copyFindingCurl,
    sendToRepeater,
    sendToComparer,
  };
}
