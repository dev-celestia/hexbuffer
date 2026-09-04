import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
  TextEditor,
} from '@celestia-project/ui';
import {
  DownloadSimpleIcon,
  CopyIcon,
  FileCodeIcon,
  FileTextIcon,
  TableIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import type { NucleiFinding, ScanSummaryStats } from '../types';
import {
  generateSarifReport,
  generateJsonlReport,
  generateCsvReport,
  generateMarkdownSummary,
} from '../lib/formatters';

interface NucleiRunExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findings: NucleiFinding[];
  stats: ScanSummaryStats;
  target: string;
}

type ExportFormat = 'sarif' | 'jsonl' | 'csv' | 'markdown';

// ponytail: Report exporter supporting SARIF v2.1.0, JSONL, CSV, and Markdown summaries
export function NucleiRunExportDialog({
  open,
  onOpenChange,
  findings,
  stats,
  target,
}: NucleiRunExportDialogProps) {
  const { theme } = useTheme();
  const [format, setFormat] = useState<ExportFormat>('sarif');
  const [copied, setCopied] = useState(false);

  const exportContent = useMemo(() => {
    switch (format) {
      case 'sarif':
        return generateSarifReport(findings, target);
      case 'jsonl':
        return generateJsonlReport(findings);
      case 'csv':
        return generateCsvReport(findings);
      case 'markdown':
        return generateMarkdownSummary(findings, stats, target);
    }
  }, [format, findings, stats, target]);

  const editorLanguage = useMemo(() => {
    switch (format) {
      case 'sarif':
      case 'jsonl':
        return 'json';
      case 'markdown':
        return 'markdown';
      case 'csv':
        return 'plaintext';
    }
  }, [format]);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const ext = format === 'sarif' ? 'sarif.json' : format === 'jsonl' ? 'jsonl' : format === 'csv' ? 'csv' : 'md';
    const mime =
      format === 'csv'
        ? 'text/csv'
        : format === 'markdown'
        ? 'text/markdown'
        : 'application/json';

    const blob = new Blob([exportContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nuclei-report-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          "max-w-2xl max-h-[85vh] flex flex-col"
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2",
              // Typography
              "text-sm font-semibold"
            )}
          >
            <DownloadSimpleIcon className="h-4 w-4 text-primary" /> Export Scan Report
          </DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-3 py-2 flex-1 min-h-0"
          )}
        >
          {/* Format selector tabs */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2"
            )}
          >
            <Button
              size="sm"
              variant={format === 'sarif' ? 'secondary' : 'outline'}
              onClick={() => setFormat('sarif')}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 text-xs",
                // Typography
                format === 'sarif' && "font-semibold"
              )}
            >
              <FileCodeIcon className="h-3.5 w-3.5 text-sky-500" />
              <span>SARIF v2.1.0</span>
            </Button>

            <Button
              size="sm"
              variant={format === 'jsonl' ? 'secondary' : 'outline'}
              onClick={() => setFormat('jsonl')}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 text-xs",
                // Typography
                format === 'jsonl' && "font-semibold"
              )}
            >
              <FileCodeIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>JSONL</span>
            </Button>

            <Button
              size="sm"
              variant={format === 'csv' ? 'secondary' : 'outline'}
              onClick={() => setFormat('csv')}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 text-xs",
                // Typography
                format === 'csv' && "font-semibold"
              )}
            >
              <TableIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>CSV</span>
            </Button>

            <Button
              size="sm"
              variant={format === 'markdown' ? 'secondary' : 'outline'}
              onClick={() => setFormat('markdown')}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "h-8 text-xs",
                // Typography
                format === 'markdown' && "font-semibold"
              )}
            >
              <FileTextIcon className="h-3.5 w-3.5 text-purple-500" />
              <span>Markdown</span>
            </Button>
          </div>

          {/* TextEditor Preview Box */}
          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-[300px] relative rounded-lg border overflow-hidden",
              // Backgrounds & Borders
              "border-border bg-background"
            )}
          >
            <TextEditor
              value={exportContent}
              language={editorLanguage}
              height="100%"
              theme={theme}
            />
          </div>
        </div>

        <DialogFooter
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between gap-2 border-t pt-3"
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              // Typography
              "text-[11px] font-mono"
            )}
          >
            {findings.length} findings included
          </Badge>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2"
            )}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "text-xs"
              )}
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>

            <Button
              size="sm"
              variant="default"
              onClick={handleDownload}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Sizing & Spacing
                "text-xs",
                // Backgrounds & Borders
                "bg-emerald-600 hover:bg-emerald-500 text-white"
              )}
            >
              <DownloadSimpleIcon className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const NucleiExportDialog = NucleiRunExportDialog;

