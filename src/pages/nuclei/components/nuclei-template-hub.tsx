import React from 'react';
import {
  Input,
  Button,
  Badge,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  CheckSquareIcon,
  SquareIcon,
  CodeBlockIcon,
  SparkleIcon,
  ShieldWarningIcon,
  CheckCircleIcon,
  FolderIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { TemplateItem, Severity, NucleiTab } from '../types';
import { SEVERITY_CONFIG, PROTOCOL_BADGES, TEMPLATE_CATEGORIES } from '../constants';

interface NucleiTemplateHubProps {
  templates: TemplateItem[];
  selectedTemplateIds: string[];
  onToggleTemplate: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectBySeverity: (severities: string[]) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenInStudio: (templateId: string) => void;
  onNavigateTab: (tab: NucleiTab) => void;
}

export function NucleiTemplateHub({
  templates,
  selectedTemplateIds,
  onToggleTemplate,
  onSelectAll,
  onDeselectAll,
  onSelectBySeverity,
  category,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onOpenInStudio,
  onNavigateTab,
}: NucleiTemplateHubProps) {
  const selectedCount = selectedTemplateIds.length;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full min-h-0 overflow-hidden"
      )}
    >
      {/* Category Tabs & Quick Batch Actions */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-3 px-4 py-2 shrink-0",
          // Backgrounds & Borders
          "border-b bg-card/30"
        )}
      >
        {/* Category Filter Chips */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center gap-1"
          )}
        >
          {TEMPLATE_CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <Button
                key={cat.id}
                size="sm"
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  // Layout & Positioning
                  "h-7 px-2.5 text-xs font-medium",
                  // Interactive & States
                  isActive && "bg-muted text-foreground font-semibold"
                )}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Selection Tools */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5 shrink-0"
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={onSelectAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Select All
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onDeselectAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectBySeverity(['critical', 'high'])}
            className="h-7 px-2 text-xs text-red-500 hover:text-red-600 border-red-500/30"
          >
            Critical & High Only
          </Button>
        </div>
      </div>

      {/* Search and Selection Counter Row */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between gap-3 px-4 py-2 border-b bg-background/50 shrink-0"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "relative flex-1 max-w-md"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none",
              // Typography
              "text-muted-foreground"
            )}
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search templates by CVE, keyword, protocol, or tag..."
            className="pl-8 h-7 text-xs bg-muted/20 border-input/60"
          />
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Selected: <strong className="text-foreground">{selectedCount}</strong> / {templates.length} templates
        </div>
      </div>

      {/* Template Card Grid */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
        )}
      >
        {templates.map((tmpl) => {
          const isSelected = selectedTemplateIds.includes(tmpl.id);
          const sevConfig = SEVERITY_CONFIG[tmpl.severity] || SEVERITY_CONFIG.info;
          const protoBadge = PROTOCOL_BADGES[tmpl.protocol] || {
            label: tmpl.protocol.toUpperCase(),
            bg: 'bg-muted',
            text: 'text-foreground',
          };

          return (
            <div
              key={tmpl.id}
              onClick={() => onToggleTemplate(tmpl.id)}
              className={cn(
                // Layout & Positioning
                "flex flex-col justify-between p-3.5 rounded-lg border transition-all select-none cursor-pointer",
                // Backgrounds & Borders
                isSelected
                  ? "bg-card border-primary/40 shadow-xs"
                  : "bg-card/40 border-border/60 hover:border-border hover:bg-card/60"
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleTemplate(tmpl.id)}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-1">
                      {tmpl.name}
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground line-clamp-1">
                      {tmpl.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={cn(
                      // Layout & Positioning
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                      // Backgrounds & Borders
                      sevConfig.bg,
                      sevConfig.text,
                      "border",
                      sevConfig.border
                    )}
                  >
                    <span className={cn("h-1 w-1 rounded-full", sevConfig.dotColor)} />
                    {tmpl.severity}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground line-clamp-2 my-2 leading-relaxed">
                {tmpl.description}
              </p>

              {/* Card Footer: Tags & Studio Trigger */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-auto">
                <div className="flex items-center gap-1 overflow-hidden">
                  <span
                    className={cn(
                      // Layout & Positioning
                      "px-1.5 py-0.5 rounded text-[9px] font-mono uppercase",
                      // Backgrounds & Borders
                      protoBadge.bg,
                      protoBadge.text
                    )}
                  >
                    {protoBadge.label}
                  </span>

                  {tmpl.cve_id && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[9px] font-bold text-amber-500 border-amber-500/30 truncate"
                    >
                      {tmpl.cve_id}
                    </Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInStudio(tmpl.id);
                    onNavigateTab('studio');
                  }}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <CodeBlockIcon className="h-3 w-3" />
                  <span>Studio</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
