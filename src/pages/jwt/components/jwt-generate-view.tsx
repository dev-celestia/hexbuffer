import {
  Button,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Textarea,
  TextEditor,
} from '@celestia-project/ui';
import * as React from 'react';

import { CopyIcon, EyeIcon, EyeSlashIcon, KeyIcon } from '@phosphor-icons/react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import type { JwtAlgorithm } from '../types';
import { ALGORITHM_OPTIONS } from '../constants';

interface JwtGenerateViewProps {
  genHeader: string;
  setGenHeader: (v: string) => void;
  genPayload: string;
  setGenPayload: (v: string) => void;
  genSecret: string;
  setGenSecret: (v: string) => void;
  genAlgorithm: JwtAlgorithm;
  setGenAlgorithm: (v: JwtAlgorithm) => void;
  generatedToken: string;
  genError: string | null;
  generating: boolean;
  generatingKey?: boolean;
  onGenerate: () => void;
  onGenerateKey?: () => void;
  onCopy: (text: string) => void;
}

export function JwtGenerateView({
  genHeader,
  setGenHeader,
  genPayload,
  setGenPayload,
  genSecret,
  setGenSecret,
  genAlgorithm,
  setGenAlgorithm,
  generatedToken,
  genError,
  generating,
  generatingKey,
  onGenerate,
  onGenerateKey,
  onCopy,
}: JwtGenerateViewProps) {
  const { theme } = useTheme();
  const [showSecret, setShowSecret] = React.useState(false);

  const isNone = genAlgorithm === 'none';
  const isAsymmetric =
    genAlgorithm.startsWith('RS') ||
    genAlgorithm.startsWith('ES') ||
    genAlgorithm.startsWith('PS');

  const groupedAlgorithms = React.useMemo(() => {
    const groups: Record<string, typeof ALGORITHM_OPTIONS> = {};
    for (const opt of ALGORITHM_OPTIONS) {
      if (!groups[opt.category]) {
        groups[opt.category] = [];
      }
      groups[opt.category].push(opt);
    }
    return groups;
  }, []);

  const colorizedToken = React.useMemo(() => {
    const trimmed = generatedToken.trim();
    if (!trimmed) return null;
    const parts = trimmed.split('.');
    if (parts.length < 2) {
      return <span>{trimmed}</span>;
    }
    return (
      <>
        <span className="text-red-500">{parts[0]}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-purple-500">{parts[1]}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-cyan-400">{parts[2] ?? ''}</span>
      </>
    );
  }, [generatedToken]);

  return (
    <section className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-2">
      {/* Left: Config */}
      <div className="flex min-h-0 flex-col border-b bg-background lg:border-b-0 lg:border-r">
        <div className="flex h-12 shrink-0 items-center justify-between border-b bg-muted/10 px-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
              Configuration
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Set keys & payload
            </span>
          </div>
          <Button
            size="xs"
            className="h-6 text-xs gap-1.5"
            onClick={onGenerate}
            disabled={generating || (!isNone && !genSecret.trim())}
          >
            <KeyIcon className="h-3.5 w-3.5" />
            {generating ? 'Generating...' : 'Generate JWT'}
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-4 pb-20">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Header (JSON)
              </Label>
              <TextEditor
                value={genHeader}
                language="json"
                onChange={(v) => setGenHeader(v ?? '')}
                height={200}
                className="rounded-md border border-input overflow-hidden"
                theme={theme}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Payload (JSON)
              </Label>
              <TextEditor
                value={genPayload}
                language="json"
                onChange={(v) => setGenPayload(v ?? '')}
                height={240}
                className="rounded-md border border-input overflow-hidden"
                theme={theme}
              />
            </div>
            <div className="flex items-start gap-3 pt-1">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {isNone ? 'Key' : isAsymmetric ? 'Private Key (PEM)' : 'Secret Key'}
                  </Label>
                  {!isNone && (
                    <div className="flex items-center gap-1">
                      {genSecret && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-5 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => onCopy(genSecret)}
                          type="button"
                          title={isAsymmetric ? 'Copy private key' : 'Copy secret key'}
                        >
                          <CopyIcon className="size-3" />
                          Copy
                        </Button>
                      )}
                      {onGenerateKey && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-5 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                          onClick={onGenerateKey}
                          disabled={generatingKey}
                          type="button"
                        >
                          <KeyIcon className="size-3" />
                          {generatingKey
                            ? 'Generating...'
                            : isAsymmetric
                              ? 'Generate Key Pair'
                              : 'Generate Secret'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {isAsymmetric ? (
                  <Textarea
                    className={cn(
                      // Sizing & Spacing
                      "h-24 font-mono text-xs p-2 resize-none",

                      // Backgrounds & Borders
                      "bg-muted/5",

                      // Interactive & States
                      "focus-visible:ring-1"
                    )}
                    placeholder={`-----BEGIN PRIVATE KEY-----\n... (PKCS#8 or PKCS#1 PEM)\n-----END PRIVATE KEY-----`}
                    value={genSecret}
                    onChange={(e) => setGenSecret(e.target.value)}
                  />
                ) : (
                  <div className="relative">
                    <Input
                      className={cn(
                        // Sizing & Spacing
                        "h-8 font-mono text-xs pr-8",

                        // Backgrounds & Borders
                        "bg-muted/5",

                        // Interactive & States
                        "focus-visible:ring-1"
                      )}
                      type={showSecret ? 'text' : 'password'}
                      placeholder={
                        isNone ? "No key required for 'none' algorithm" : 'Enter secret key...'
                      }
                      value={genSecret}
                      onChange={(e) => setGenSecret(e.target.value)}
                      disabled={isNone}
                    />
                    {!isNone && (
                      <button
                        type="button"
                        onClick={() => setShowSecret((prev) => !prev)}
                        className={cn(
                          // Layout & Positioning
                          "absolute right-2 top-1/2 -translate-y-1/2",

                          // Sizing & Spacing
                          "rounded p-0.5",

                          // Typography
                          "text-muted-foreground",

                          // Interactive & States
                          "hover:text-foreground cursor-pointer"
                        )}
                        title={showSecret ? 'Hide secret' : 'Show secret'}
                        tabIndex={-1}
                      >
                        {showSecret ? (
                          <EyeSlashIcon className="size-3.5" />
                        ) : (
                          <EyeIcon className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="w-[100px] space-y-1 shrink-0">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Algorithm
                </Label>
                <Select
                  value={genAlgorithm}
                  onValueChange={(v) => setGenAlgorithm(v as JwtAlgorithm)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedAlgorithms).map(([category, items]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                          {category}
                        </SelectLabel>
                        {items.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {genError && (
              <div className="rounded-md bg-destructive/5 p-2.5 text-xs text-destructive font-mono">
                {genError}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Output */}
      <div className="flex min-h-0 flex-col bg-background">
        <div className="flex h-8 shrink-0 items-center justify-between border-b bg-muted/10 px-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
              Generated Token
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Signed output
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(generatedToken)}
            disabled={!generatedToken}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <CopyIcon className="h-3 w-3" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs whitespace-pre-wrap break-all">
          {colorizedToken ?? (
            <span className="text-muted-foreground">Generated JWT token will appear here...</span>
          )}
        </div>
      </div>
    </section>
  );
}
