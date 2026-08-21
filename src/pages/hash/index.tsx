import { cn } from '@/lib/utils';
import { Button } from '@celestia-project/ui';
import { Play, Pause, Stop, ArrowsClockwise } from '@phosphor-icons/react';
import { useHashPage } from './hooks/use-hash-page';
import { HashToolbar } from './components/hash-toolbar';
import { HashInputPanel } from './components/hash-input-panel';
import { HashOutputPanel } from './components/hash-output-panel';
import { AttackConfigPanel } from './components/attack-config-panel';
import { TargetHashPanel } from './components/target-hash-panel';
import { TelemetryPanel } from './components/telemetry-panel';
import { ResultsPanel } from './components/results-panel';
import type { TabMode } from './types';

export function HashPage() {
  const page = useHashPage();

  const tabs: { id: TabMode; label: string }[] = [
    { id: 'calculator', label: 'Hash Calculator' },
    { id: 'attack', label: 'Password Auditing' },
    { id: 'results', label: 'Results' }
  ];

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
      {/* Tab Bar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",
          
          // Sizing & Spacing
          "h-11 px-3 gap-3",
          
          // Backgrounds & Borders
          "border-b border-border bg-muted/10",
          
          // Typography
          "select-none"
        )}
      >
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => page.setActiveTab(tab.id)}
              className={cn(
                // Layout & Positioning
                "relative",
                
                // Sizing & Spacing
                "h-9 px-4",
                
                // Typography
                "text-sm font-medium transition-colors",
                
                // Backgrounds & Borders
                "rounded-md",
                
                // Interactive & States
                page.activeTab === tab.id
                  ? "text-foreground bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
              {tab.id === 'results' && page.attackEngine.results.length > 0 && (
                <span
                  className={cn(
                    // Layout & Positioning
                    "absolute -top-1 -right-1 flex items-center justify-center",
                    
                    // Sizing & Spacing
                    "h-5 min-w-5 px-1",
                    
                    // Typography
                    "text-[10px] font-bold",
                    
                    // Backgrounds & Borders
                    "bg-green-500 text-white rounded-full"
                  )}
                >
                  {page.attackEngine.results.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Attack Controls (visible on attack/results tabs) */}
        {(page.activeTab === 'attack' || page.activeTab === 'results') && (
          <div className="flex items-center gap-1.5">
            {page.attackEngine.status === 'idle' && (
              <Button
                size="sm"
                onClick={page.handleStartAttack}
                disabled={page.targets.length === 0 || !page.attackConfig}
                className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4" weight="fill" />
                Start Attack
              </Button>
            )}

            {page.attackEngine.status === 'running' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={page.handlePauseAttack}
                  className="h-8 gap-1.5"
                >
                  <Pause className="h-4 w-4" weight="fill" />
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={page.handleStopAttack}
                  className="h-8 gap-1.5"
                >
                  <Stop className="h-4 w-4" weight="fill" />
                  Stop
                </Button>
              </>
            )}

            {page.attackEngine.status === 'paused' && (
              <>
                <Button
                  size="sm"
                  onClick={page.handleResumeAttack}
                  className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4" weight="fill" />
                  Resume
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={page.handleStopAttack}
                  className="h-8 gap-1.5"
                >
                  <Stop className="h-4 w-4" weight="fill" />
                  Stop
                </Button>
              </>
            )}

            {(page.attackEngine.status === 'stopped' || 
              page.attackEngine.status === 'completed' || 
              page.attackEngine.status === 'error') && (
              <Button
                variant="outline"
                size="sm"
                onClick={page.handleResetAttack}
                className="h-8 gap-1.5"
              >
                <ArrowsClockwise className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <main
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0"
        )}
      >
        {/* Calculator Tab */}
        {page.activeTab === 'calculator' && (
          <>
            <HashToolbar
              activeType={page.activeType}
              onTypeChange={page.setActiveType}
              output={page.output}
              isEmpty={page.isEmpty}
              onCopy={page.handleCopy}
              onClear={page.handleClear}
            />

            <section
              className={cn(
                // Layout & Positioning
                "grid grid-cols-2 divide-x min-h-0",

                // Sizing & Spacing
                "h-full",

                // Backgrounds & Borders
                "divide-border bg-background"
              )}
            >
              <HashInputPanel
                input={page.input}
                isEmpty={page.isEmpty}
                onInputChange={page.setInput}
                onClear={page.handleClear}
              />

              <HashOutputPanel
                output={page.output}
                onCopy={page.handleCopy}
              />
            </section>
          </>
        )}

        {/* Attack Tab */}
        {page.activeTab === 'attack' && (
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-[400px_1fr] min-h-0",
              
              // Sizing & Spacing
              "h-full",
              
              // Backgrounds & Borders
              "divide-x divide-border"
            )}
          >
            {/* Left: Config Panel */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",
                
                // Backgrounds & Borders
                "bg-muted/5"
              )}
            >
              <AttackConfigPanel
                config={page.attackConfig}
                algorithm={page.attackAlgorithm}
                onConfigChange={page.setAttackConfig}
                onAlgorithmChange={page.setAttackAlgorithm}
                disabled={page.attackEngine.status === 'running'}
              />
            </div>

            {/* Right: Telemetry + Targets */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0"
              )}
            >
              <TelemetryPanel
                telemetry={page.attackEngine.telemetry}
                status={page.attackEngine.status}
              />

              <div className="flex-1 min-h-0">
                <TargetHashPanel
                  targets={page.targets}
                  defaultAlgorithm={page.attackAlgorithm}
                  onTargetsChange={page.setTargets}
                  disabled={page.attackEngine.status === 'running'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {page.activeTab === 'results' && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col min-h-0",
              
              // Sizing & Spacing
              "h-full"
            )}
          >
            <TelemetryPanel
              telemetry={page.attackEngine.telemetry}
              status={page.attackEngine.status}
            />

            <div className="flex-1 min-h-0">
              <ResultsPanel
                results={page.attackEngine.results}
                onExport={page.handleExportResults}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
