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
  FoldersIcon,
  UserIcon,
  CodeIcon,
  TreeStructureIcon,
  CopyIcon,
  XIcon,
  CirclesFourIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useNucleiStore } from '@/stores/nuclei';
import {
  NUCLEI_DIRECTORIES,
  POPULAR_TAGS,
  TOP_AUTHORS,
  PROTOCOL_TYPES,
  RESEARCHER_STRATEGIES,
  TECH_STACKS,
} from '../constants/categories';
import { SEVERITY_CONFIG, PROTOCOL_BADGES } from '../constants';
import { NucleiFlowCanvas } from '../flow';
import { readTemplateYaml } from '../lib/nuclei-ipc';
import type { Severity, TemplateItem } from '../types';

interface NucleiTemplateHubStepProps {
  onContinueToSelected?: () => void;
}

type TaxonomyTab = 'directories' | 'tags' | 'tech' | 'strategies' | 'authors' | 'severities' | 'protocols';

export function NucleiTemplateHubStep({ onContinueToSelected }: Readonly<NucleiTemplateHubStepProps>) {
  const {
    templates,
    selectedTemplateIds,
    toggleTemplateSelection,
    selectAllTemplates,
    deselectAllTemplates,
    activeCategory,
    setActiveCategory,
    syncStatus,
    syncFromGitHub,
    checkCachedGitHubTemplates,
    setActiveTab,
    activeInspectorTemplateId,
    setActiveInspectorTemplateId,
  } = useNucleiStore();

  const [activeTaxonomyTab, setActiveTaxonomyTab] = useState<TaxonomyTab>('directories');
  const [selectedDirectory, setSelectedDirectory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Inspector state
  const [inspectorMode, setInspectorMode] = useState<'yaml' | 'flow'>('yaml');
  const [inspectorYaml, setInspectorYaml] = useState<string>('');
  const [isLoadingYaml, setIsLoadingYaml] = useState<boolean>(false);
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);

  // Check cached templates on mount
  useEffect(() => {
    checkCachedGitHubTemplates();
  }, [checkCachedGitHubTemplates]);

  // Selected template for detail pane
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === activeInspectorTemplateId) || null;
  }, [templates, activeInspectorTemplateId]);

  // Load YAML content on inspector template change
  useEffect(() => {
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
            setInspectorYaml(`# Failed to read file: ${err}\n# Path: ${activeTemplate.source_path}`);
            setIsLoadingYaml(false);
          }
        });
    } else {
      setInspectorYaml(`# No YAML available for template: ${activeTemplate.id}`);
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTemplate]);

  // Copy YAML handler
  const handleCopyYaml = () => {
    if (inspectorYaml) {
      navigator.clipboard.writeText(inspectorYaml);
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 2000);
    }
  };

  // Toggle severity filter
  const toggleSeverity = (sev: Severity) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  // Precompute directory counts
  const directoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    templates.forEach((t) => {
      const dir = t.directory || 'http';
      map.set(dir, (map.get(dir) || 0) + 1);
    });
    return map;
  }, [templates]);

  // Precompute tag counts
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    templates.forEach((t) => {
      t.tags.forEach((tag) => {
        const lower = tag.toLowerCase();
        map.set(lower, (map.get(lower) || 0) + 1);
      });
    });
    return map;
  }, [templates]);

  // Precompute author counts
  const authorCounts = useMemo(() => {
    const map = new Map<string, number>();
    templates.forEach((t) => {
      const auth = t.author.toLowerCase();
      map.set(auth, (map.get(auth) || 0) + 1);
    });
    return map;
  }, [templates]);

  // Precompute protocol counts
  const protocolCounts = useMemo(() => {
    const map = new Map<string, number>();
    templates.forEach((t) => {
      const p = t.protocol.toLowerCase();
      map.set(p, (map.get(p) || 0) + 1);
    });
    return map;
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const hasSearch = q.length > 0;
    const hasSeverities = selectedSeverities.length > 0;

    return templates.filter((t) => {
      // 1. Search Query
      if (hasSearch) {
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesCve = t.cve_id?.toLowerCase().includes(q);
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesAuthor = t.author.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesCve && !matchesTag && !matchesAuthor) {
          return false;
        }
      }

      // 2. Severities
      if (hasSeverities && !selectedSeverities.includes(t.severity)) {
        return false;
      }

      // 3. Directory
      if (selectedDirectory !== 'all') {
        const dir = t.directory || 'http';
        if (dir.toLowerCase() !== selectedDirectory.toLowerCase()) {
          return false;
        }
      }

      // 4. Tag
      if (selectedTag) {
        const hasTag = t.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // 5. Author
      if (selectedAuthor) {
        const matchesAuth = t.author.toLowerCase().includes(selectedAuthor.toLowerCase());
        if (!matchesAuth) return false;
      }

      // 6. Protocol
      if (selectedProtocol !== 'all') {
        if (t.protocol.toLowerCase() !== selectedProtocol.toLowerCase()) {
          return false;
        }
      }

      // 7. Tech Stack / Strategy category
      if (activeCategory !== 'all') {
        const activeTech = TECH_STACKS.find((tech) => tech.id === activeCategory);
        if (activeTech) {
          const hasTechTag = t.tags.some((tag) =>
            activeTech.tags.some((techTag) => tag.toLowerCase().includes(techTag.toLowerCase()))
          );
          if (!hasTechTag && !t.name.toLowerCase().includes(activeTech.id)) {
            return false;
          }
        } else {
          const strat = RESEARCHER_STRATEGIES.find((s) => s.id === activeCategory);
          if (strat) {
            const hasStratTag = t.tags.some((tag) =>
              strat.tags.some((stratTag) => tag.toLowerCase().includes(stratTag.toLowerCase()))
            );
            if (!hasStratTag) return false;
          }
        }
      }

      return true;
    });
  }, [
    templates,
    deferredSearchQuery,
    selectedSeverities,
    selectedDirectory,
    selectedTag,
    selectedAuthor,
    selectedProtocol,
    activeCategory,
  ]);

  // Virtualized List setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredTemplates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  // Batch action: Select all filtered
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredTemplates.map((t) => t.id);
    const set = new Set([...selectedTemplateIds, ...filteredIds]);
    useNucleiStore.setState({ selectedTemplateIds: Array.from(set) });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedDirectory('all');
    setSelectedTag(null);
    setSelectedAuthor(null);
    setSelectedProtocol('all');
    setSelectedSeverities([]);
    setActiveCategory('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedDirectory !== 'all' ||
    selectedTag !== null ||
    selectedAuthor !== null ||
    selectedProtocol !== 'all' ||
    selectedSeverities.length > 0 ||
    activeCategory !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full w-full min-h-0 overflow-hidden",
        // Backgrounds & Borders
        "bg-background text-foreground"
      )}
    >
      {/* ── Main 3-Pane Body: Taxonomy Sidebar | Template List | Detail Inspector ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ── Left Pane: Standard Nuclei Taxonomy & GitHub Hub ─────────────── */}
        <aside
          className={cn(
            // Layout & Positioning
            "w-72 shrink-0 flex flex-col border-r overflow-hidden select-none",
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
                Official Nuclei Hub
              </span>
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[9px] font-mono border-emerald-500/30 text-emerald-400 font-medium"
              >
                Community v3
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              Sync community templates directly from{' '}
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
              <div className="flex items-center gap-1.5 min-w-0">
                <CloudArrowDownIcon
                  className={cn(
                    "size-3.5 text-primary shrink-0",
                    syncStatus.isSyncing && "animate-bounce"
                  )}
                />
                <span className="truncate">{syncStatus.isSyncing ? 'Syncing...' : 'Sync GitHub Templates'}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {templates.length} loaded
              </span>
            </Button>

            {syncStatus.progressMessage && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {syncStatus.progressMessage}
              </p>
            )}
          </div>

          {/* Taxonomy Category Mode Selector Pills */}
          <div className="px-2 py-1.5 border-b border-border bg-muted/5 shrink-0 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTaxonomyTab('directories')}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                activeTaxonomyTab === 'directories'
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTaxonomyTab('tags')}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                activeTaxonomyTab === 'tags'
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tags
            </button>
            <button
              type="button"
              onClick={() => setActiveTaxonomyTab('tech')}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                activeTaxonomyTab === 'tech'
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tech Stack
            </button>
            <button
              type="button"
              onClick={() => setActiveTaxonomyTab('severities')}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                activeTaxonomyTab === 'severities'
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Severity
            </button>
            <button
              type="button"
              onClick={() => setActiveTaxonomyTab('protocols')}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                activeTaxonomyTab === 'protocols'
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Protocol
            </button>
            <button
              type="button"
              onClick={() => setActiveTaxonomyTab('authors')}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                activeTaxonomyTab === 'authors'
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Authors
            </button>
          </div>

          {/* Taxonomy Items Scroll Area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 flex flex-col gap-1">
              {/* Directory Taxonomy Tab */}
              {activeTaxonomyTab === 'directories' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono px-2 py-0.5">
                    Standard Nuclei Directories
                  </span>
                  {NUCLEI_DIRECTORIES.map((dir) => {
                    const isActive = selectedDirectory === dir.id;
                    const count = dir.id === 'all' ? templates.length : directoryCounts.get(dir.id) || 0;
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => setSelectedDirectory(dir.id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                          isActive
                            ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FoldersIcon className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{dir.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1 shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tags Taxonomy Tab */}
              {activeTaxonomyTab === 'tags' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-2 py-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                      Popular Nuclei Tags
                    </span>
                    {selectedTag && (
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {POPULAR_TAGS.map((tag) => {
                    const isActive = selectedTag === tag.id;
                    const count = tagCounts.get(tag.id) || 0;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedTag(isActive ? null : tag.id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                          isActive
                            ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <TagIcon className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{tag.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1 shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Contextual Tech Stacks Tab */}
              {activeTaxonomyTab === 'tech' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-2 py-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                      Contextual Tech Stacks
                    </span>
                    {activeCategory !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setActiveCategory('all')}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {TECH_STACKS.map((tech) => {
                    const isActive = activeCategory === tech.id;
                    return (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => setActiveCategory(isActive ? 'all' : tech.id)}
                        className={cn(
                          "flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md text-left transition-colors",
                          isActive
                            ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-medium text-foreground">{tech.name}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">{tech.tags[0]}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {tech.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Severity Taxonomy Tab */}
              {activeTaxonomyTab === 'severities' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono px-2 py-0.5">
                    Severity Thresholds
                  </span>
                  {(['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map((sev) => {
                    const cfg = SEVERITY_CONFIG[sev];
                    const isSelected = selectedSeverities.includes(sev);
                    const count = templates.filter((t) => t.severity === sev).length;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => toggleSeverity(sev)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                          isSelected
                            ? "bg-primary/15 font-semibold border border-primary/30 text-foreground"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("size-2 rounded-full", cfg.dotColor)} />
                          <span className="capitalize font-mono">{sev}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Protocol Taxonomy Tab */}
              {activeTaxonomyTab === 'protocols' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono px-2 py-0.5">
                    Protocols & Types
                  </span>
                  {PROTOCOL_TYPES.map((proto) => {
                    const isActive = selectedProtocol === proto.id;
                    const count = proto.id === 'all' ? templates.length : protocolCounts.get(proto.id) || 0;
                    return (
                      <button
                        key={proto.id}
                        type="button"
                        onClick={() => setSelectedProtocol(proto.id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                          isActive
                            ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{proto.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Top Authors Tab */}
              {activeTaxonomyTab === 'authors' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-2 py-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                      Top Community Authors
                    </span>
                    {selectedAuthor && (
                      <button
                        type="button"
                        onClick={() => setSelectedAuthor(null)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {TOP_AUTHORS.map((auth) => {
                    const isActive = selectedAuthor === auth.id;
                    const count = authorCounts.get(auth.id) || 0;
                    return (
                      <button
                        key={auth.id}
                        type="button"
                        onClick={() => setSelectedAuthor(isActive ? null : auth.id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                          isActive
                            ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <UserIcon className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{auth.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* ── Center Pane: Search, Virtualized List & Batch Selection ────────── */}
        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          {/* Top Filter & Action Bar */}
          <div
            className={cn(
              // Layout & Positioning
              "p-2.5 border-b shrink-0 flex flex-wrap items-center justify-between gap-3",
              // Backgrounds & Borders
              "bg-background border-border"
            )}
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md relative">
              <MagnifyingGlassIcon className="size-4 text-muted-foreground absolute left-2.5 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by ID, CVE, name, or tags..."
                className="pl-8 h-8 text-xs font-mono bg-muted/20 border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-muted-foreground hover:text-foreground absolute right-2.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Batch Selection Controls & Transition Button */}
            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleClearFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Filters
                </Button>
              )}

              <Button
                variant="outline"
                size="xs"
                onClick={handleSelectAllFiltered}
                className="h-7 px-2 text-xs gap-1"
              >
                <CheckSquareIcon className="size-3.5 text-primary" />
                <span>Select All ({filteredTemplates.length})</span>
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={deselectAllTemplates}
                disabled={selectedTemplateIds.length === 0}
                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
              >
                <TrashIcon className="size-3.5" />
                <span>Deselect All</span>
              </Button>

              <Button
                size="xs"
                disabled={selectedTemplateIds.length === 0}
                onClick={() => {
                  if (onContinueToSelected) {
                    onContinueToSelected();
                  } else {
                    setActiveTab('selected');
                  }
                }}
                className="h-7 px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <span>Review Selected ({selectedTemplateIds.length})</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Active Filter Chips Strip */}
          <div className="px-3 py-1.5 border-b border-border bg-muted/5 flex items-center justify-between gap-2 text-[11px] shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-muted-foreground font-mono shrink-0">
                Showing {filteredTemplates.length} of {templates.length} templates
              </span>

              {selectedDirectory !== 'all' && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-mono gap-1">
                  <span>Dir: {selectedDirectory}</span>
                  <span className="cursor-pointer" onClick={() => setSelectedDirectory('all')}>✕</span>
                </Badge>
              )}

              {selectedTag && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-mono gap-1">
                  <span>Tag: {selectedTag}</span>
                  <span className="cursor-pointer" onClick={() => setSelectedTag(null)}>✕</span>
                </Badge>
              )}

              {selectedAuthor && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-mono gap-1">
                  <span>Author: {selectedAuthor}</span>
                  <span className="cursor-pointer" onClick={() => setSelectedAuthor(null)}>✕</span>
                </Badge>
              )}

              {selectedProtocol !== 'all' && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-mono gap-1">
                  <span>Proto: {selectedProtocol}</span>
                  <span className="cursor-pointer" onClick={() => setSelectedProtocol('all')}>✕</span>
                </Badge>
              )}

              {selectedSeverities.map((sev) => (
                <Badge key={sev} variant="outline" className="h-4 px-1.5 text-[10px] font-mono capitalize gap-1">
                  <span>{sev}</span>
                  <span className="cursor-pointer" onClick={() => toggleSeverity(sev)}>✕</span>
                </Badge>
              ))}
            </div>

            <span className="text-primary font-mono font-semibold shrink-0">
              {selectedTemplateIds.length} Staged
            </span>
          </div>

          {/* Virtualized Template Rows */}
          <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <CirclesFourIcon className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No templates match the active filter criteria.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Try resetting tags or searching for a different keyword.</p>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleClearFilters}
                  className="mt-3 h-7 text-xs"
                >
                  Reset All Filters
                </Button>
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
                  const template = filteredTemplates[virtualRow.index];
                  const isSelected = selectedTemplateIds.includes(template.id);
                  const isInspecting = activeInspectorTemplateId === template.id;
                  const sevCfg = SEVERITY_CONFIG[template.severity] || SEVERITY_CONFIG.info;

                  return (
                    <div
                      key={template.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      onClick={() => setActiveInspectorTemplateId(template.id)}
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between px-3.5 py-2 border-b cursor-pointer transition-colors select-none",
                        // Backgrounds & Borders
                        isInspecting
                          ? "bg-primary/10 border-primary/30"
                          : isSelected
                          ? "bg-muted/15 border-border"
                          : "hover:bg-muted/20 border-border"
                      )}
                    >
                      {/* Left: Checkbox & Template Summary */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTemplateSelection(template.id);
                          }}
                          className="shrink-0 p-1 -m-1"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTemplateSelection(template.id)}
                            className="size-4"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
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

                            <span className="text-xs font-mono font-semibold text-foreground truncate">
                              {template.id}
                            </span>

                            {template.directory && (
                              <span className="text-[10px] font-mono text-muted-foreground px-1 bg-muted/40 rounded shrink-0">
                                {template.directory}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="truncate text-foreground/80">{template.name}</span>
                            <span className="text-muted-foreground/60">•</span>
                            <span className="font-mono text-[10px] shrink-0">by {template.author}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Tags & Selection Indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden lg:flex items-center gap-1">
                          {template.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 bg-muted/30 rounded"
                            >
                              {t}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-[9px] font-mono text-muted-foreground">
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>

                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTemplateSelection(template.id);
                          }}
                          className={cn(
                            "h-6 px-2 text-[11px] font-mono font-medium",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* ── Right Split-Pane: Template Detail Inspector (YAML vs Visual Flow DAG) ── */}
        {activeTemplate && (
          <aside
            className={cn(
              // Layout & Positioning
              "w-[440px] shrink-0 flex flex-col border-l overflow-hidden",
              // Backgrounds & Borders
              "bg-background border-border"
            )}
          >
            {/* Inspector Header */}
            <div
              className={cn(
                // Layout & Positioning
                "p-3 border-b shrink-0 flex flex-col gap-2.5",
                // Backgrounds & Borders
                "bg-muted/10 border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5">
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
                  <h3 className="text-xs font-semibold text-foreground/90 line-clamp-2 leading-snug">
                    {activeTemplate.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveInspectorTemplateId(null)}
                  className="text-muted-foreground hover:text-foreground p-1 shrink-0"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* View Switcher: YAML View vs Visual (Flow DAG) View */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setInspectorMode('yaml')}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded transition-colors",
                      inspectorMode === 'yaml'
                        ? "bg-background text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CodeIcon className="size-3.5" />
                    <span>YAML View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectorMode('flow')}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded transition-colors",
                      inspectorMode === 'flow'
                        ? "bg-background text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <TreeStructureIcon className="size-3.5" />
                    <span>Visual (Flow)</span>
                  </button>
                </div>

                {inspectorMode === 'yaml' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCopyYaml}
                    className="h-6 px-2 text-[10px] font-mono gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <CopyIcon className="size-3" />
                    <span>{copiedYaml ? 'Copied!' : 'Copy YAML'}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
              {inspectorMode === 'yaml' ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  {isLoadingYaml ? (
                    <div className="flex items-center justify-center h-full text-xs font-mono text-muted-foreground">
                      Loading template YAML from disk...
                    </div>
                  ) : (
                    <pre className="flex-1 min-h-0 p-3 overflow-auto font-mono text-xs text-zinc-300 bg-black/90 leading-relaxed select-text">
                      <code>{inspectorYaml}</code>
                    </pre>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-h-0 h-full w-full relative">
                  <NucleiFlowCanvas yamlContent={inspectorYaml} hideToolbar={false} />
                </div>
              )}
            </div>

            {/* Inspector Footer: Metadata & Select Toggle */}
            <div className="p-3 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 text-[10px] font-mono text-muted-foreground min-w-0">
                <span className="truncate">Author: {activeTemplate.author}</span>
                <span className="truncate">Proto: {activeTemplate.protocol} • Dir: {activeTemplate.directory || 'http'}</span>
              </div>

              <Button
                size="sm"
                variant={selectedTemplateIds.includes(activeTemplate.id) ? 'outline' : 'default'}
                onClick={() => toggleTemplateSelection(activeTemplate.id)}
                className={cn(
                  "h-7 px-3 text-xs gap-1.5 font-medium shrink-0",
                  !selectedTemplateIds.includes(activeTemplate.id) && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {selectedTemplateIds.includes(activeTemplate.id) ? (
                  <>
                    <CheckCircleIcon className="size-3.5 text-primary" />
                    <span>Remove from Staging</span>
                  </>
                ) : (
                  <>
                    <span>+ Add to Selection</span>
                  </>
                )}
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
