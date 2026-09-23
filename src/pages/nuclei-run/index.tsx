import React, { useMemo } from 'react';
import { Button, Badge } from '@celestia-project/ui';
import {
  ScanIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BugIcon,
  PlayIcon,
} from '@phosphor-icons/react';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import type { PageTabItem } from '@/layout/tabs-layout/types';
import { cn } from '@/lib/utils';
import { useNucleiStore } from '@/stores/nuclei';
import { NucleiTemplateHubStep } from './components/nuclei-template-hub-step';
import { NucleiSelectedTemplatesStep } from './components/nuclei-selected-templates-step';
import { NucleiScanCockpit } from './components/nuclei-scan-cockpit';
import { useNucleiScan } from './hooks/use-nuclei-scan';
import type { NucleiTab } from './types';

export function NucleiRunPage() {
  const {
    activeTab,
    setActiveTab,
    selectedTemplateIds,
    findings,
    status,
  } = useNucleiStore();

  const { startScan } = useNucleiScan();

  // Normalize active tab (handle backwards-compatible aliases)
  const effectiveTab: 'hub' | 'selected' | 'results' = useMemo(() => {
    if (activeTab === 'templates') return 'hub';
    if (activeTab === 'scan') return selectedTemplateIds.length > 0 && status === 'idle' ? 'selected' : 'results';
    if (activeTab === 'flow') return 'hub';
    if (activeTab === 'selected' || activeTab === 'results') return activeTab;
    return 'hub';
  }, [activeTab, selectedTemplateIds.length, status]);

  // Define the 3 Sequential Workflow Tabs
  const tabs: PageTabItem[] = useMemo(
    () => [
      {
        id: 'hub',
        name: `1. Template Hub`,
        closable: false,
      },
      {
        id: 'selected',
        name: `2. Selected Templates (${selectedTemplateIds.length})`,
        closable: false,
      },
      {
        id: 'results',
        name: `3. Scan Results${findings.length > 0 ? ` (${findings.length})` : ''}`,
        closable: false,
      },
    ],
    [selectedTemplateIds.length, findings.length]
  );

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 w-full overflow-hidden",
        // Sizing & Spacing
        "h-full",
        // Backgrounds & Borders
        "bg-background text-foreground"
      )}
    >
      {/* ── Top Header Bar Above Tabs ─────────────────────────────────── */}
      <header
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0 select-none",
          // Sizing & Spacing
          "h-10 px-3 border-b gap-3",
          // Backgrounds & Borders
          "bg-muted/15 border-border"
        )}
      >
        {/* Left: App Brand & Active Workflow Step Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground tracking-tight">
            <ScanIcon className="size-4 text-primary shrink-0" />
            <span>Nuclei Run</span>
          </div>

          <div className="h-3.5 w-px bg-border shrink-0" />

          <Badge mono
            variant="outline"
            className="px-1.5 border-primary/30 text-primary"
          >
            {effectiveTab === 'hub' && 'Step 1: Explore Hub & Flow DAG'}
            {effectiveTab === 'selected' && `Step 2: Staging & On-Demand Scan (${selectedTemplateIds.length})`}
            {effectiveTab === 'results' && `Step 3: Scan Telemetry & Findings (${findings.length})`}
          </Badge>
        </div>

        {/* Right: Quick Workflow Navigation & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {findings.length > 0 && (
            <Badge mono
              variant="outline"
              className="border-destructive/40 text-destructive font-semibold cursor-pointer"
              onClick={() => setActiveTab('results')}
            >
              <BugIcon className="size-3 mr-1" />
              {findings.length} Discovered
            </Badge>
          )}

          {effectiveTab === 'hub' ? (
            <Button leading="tight"
              size="xs"
              disabled={selectedTemplateIds.length === 0}
              onClick={() => setActiveTab('selected')}
              className="h-7 px-2.5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span>Review Selected ({selectedTemplateIds.length})</span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          ) : effectiveTab === 'selected' ? (
            <div className="flex items-center gap-1.5">
              <Button leading="tight"
                variant="outline"
                size="xs"
                onClick={() => setActiveTab('hub')}
                className="h-7 hover:bg-muted/20"
              >
                <ArrowLeftIcon className="size-3.5" />
                <span>Add Templates</span>
              </Button>
              <Button leading="tight"
                size="xs"
                disabled={selectedTemplateIds.length === 0}
                onClick={() => startScan()}
                className="h-7 px-3 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
              >
                <PlayIcon className="size-3.5" />
                <span>Scan All ({selectedTemplateIds.length})</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button leading="tight"
                variant="outline"
                size="xs"
                onClick={() => setActiveTab('selected')}
                className="h-7 px-2.5 gap-1.5 hover:bg-muted/20"
              >
                <ArrowLeftIcon className="size-3.5" />
                <span>Selected Templates ({selectedTemplateIds.length})</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* ── Tabbed Page Layout (Step 1 -> Step 2 -> Step 3) ─────────────── */}
      <TabbedPageLayout
        tabs={tabs}
        activeTabId={effectiveTab}
        onTabChange={(id) => setActiveTab(id as NucleiTab)}
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden"
        )}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 w-full h-full overflow-hidden",
          // Sizing & Spacing
          "p-0 m-0 border-0",
          // Backgrounds & Borders
          "bg-background"
        )}
      >
        {effectiveTab === 'hub' && (
          <NucleiTemplateHubStep onContinueToSelected={() => setActiveTab('selected')} />
        )}
        {effectiveTab === 'selected' && (
          <NucleiSelectedTemplatesStep
            onBackToHub={() => setActiveTab('hub')}
            onContinueToResults={() => setActiveTab('results')}
          />
        )}
        {effectiveTab === 'results' && (
          <NucleiScanCockpit />
        )}
      </TabbedPageLayout>
    </div>
  );
}
