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

interface NucleiExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findings: NucleiFinding[];
  stats: ScanSummaryStats;
  target: string;
}

type ExportFormat = 'sarif' | 'jsonl' | 'csv' | 'markdown';

export function NucleiExportDialog({
  open,
  onOpenChange,
  findings,
  stats,
  target,
}: NucleiExportDialogProps) {
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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <DownloadSimpleIcon className="h-4 w-4 text-primary" /> Export Vulnerability Scan Report
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 flex-1 min-h-0">
          {/* Format selector tabs */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={format === 'sarif' ? 'secondary' : 'outline'}
              onClick={() => setFormat('sarif')}
              className={cn("h-8 text-xs gap-1.5", format === 'sarif' && "font-semibold")}
            >
              <FileCodeIcon className="h-3.5 w-3.5 text-sky-500" />
              <span>SARIF v2.1.0</span>
            </Button>

            <Button
              size="sm"
              variant={format === 'jsonl' ? 'secondary' : 'outline'}
              onClick={() => setFormat('jsonl')}
              className={cn("h-8 text-xs gap-1.5", format === 'jsonl' && "font-semibold")}
            >
              <FileCodeIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>JSON Lines (.jsonl)</span>
            </Button>

            <Button
              size="sm"
              variant={format === 'csv' ? 'secondary' : 'outline'}
              onClick={() => setFormat('csv')}
              className={cn("h-8 text-xs gap-1.5", format === 'csv' && "font-semibold")}
            >
              <TableIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>CSV Spreadsheet</span>
            </Button>

            <Button
              size="sm"
              variant={format === 'markdown' ? 'secondary' : 'outline'}
              onClick={() => setFormat('markdown')}
              className={cn("h-8 text-xs gap-1.5", format === 'markdown' && "font-semibold")}
            >
              <FileTextIcon className="h-3.5 w-3.5 text-purple-500" />
              <span>Executive Markdown</span>
            </Button>
          </div>

          {/* TextEditor Preview Box */}
          <div className="flex-1 min-h-[320px] relative rounded-lg border border-border overflow-hidden bg-code-bg">
            <TextEditor
              value={exportContent}
              language={editorLanguage}
              height="100%"
              theme={theme}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t pt-3">
          <Badge variant="outline" className="text-[11px] font-mono">
            {findings.length} findings included
          </Badge>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs gap-1.5">
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </Button>

            <Button size="sm" variant="default" onClick={handleDownload} className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
              <DownloadSimpleIcon className="h-3.5 w-3.5" />
              <span>Download File</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
