import React, { useMemo, useState, useEffect, useRef, useDeferredValue } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Button,
  Input,
  Badge,
  Checkbox,
  ScrollArea,
} from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  TagIcon,
  ArrowRightIcon,
  TrashIcon,
  CheckSquareIcon,
  ScanIcon,
  FlameIcon,
  BugIcon,
  CpuIcon,
  CirclesFourIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useNucleiStore } from '@/stores/nuclei';
import { RESEARCHER_STRATEGIES, TECH_STACKS } from '../constants/categories';
import { SEVERITY_CONFIG } from '../constants';
import type { Severity, TemplateItem } from '../types';

interface NucleiTemplateSelectorProps {
  onContinueToScan?: () => void;
}

export function NucleiTemplateSelector({ onContinueToScan }: Readonly<NucleiTemplateSelectorProps>) {
  const {
    templates,
    selectedTemplateIds,
    toggleTemplateSelection,
    selectAllTemplates,
    deselectAllTemplates,
    activeCategory,
    setActiveCategory,
    selectCategoryTemplates,
    syncStatus,
    syncFromGitHub,
    checkCachedGitHubTemplates,
    setActiveTab,
  } = useNucleiStore();

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);

  // Check cached templates on mount
  useEffect(() => {
    checkCachedGitHubTemplates();
  }, [checkCachedGitHubTemplates]);

  // Handle severity filter toggle
  const toggleSeverity = (sev: Severity) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  // Find active strategy/category metadata
  const activeStrategy = useMemo(() => {
    return RESEARCHER_STRATEGIES.find((s) => s.id === activeCategory);
  }, [activeCategory]);

  const activeTech = useMemo(() => {
    return TECH_STACKS.find((t) => t.id === activeCategory);
  }, [activeCategory]);

  // Filter templates based on active category, search, and severities
  const filteredTemplates = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const hasSearch = q.length > 0;
    const hasSeverities = selectedSeverities.length > 0;

    return templates.filter((t) => {
      // 1. Search query
      if (hasSearch) {
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesCve = t.cve_id?.toLowerCase().includes(q);
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesName && !matchesId && !matchesCve && !matchesTag) {
          return false;
        }
      }

      // 2. Severity filter
      if (hasSeverities && !selectedSeverities.includes(t.severity)) {
        return false;
      }

      // 3. Category / Strategy filter
      if (activeCategory === 'all') {
        return true;
      }

      if (activeStrategy) {
        if (activeStrategy.id === 'recon-first') {
          return t.tags.some((tag) =>
            ['tech', 'panel', 'exposure', 'detection', 'recon'].includes(tag.toLowerCase())
          );
        }
        if (activeStrategy.id === 'cves-critical-high') {
          return (
            ['critical', 'high'].includes(t.severity) &&
            (Boolean(t.cve_id) || t.tags.some((tag) => tag.toLowerCase().includes('cve')))
          );
        }
        if (activeStrategy.id === 'recent-cves') {
          return (
            t.tags.some((tag) => tag.includes('2025') || tag.includes('2026')) ||
            (t.cve_id ? t.cve_id.includes('2025') || t.cve_id.includes('2026') : false)
          );
        }
        if (activeStrategy.id === 'dast-fuzzing') {
          return t.tags.some((tag) =>
            ['dast', 'fuzzing', 'xss', 'sqli', 'lfi', 'ssrf'].includes(tag.toLowerCase())
          );
        }
        if (activeStrategy.id === 'cloud-token-leaks') {
          return t.tags.some((tag) =>
            ['token', 'cloud', 'aws', 's3', 'azure', 'credentials'].includes(tag.toLowerCase())
          );
        }
      }

      if (activeTech) {
        const techId = activeTech.id;
        return (
          t.tags.some((tag) => tag.toLowerCase().includes(techId)) ||
          t.name.toLowerCase().includes(techId) ||
          t.description.toLowerCase().includes(techId)
        );
      }

      return true;
    });
  }, [templates, deferredSearchQuery, selectedSeverities, activeCategory, activeStrategy, activeTech]);

  // Fast O(1) set for selection state in virtual list
  const selectedSet = useMemo(() => new Set(selectedTemplateIds), [selectedTemplateIds]);

  // Virtual list scroll container ref
  const parentScrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredTemplates.length,
    getScrollElement: () => parentScrollRef.current,
    estimateSize: () => 104, // Typical height of template card + margin
    overscan: 5,
  });

  // Select all currently filtered
  const handleSelectFiltered = () => {
    const idsToAdd = filteredTemplates.map((t) => t.id);
    const set = new Set([...selectedTemplateIds, ...idsToAdd]);
    useNucleiStore.setState({ selectedTemplateIds: Array.from(set) });
  };

  // Deselect all currently filtered
  const handleDeselectFiltered = () => {
    const idsToRemove = new Set(filteredTemplates.map((t) => t.id));
    useNucleiStore.setState({
      selectedTemplateIds: selectedTemplateIds.filter((id) => !idsToRemove.has(id)),
    });
  };

  const handleProceed = () => {
    if (onContinueToScan) {
      onContinueToScan();
    } else {
      setActiveTab('scan');
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full w-full overflow-hidden",
        // Backgrounds & Borders
        "bg-background text-foreground"
      )}
    >
      {/* ── Main 2-Column Workflow Area ───────────────────────────────────── */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 flex min-h-0 overflow-hidden"
        )}
      >
        {/* ── Left Sidebar: Categories & Curated Strategies ─────────────── */}
        <aside
          className={cn(
            // Layout & Positioning
            "w-72 shrink-0 flex flex-col border-r overflow-hidden",
            // Backgrounds & Borders
            "bg-muted/10 border-border"
          )}
        >
          {/* GitHub Sync Status Card */}
          <div
            className={cn(
              // Layout & Positioning
              "p-3 border-b shrink-0 flex flex-col gap-2",
              // Backgrounds & Borders
              "border-border bg-muted/20"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase font-mono">
                Official Hub
              </span>
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[9px] font-mono border-emerald-500/30 text-emerald-400"
              >
                GitHub v3
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              Sync thousands of public community templates directly from{' '}
              <span className="font-mono text-foreground font-medium">projectdiscovery</span>.
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={syncStatus.isSyncing}
              onClick={() => syncFromGitHub(false)}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2.5 w-full text-xs font-medium justify-between",
                // Backgrounds & Borders
                "bg-background hover:bg-muted/30 border-border"
              )}
            >
              <div className="flex items-center gap-1.5">
                <CloudArrowDownIcon
                  className={cn(
                    "size-3.5 text-primary",
                    syncStatus.isSyncing && "animate-bounce"
                  )}
                />
                <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Official Templates'}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {syncStatus.totalTemplates} loaded
              </span>
            </Button>

            {syncStatus.progressMessage && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {syncStatus.progressMessage}
              </p>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 flex flex-col gap-4">
              {/* Category Group 1: Curated Phases */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                    Phased Scanning
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      "text-[10px] font-mono hover:underline",
                      activeCategory === 'all' ? "text-primary font-bold" : "text-muted-foreground"
                    )}
                  >
                    View All ({templates.length})
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {RESEARCHER_STRATEGIES.map((strat) => {
                    const isActive = activeCategory === strat.id;
                    return (
                      <div
                        key={strat.id}
                        onClick={() => setActiveCategory(strat.id)}
                        className={cn(
                          // Layout & Positioning
                          "flex items-start justify-between p-2 rounded-md cursor-pointer transition-colors text-left",
                          // Backgrounds & Borders
                          isActive
                            ? "bg-primary/10 border border-primary/30 text-foreground"
                            : "hover:bg-muted/20 border border-transparent text-muted-foreground"
                        )}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            {strat.id === 'recon-first' && <ScanIcon className="size-3.5 text-sky-400 shrink-0" />}
                            {strat.id === 'cves-critical-high' && <ShieldCheckIcon className="size-3.5 text-rose-400 shrink-0" />}
                            {strat.id === 'recent-cves' && <FlameIcon className="size-3.5 text-amber-400 shrink-0" />}
                            {strat.id === 'dast-fuzzing' && <BugIcon className="size-3.5 text-purple-400 shrink-0" />}
                            {strat.id === 'cloud-token-leaks' && <CloudArrowDownIcon className="size-3.5 text-teal-400 shrink-0" />}
                            <span className="text-xs font-semibold truncate text-foreground">
                              {strat.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {strat.description}
                          </span>
                        </div>

                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[9px] font-mono shrink-0"
                        >
                          {strat.badge}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Group 2: Tech Stacks */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono px-1">
                  Contextual Tech Stacks
                </span>
                <div className="flex flex-col gap-1">
                  {TECH_STACKS.map((tech) => {
                    const isActive = activeCategory === tech.id;
                    return (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => setActiveCategory(tech.id)}
                        className={cn(
                          // Layout & Positioning
                          "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors text-left w-full",
                          // Backgrounds & Borders
                          isActive
                            ? "bg-primary/10 border border-primary/30 text-foreground"
                            : "hover:bg-muted/20 border border-transparent text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CpuIcon className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate text-foreground">
                            {tech.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {tech.tags[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* ── Right Column: Template Grid & Batch Actions ────────────────── */}
        <main
          className={cn(
            // Layout & Positioning
            "flex-1 flex flex-col min-w-0 overflow-hidden"
          )}
        >
          {/* Header Controls Bar */}
          <div
            className={cn(
              // Layout & Positioning
              "p-3 border-b shrink-0 flex flex-col gap-2.5",
              // Backgrounds & Borders
              "bg-muted/5 border-border"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter templates by name, CVE ID, tag, or technology..."
                  className="h-7 pl-8 pr-3 text-xs w-full bg-background"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => selectCategoryTemplates(activeCategory)}
                  className="h-7 px-2 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <CheckSquareIcon className="size-3.5" />
                  <span>Select Suite</span>
                </Button>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleSelectFiltered}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <span>Select Filtered</span>
                </Button>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleDeselectFiltered}
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                >
                  <TrashIcon className="size-3.5" />
                  <span>Deselect</span>
                </Button>
              </div>
            </div>

            {/* Severity Filter Pills & Strategy Context Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground uppercase mr-1">
                  Severity:
                </span>
                {(['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map((sev) => {
                  const isSelected = selectedSeverities.includes(sev);
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => toggleSeverity(sev)}
                      className={cn(
                        // Sizing & Spacing
                        "h-5 px-2 rounded text-[10px] font-mono uppercase font-semibold transition-all border",
                        isSelected
                          ? cn(SEVERITY_CONFIG[sev]?.bg, SEVERITY_CONFIG[sev]?.text, "border-current shadow-xs")
                          : "border-border text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      {sev}
                    </button>
                  );
                })}
                {selectedSeverities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSeverities([])}
                    className="text-[10px] text-muted-foreground hover:underline ml-1 font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  Showing <span className="font-semibold text-foreground">{filteredTemplates.length}</span> of {templates.length}
                </span>
              </div>
            </div>
          </div>

          {/* Active Strategy Rationale Banner */}
          {activeStrategy && (
            <div className="px-3.5 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono border-primary/30 text-primary">
                  {activeStrategy.badge}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {activeStrategy.description}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase hidden md:inline">
                Noise Profile: <span className="text-foreground font-medium">{activeStrategy.recommendedNoise}</span>
              </span>
            </div>
          )}

          {/* Template List Items with Windowed Virtualization */}
          <div
            ref={parentScrollRef}
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0 overflow-y-auto",
              // Sizing & Spacing
              "px-3 py-2"
            )}
          >
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
                <CirclesFourIcon className="size-8 opacity-40" />
                <p className="text-sm font-medium">No templates matched your filters.</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Try adjusting your search keywords, clearing severity pills, or syncing latest templates from the official hub.
                </p>
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const t = filteredTemplates[virtualRow.index];
                  if (!t) return null;
                  const isSelected = selectedSet.has(t.id);

                  return (
                    <div
                      key={t.id}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pb-2"
                    >
                      <div
                        onClick={() => toggleTemplateSelection(t.id)}
                        className={cn(
                          // Layout & Positioning
                          "flex items-start gap-3 p-2.5 rounded-md cursor-pointer transition-all border",
                          // Backgrounds & Borders
                          isSelected
                            ? "bg-primary/5 border-primary/30"
                            : "bg-card hover:bg-muted/10 border-border"
                        )}
                      >
                        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTemplateSelection(t.id)}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {t.name}
                              </span>
                              {t.cve_id && (
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1 text-[9px] font-mono text-amber-500 border-amber-500/30"
                                >
                                  {t.cve_id}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={cn(
                                  "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold",
                                  SEVERITY_CONFIG[t.severity]?.bg,
                                  SEVERITY_CONFIG[t.severity]?.text
                                )}
                              >
                                {t.severity}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {t.description || 'No detailed description available for this template.'}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[9px] font-mono text-muted-foreground">
                              id: {t.id}
                            </span>
                            <span className="text-muted-foreground/40">•</span>
                            {t.tags.slice(0, 5).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="h-3.5 px-1 text-[8px] font-mono text-muted-foreground border-border/60"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {t.tags.length > 5 && (
                              <span className="text-[9px] font-mono text-muted-foreground">
                                +{t.tags.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer Selection Bar & Action ───────────────────────────── */}
          <footer
            className={cn(
              // Layout & Positioning
              "h-12 px-4 border-t shrink-0 flex items-center justify-between z-10",
              // Backgrounds & Borders
              "bg-muted/15 border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-6 px-2 text-xs font-mono border-primary/30 text-primary font-semibold"
              >
                {selectedTemplateIds.length} Selected
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                of {templates.length} available templates
              </span>
            </div>

            <Button
              size="sm"
              disabled={selectedTemplateIds.length === 0}
              onClick={handleProceed}
              className={cn(
                // Sizing & Spacing
                "h-8 px-4 text-xs font-medium gap-1.5",
                // Interactive & States
                selectedTemplateIds.length > 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "opacity-50"
              )}
            >
              <span>Continue to Scan ({selectedTemplateIds.length})</span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </footer>
        </main>
      </div>
    </div>
  );
}
