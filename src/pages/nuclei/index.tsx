import React from 'react';
import { cn } from '@/lib/utils';
import { useNucleiPage } from './hooks/use-nuclei-page';
import { NucleiToolbar } from './components/nuclei-toolbar';
import { NucleiStatsBanner } from './components/nuclei-stats-banner';
import { NucleiFindingsTable } from './components/nuclei-findings-table';
import { NucleiFindingDetailDrawer } from './components/nuclei-finding-detail-drawer';
import { NucleiTemplateHub } from './components/nuclei-template-hub';
import { NucleiTemplateStudio } from './components/nuclei-template-studio';
import { NucleiConsoleStream } from './components/nuclei-console-stream';
import { NucleiConfigDialog } from './components/nuclei-config-dialog';
import { NucleiExportDialog } from './components/nuclei-export-dialog';

export function NucleiPage() {
  const page = useNucleiPage();

  return (
    <div
      className={cn(
        // Sizing & Spacing
        "h-full p-2",
        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0 overflow-hidden",
          // Sizing & Spacing
          "h-full",
          // Backgrounds & Borders
          "border rounded-md bg-card/10"
        )}
      >
        {/* Top Control Toolbar */}
        <NucleiToolbar
          target={page.targetInput}
          onTargetChange={page.setTargetInput}
          preset={page.preset}
          onPresetChange={page.setPreset}
          status={page.status}
          selectedTemplatesCount={page.selectedTemplateIds.length}
          activeTab={page.activeTab}
          onActiveTabChange={page.setActiveTab}
          onStart={page.startScan}
          onPause={page.pauseScan}
          onResume={page.resumeScan}
          onStop={page.stopScan}
          onClearFindings={page.clearFindings}
          onOpenConfig={() => page.setIsConfigOpen(true)}
          onOpenExport={() => page.setIsExportOpen(true)}
          findingsCount={page.findings.length}
        />

        {/* Real-time Telemetry & Severity Distribution Banner */}
        <NucleiStatsBanner
          status={page.status}
          progress={page.progress}
          stats={page.stats}
          severityFilter={page.severityFilter}
          onToggleSeverityFilter={page.handleToggleSeverityFilter}
        />

        {/* Main Workspace Body */}
        <main
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 relative overflow-hidden flex"
          )}
        >
          {/* Tab 1: Findings Table + Deep Dive Inspector */}
          {page.activeTab === 'findings' && (
            <div
              className={cn(
                // Layout & Positioning
                "flex-1 flex min-h-0 overflow-hidden"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex-1 min-h-0 overflow-hidden"
                )}
              >
                <NucleiFindingsTable
                  findings={page.filteredFindings}
                  selectedFindingId={page.selectedFindingId}
                  onSelectFinding={page.setSelectedFindingId}
                  searchQuery={page.findingSearchQuery}
                  onSearchChange={page.setFindingSearchQuery}
                  protocolFilter={page.protocolFilter}
                  onToggleProtocolFilter={page.handleToggleProtocolFilter}
                  onSendToRepeater={page.sendToRepeater}
                  onCopyCurl={page.copyFindingCurl}
                  isRunning={page.status === 'running'}
                />
              </div>

              {page.selectedFinding && (
                <NucleiFindingDetailDrawer
                  finding={page.selectedFinding}
                  onClose={() => page.setSelectedFindingId(null)}
                  onSendToRepeater={page.sendToRepeater}
                  onSendToComparer={page.sendToComparer}
                  onCopyCurl={page.copyFindingCurl}
                />
              )}
            </div>
          )}

          {/* Tab 2: Template Hub */}
          {page.activeTab === 'templates' && (
            <NucleiTemplateHub
              templates={page.filteredTemplates}
              selectedTemplateIds={page.selectedTemplateIds}
              onToggleTemplate={page.toggleTemplateSelection}
              onSelectAll={page.selectAllTemplates}
              onDeselectAll={page.deselectAllTemplates}
              onSelectBySeverity={page.selectTemplatesBySeverity}
              category={page.templateCategory}
              onCategoryChange={page.setTemplateCategory}
              searchQuery={page.templateSearchQuery}
              onSearchChange={page.setTemplateSearchQuery}
              onOpenInStudio={page.studio.loadExampleTemplate}
              onNavigateTab={page.setActiveTab}
            />
          )}

          {/* Tab 3: Template Studio */}
          {page.activeTab === 'studio' && (
            <NucleiTemplateStudio
              yamlContent={page.studio.studioYaml}
              onYamlChange={page.studio.setStudioYaml}
              diagnostics={page.studio.studioDiagnostics}
              target={page.studio.studioTarget}
              onTargetChange={page.studio.setStudioTarget}
              testResult={page.studio.studioTestResult}
              isTesting={page.studio.isTestingTemplate}
              onRunTest={page.studio.runTestAgainstTarget}
              onInsertPlaceholder={page.studio.insertPlaceholder}
              selectedExampleId={page.studio.selectedExampleId}
              onLoadExample={page.studio.loadExampleTemplate}
            />
          )}

          {/* Tab 4: Console Output Stream */}
          {page.activeTab === 'console' && (
            <NucleiConsoleStream
              logs={page.logs}
              onClearLogs={page.clearLogs}
              autoScroll={page.autoScrollConsole}
              onAutoScrollChange={page.setAutoScrollConsole}
            />
          )}
        </main>

        {/* Modal Dialogs */}
        <NucleiConfigDialog
          open={page.isConfigOpen}
          onOpenChange={page.setIsConfigOpen}
          config={page.config}
          onSaveConfig={page.setConfig}
          onResetDefaults={page.resetConfig}
        />

        <NucleiExportDialog
          open={page.isExportOpen}
          onOpenChange={page.setIsExportOpen}
          findings={page.findings}
          stats={page.stats}
          target={page.targetInput}
        />
      </div>
    </div>
  );
}
