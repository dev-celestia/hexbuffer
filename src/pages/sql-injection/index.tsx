import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSqliPage } from './hooks/use-sqli-page';
import { ScanToolbar } from './components/scan-toolbar';
import { ParametersPanel } from './components/parameters-panel';
import { VulnerabilitiesTab } from './components/vulnerabilities-tab';
import { ExtractionTab } from './components/extraction-tab';

export function SqlInjectionPage() {
  const page = useSqliPage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <ScanToolbar
        url={page.url}
        onUrlChange={page.setUrl}
        method={page.method}
        onMethodChange={page.setMethod}
        riskLevel={page.riskLevel}
        onRiskLevelChange={page.setRiskLevel}
        techniques={page.techniques}
        onToggleTechnique={page.toggleTechnique}
        isRunning={page.isRunning}
        progress={page.progress}
        error={page.error}
        vulnerabilitiesCount={page.vulnerabilities.length}
        databasesCount={page.databases.length}
        hasUrlAndParams={!!page.url.trim() && page.parameters.length > 0}
        onStart={page.startScan}
        onStop={page.stopScan}
        onClear={page.clearResults}
        onExportJson={page.handleExportJson}
        onExportCsv={page.handleExportCsv}
      />

      <main
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 overflow-hidden"
        )}
      >
        {/* Progress bar */}
        {page.progress.total > 0 && (
          <div
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "w-full",

              // Backgrounds & Borders
              "bg-muted/20 border-b"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "relative overflow-hidden w-full",

                // Sizing & Spacing
                "h-[2px]",

                // Visuals & Colors
                "bg-primary/25 rounded-full"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "h-full",

                  // Visuals & Colors
                  "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]",

                  // Interactive & States
                  "transition-all duration-300"
                )}
                style={{
                  width: `${Math.min(100, (page.progress.current / page.progress.total) * 100)}%`,
                }}
              />
            </div>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between",

                // Sizing & Spacing
                "px-4 py-1",

                // Typography
                "text-[10px] font-mono text-muted-foreground"
              )}
            >
              <span>{page.progress.message}</span>
              <span className="font-semibold">{Math.round(Math.min(100, (page.progress.current / page.progress.total) * 100))}%</span>
            </div>
          </div>
        )}

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-1 min-h-0 overflow-hidden"
          )}
        >
          {/* Left: parameters config */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col shrink-0 overflow-hidden",

              // Sizing & Spacing
              "w-64",

              // Backgrounds & Borders
              "border-r"
            )}
          >
            <ParametersPanel
              parameters={page.parameters}
              newParamName={page.newParamName}
              newParamValue={page.newParamValue}
              injectCount={page.injectCount}
              onNewParamNameChange={page.setNewParamName}
              onNewParamValueChange={page.setNewParamValue}
              onAddParameter={page.addParameter}
              onRemoveParameter={page.removeParameter}
              onToggleParamInject={page.toggleParamInject}
              onParamValueChange={(name, value) =>
                page.setParameters(prev =>
                  prev.map(p => (p.name === name ? { ...p, value } : p)),
                )
              }
            />
          </div>

          {/* Right: results tabs */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col flex-1 min-h-0 overflow-hidden"
            )}
          >
            <Tabs
              defaultValue="vulnerabilities"
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",

                // Sizing & Spacing
                "h-full",

                // Backgrounds & Borders
                "bg-background"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between shrink-0",

                  // Sizing & Spacing
                  "h-9 px-3",

                  // Backgrounds & Borders
                  "border-b bg-muted/15"
                )}
              >
                <TabsList
                  className={cn(
                    // Sizing & Spacing
                    "h-7 p-0.5",

                    // Backgrounds & Borders
                    "bg-background/50 border rounded-md shadow-sm"
                  )}
                >
                  <TabsTrigger
                    value="vulnerabilities"
                    className={cn(
                      // Sizing & Spacing
                      "h-6 px-3",

                      // Typography
                      "text-[11px] font-medium",

                      // Interactive & States
                      "transition-all"
                    )}
                  >
                    Vulnerabilities
                    {page.vulnerabilities.length > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          // Sizing & Spacing
                          "ml-1.5 px-1 py-0 h-4",

                          // Typography
                          "text-[9px] font-bold",

                          // Visuals & Colors
                          "border-amber-500/20 text-amber-600 bg-amber-500/5"
                        )}
                      >
                        {page.vulnerabilities.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="extraction"
                    className={cn(
                      // Sizing & Spacing
                      "h-6 px-3",

                      // Typography
                      "text-[11px] font-medium",

                      // Interactive & States
                      "transition-all"
                    )}
                  >
                    Data Extraction
                    {page.databases.length > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          // Sizing & Spacing
                          "ml-1.5 px-1 py-0 h-4",

                          // Typography
                          "text-[9px] font-bold"
                        )}
                      >
                        {page.databases.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="vulnerabilities"
                className={cn(
                  // Layout & Positioning
                  "flex flex-col flex-1 min-h-0 overflow-hidden",

                  // Sizing & Spacing
                  "m-0"
                )}
              >
                <VulnerabilitiesTab
                  vulnerabilities={page.vulnerabilities}
                  isRunning={page.isRunning}
                  selectedVuln={page.selectedVuln}
                  selectedVulnData={page.selectedVulnData}
                  onSelectVuln={page.setSelectedVuln}
                />
              </TabsContent>

              <TabsContent
                value="extraction"
                className={cn(
                  // Layout & Positioning
                  "flex flex-col flex-1 min-h-0 overflow-hidden",

                  // Sizing & Spacing
                  "m-0"
                )}
              >
                <ExtractionTab
                  databases={page.databases}
                  isRunning={page.isRunning}
                  selectedDb={page.selectedDb}
                  selectedTable={page.selectedTable}
                  selectedDbData={page.selectedDbData}
                  tableData={page.tableData}
                  onSelectDb={page.setSelectedDb}
                  onSelectTable={page.setSelectedTable}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
