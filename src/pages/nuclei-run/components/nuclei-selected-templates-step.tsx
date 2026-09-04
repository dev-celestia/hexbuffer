import React, { useMemo, useState } from 'react';
import {
  Button,
  Input,
  Badge,
  ScrollArea,
} from '@celestia-project/ui';
import {
  PlayIcon,
  TrashIcon,
  BookmarkSimpleIcon,
  FoldersIcon,
  ShieldCheckIcon,
  GlobeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CirclesFourIcon,
  CheckCircleIcon,
  SlidersHorizontalIcon,
  PlusIcon,
  FolderOpenIcon,
  TreeStructureIcon,
  CodeIcon,
  XIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useNucleiStore } from '@/stores/nuclei';
import { useNucleiScan } from '../hooks/use-nuclei-scan';
import { SEVERITY_CONFIG } from '../constants';
import { NucleiFlowCanvas } from '../flow';
import { readTemplateYaml } from '../lib/nuclei-ipc';
import type { Severity, TemplateItem } from '../types';

type GroupingMode = 'directory' | 'severity' | 'category' | 'saved';

interface NucleiSelectedTemplatesStepProps {
  onBackToHub?: () => void;
  onContinueToResults?: () => void;
}

export function NucleiSelectedTemplatesStep({
  onBackToHub,
  onContinueToResults,
}: Readonly<NucleiSelectedTemplatesStepProps>) {
  const {
    templates,
    selectedTemplateIds,
    toggleTemplateSelection,
    deselectAllTemplates,
    targetInput,
    setTargetInput,
    config,
    setConfig,
    setActiveTab,
    savedGroups,
    saveCurrentSelectionAsGroup,
    loadSavedGroup,
    deleteSavedGroup,
    activeInspectorTemplateId,
    setActiveInspectorTemplateId,
  } = useNucleiStore();

  const { startScan, status } = useNucleiScan();

  const [groupingMode, setGroupingMode] = useState<GroupingMode>('directory');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [isSavingGroup, setIsSavingGroup] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Inspector state
  const [inspectorMode, setInspectorMode] = useState<'yaml' | 'flow'>('yaml');
  const [inspectorYaml, setInspectorYaml] = useState<string>('');
  const [isLoadingYaml, setIsLoadingYaml] = useState<boolean>(false);

  // Selected templates list
  const selectedTemplates = useMemo(() => {
    return templates.filter((t) => selectedTemplateIds.includes(t.id));
  }, [templates, selectedTemplateIds]);

  // Filtered by search within selected
  const filteredSelected = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return selectedTemplates;
    return selectedTemplates.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.cve_id?.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [selectedTemplates, searchFilter]);

  // Grouping logic
  const groupedData = useMemo(() => {
    const groups = new Map<string, TemplateItem[]>();

    if (groupingMode === 'directory') {
      filteredSelected.forEach((t) => {
        const key = (t.directory || 'http').toUpperCase();
        const arr = groups.get(key) || [];
        arr.push(t);
        groups.set(key, arr);
      });
    } else if (groupingMode === 'severity') {
      const order: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
      order.forEach((sev) => {
        const items = filteredSelected.filter((t) => t.severity === sev);
        if (items.length > 0) {
          groups.set(sev.toUpperCase(), items);
        }
      });
    } else if (groupingMode === 'category') {
      filteredSelected.forEach((t) => {
        const key = t.category.toUpperCase();
        const arr = groups.get(key) || [];
        arr.push(t);
        groups.set(key, arr);
      });
    }

    return groups;
  }, [filteredSelected, groupingMode]);

  // Inspector active template
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === activeInspectorTemplateId) || null;
  }, [templates, activeInspectorTemplateId]);

  // Load YAML when inspecting
  React.useEffect(() => {
    let isCancelled = false;
    if (!activeTemplate) {
      setInspectorYaml('');
      return;
    }

    if (activeTemplate.yaml_content) {
      setInspectorYaml(activeTemplate.yaml_content);
      return;
    }

    if (activeTemplate.source_path && !activeTemplate.source_path.startsWith('memory://')) {
      setIsLoadingYaml(true);
      readTemplateYaml(activeTemplate.source_path)
        .then((content) => {
          if (!isCancelled) {
            setInspectorYaml(content);
            setIsLoadingYaml(false);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            setInspectorYaml(`# Error loading YAML: ${err}`);
            setIsLoadingYaml(false);
          }
        });
    } else {
      setInspectorYaml(`# No YAML available for ${activeTemplate.id}`);
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTemplate]);

  // Handle Save Current Selection as Group
  const handleSaveGroup = () => {
    if (!newGroupName.trim()) return;
    saveCurrentSelectionAsGroup(newGroupName);
    setNewGroupName('');
    setIsSavingGroup(false);
  };

  // Run On-Demand Scans
  const handleScanAll = () => {
    startScan();
    if (onContinueToResults) onContinueToResults();
  };

  const handleScanGroup = (templateIds: string[]) => {
    startScan(templateIds);
    if (onContinueToResults) onContinueToResults();
  };

  const handleScanSingleItem = (templateId: string) => {
    startScan([templateId]);
    if (onContinueToResults) onContinueToResults();
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full w-full min-h-0 overflow-hidden",
        // Backgrounds & Borders
        "bg-background text-foreground"
      )}
    >
      {/* ── Top Header: Target Input, Engine Config & Primary Execution ── */}
      <header
        className={cn(
          // Layout & Positioning
          "p-3 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 select-none",
          // Backgrounds & Borders
          "bg-muted/15 border-border"
        )}
      >
        {/* Left: Target Scope URL Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl">
          <GlobeIcon className="size-4 text-primary shrink-0" />
          <div className="flex-1 relative">
            <Input
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="https://example.com or http://localhost:3000 (comma/newline separated)"
              className="h-8 text-xs font-mono bg-background border-border"
            />
          </div>
        </div>

        {/* Middle: Engine Rate & Concurrency Badges */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Badge variant="outline" className="h-6 px-2 border-border/80 text-muted-foreground font-mono">
            Rate: {config.rate_limit_rps} RPS
          </Badge>
          <Badge variant="outline" className="h-6 px-2 border-border/80 text-muted-foreground font-mono">
            Threads: {config.concurrency}
          </Badge>
        </div>

        {/* Right: Primary Scan All & Step Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              if (onBackToHub) onBackToHub();
              else setActiveTab('hub');
            }}
            className="h-7 px-2.5 text-xs gap-1 border-border hover:bg-muted/30"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Add More Templates</span>
          </Button>

          <Button
            size="xs"
            disabled={selectedTemplateIds.length === 0}
            onClick={handleScanAll}
            className="h-7 px-3.5 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
          >
            <PlayIcon className="size-3.5" />
            <span>Scan All ({selectedTemplateIds.length})</span>
          </Button>
        </div>
      </header>

      {/* ── Sub-Toolbar: Grouping Controls, Saved Presets & Staging Counter ── */}
      <div
        className={cn(
          // Layout & Positioning
          "px-3 py-2 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs",
          // Backgrounds & Borders
          "bg-muted/5 border-border"
        )}
      >
        {/* Left: Grouping Mode Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            Group By:
          </span>
          <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-md border border-border/50">
            <button
              type="button"
              onClick={() => setGroupingMode('directory')}
              className={cn(
                "px-2 py-1 text-[11px] font-mono rounded transition-colors",
                groupingMode === 'directory'
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => setGroupingMode('severity')}
              className={cn(
                "px-2 py-1 text-[11px] font-mono rounded transition-colors",
                groupingMode === 'severity'
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Severity
            </button>
            <button
              type="button"
              onClick={() => setGroupingMode('category')}
              className={cn(
                "px-2 py-1 text-[11px] font-mono rounded transition-colors",
                groupingMode === 'category'
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Category
            </button>
            <button
              type="button"
              onClick={() => setGroupingMode('saved')}
              className={cn(
                "px-2 py-1 text-[11px] font-mono rounded transition-colors",
                groupingMode === 'saved'
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Saved Sets ({savedGroups.length})
            </button>
          </div>
        </div>

        {/* Right: Save Group Action & Quick Deselect */}
        <div className="flex items-center gap-2 shrink-0">
          {isSavingGroup ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Critical CVEs Set"
                className="h-7 w-44 text-xs font-mono bg-background"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGroup();
                  if (e.key === 'Escape') setIsSavingGroup(false);
                }}
              />
              <Button size="xs" onClick={handleSaveGroup} className="h-7 px-2 text-xs">
                Save
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsSavingGroup(false)}
                className="h-7 px-1.5 text-xs text-muted-foreground"
              >
                ✕
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsSavingGroup(true)}
              disabled={selectedTemplateIds.length === 0}
              className="h-7 px-2 text-xs gap-1"
            >
              <BookmarkSimpleIcon className="size-3.5 text-amber-400" />
              <span>Save Set for Reuse</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="xs"
            onClick={deselectAllTemplates}
            disabled={selectedTemplateIds.length === 0}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
          >
            <TrashIcon className="size-3.5" />
            <span>Clear Staging</span>
          </Button>
        </div>
      </div>

      {/* ── Main Area: Group Cards or Saved Sets View ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 p-3">
          {selectedTemplateIds.length === 0 && groupingMode !== 'saved' ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <CirclesFourIcon className="size-10 text-muted-foreground/40 mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No templates selected yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Explore the Template Hub in Step 1 to add high-impact CVEs, recon fingerprints, or tech stack checks.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  if (onBackToHub) onBackToHub();
                  else setActiveTab('hub');
                }}
                className="mt-4 h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
              >
                <ArrowLeftIcon className="size-3.5" />
                <span>Go to Step 1: Template Hub</span>
              </Button>
            </div>
          ) : groupingMode === 'saved' ? (
            /* Saved Groups View */
            <div className="flex flex-col gap-3 max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Saved Template Sets</h3>
                  <p className="text-xs text-muted-foreground">
                    Reusable template collections stored locally for quick scanning workflows.
                  </p>
                </div>
              </div>

              {savedGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-xs">
                  <BookmarkSimpleIcon className="size-8 opacity-40 mb-2" />
                  <span>No saved sets found. Stage templates and click "Save Set for Reuse" above.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="p-3 rounded-lg border border-border bg-muted/10 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground font-mono">{group.name}</span>
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-mono text-primary">
                            {group.templateIds.length} templates
                          </Badge>
                        </div>
                        {group.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{group.description}</p>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Saved: {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="xs"
                            onClick={() => loadSavedGroup(group.id)}
                            className="h-6 px-2 text-xs gap-1 bg-primary text-primary-foreground"
                          >
                            <FolderOpenIcon className="size-3" />
                            <span>Load into Staging</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleScanGroup(group.templateIds)}
                            className="h-6 px-2 text-xs gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <PlayIcon className="size-3" />
                            <span>Scan Set</span>
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => deleteSavedGroup(group.id)}
                          className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <TrashIcon className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Grouped Templates Accordion/Cards View */
            <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-6">
              {Array.from(groupedData.entries()).map(([groupName, items]) => (
                <div
                  key={groupName}
                  className="rounded-lg border border-border bg-muted/5 overflow-hidden shadow-sm"
                >
                  {/* Group Header with "Scan Group" Action */}
                  <div className="px-3.5 py-2.5 bg-muted/15 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FoldersIcon className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-mono font-bold text-foreground truncate">
                        {groupName}
                      </span>
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-mono text-muted-foreground">
                        {items.length} {items.length === 1 ? 'template' : 'templates'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleScanGroup(items.map((t) => t.id))}
                        className="h-6 px-2.5 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10 font-medium"
                      >
                        <PlayIcon className="size-3 text-primary" />
                        <span>Scan Group ({items.length})</span>
                      </Button>
                    </div>
                  </div>

                  {/* Group Items Table */}
                  <div className="divide-y divide-border/60">
                    {items.map((template) => {
                      const sevCfg = SEVERITY_CONFIG[template.severity] || SEVERITY_CONFIG.info;
                      const isInspecting = activeInspectorTemplateId === template.id;

                      return (
                        <div
                          key={template.id}
                          onClick={() => setActiveInspectorTemplateId(template.id)}
                          className={cn(
                            "px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs select-none",
                            isInspecting
                              ? "bg-primary/10"
                              : "hover:bg-muted/15"
                          )}
                        >
                          {/* Item Metadata */}
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-4 px-1 text-[9px] font-mono capitalize shrink-0 font-medium",
                                sevCfg.bg,
                                sevCfg.text,
                                sevCfg.border
                              )}
                            >
                              {template.severity}
                            </Badge>

                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-foreground truncate">
                                  {template.id}
                                </span>
                                {template.directory && (
                                  <span className="text-[9px] font-mono text-muted-foreground px-1 bg-muted/40 rounded">
                                    {template.directory}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {template.name}
                              </span>
                            </div>
                          </div>

                          {/* Individual Actions: On-Demand Scan Item & Remove */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScanSingleItem(template.id);
                              }}
                              className="h-6 px-2 text-[10px] font-mono gap-1 hover:border-emerald-500/40 hover:text-emerald-400"
                            >
                              <PlayIcon className="size-3 text-emerald-400" />
                              <span>Scan Item</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTemplateSelection(template.id);
                              }}
                              className="h-6 px-1.5 text-muted-foreground hover:text-destructive"
                            >
                              <XIcon className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* ── Optional Right Split Inspector Pane ── */}
        {activeTemplate && (
          <aside
            className={cn(
              // Layout & Positioning
              "w-[420px] shrink-0 flex flex-col border-l overflow-hidden select-none",
              // Backgrounds & Borders
              "bg-background border-border"
            )}
          >
            {/* Header */}
            <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-4 px-1.5 text-[9px] font-mono capitalize shrink-0 font-medium",
                    SEVERITY_CONFIG[activeTemplate.severity]?.bg,
                    SEVERITY_CONFIG[activeTemplate.severity]?.text,
                    SEVERITY_CONFIG[activeTemplate.severity]?.border
                  )}
                >
                  {activeTemplate.severity}
                </Badge>
                <span className="text-xs font-mono font-bold text-foreground truncate">
                  {activeTemplate.id}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveInspectorTemplateId(null)}
                className="text-muted-foreground hover:text-foreground p-1 shrink-0"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* View switcher */}
            <div className="px-3 py-1.5 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded">
                <button
                  type="button"
                  onClick={() => setInspectorMode('yaml')}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-mono rounded",
                    inspectorMode === 'yaml' ? "bg-background font-bold shadow-sm" : "text-muted-foreground"
                  )}
                >
                  YAML
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorMode('flow')}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-mono rounded",
                    inspectorMode === 'flow' ? "bg-background font-bold shadow-sm" : "text-muted-foreground"
                  )}
                >
                  Flow DAG
                </button>
              </div>

              <Button
                size="xs"
                onClick={() => handleScanSingleItem(activeTemplate.id)}
                className="h-6 px-2 text-[10px] gap-1 bg-primary text-primary-foreground font-mono"
              >
                <PlayIcon className="size-3" />
                <span>Scan Item Now</span>
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {inspectorMode === 'yaml' ? (
                <pre className="h-full p-3 overflow-auto font-mono text-xs text-zinc-300 bg-black/90 leading-relaxed select-text">
                  <code>{inspectorYaml}</code>
                </pre>
              ) : (
                <div className="h-full w-full">
                  <NucleiFlowCanvas yamlContent={inspectorYaml} hideToolbar={false} />
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
