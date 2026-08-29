import {
  Button,
  Input,
  Label,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
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

import { CopyIcon, EyeIcon, EyeSlashIcon, KeyIcon, TrashIcon } from '@phosphor-icons/react';
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
  onClear?: () => void;
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
  onClear,
}: JwtGenerateViewProps) {
  const { theme } = useTheme();
  const [showSecret, setShowSecret] = React.useState(false);

  const isNone = genAlgorithm === 'none';
  const isAsymmetric =
    genAlgorithm.startsWith('RS') ||
    genAlgorithm.startsWith('ES') ||
    genAlgorithm.startsWith('PS');

  const isEmpty = !genHeader && !genPayload && !generatedToken;

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
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* Left: Config */}
        <ResizablePanel defaultSize={50} minSize={30}>
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
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between shrink-0",

                // Sizing & Spacing
                "h-8 px-3",

                // Backgrounds & Borders
                "border-b bg-muted/10"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-baseline",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                <span
                  className={cn(
                    // Typography
                    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  )}
                >
                  Configuration
                </span>
                <span
                  className={cn(
                    // Layout & Positioning
                    "hidden sm:inline",

                    // Typography
                    "text-[10px] text-muted-foreground"
                  )}
                >
                  Set keys & payload
                </span>
              </div>
              {onClear && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClear}
                  disabled={isEmpty}
                  className={cn(
                    // Sizing & Spacing
                    "h-6 w-6",

                    // Typography
                    "text-muted-foreground",

                    // Interactive & States
                    "hover:text-foreground"
                  )}
                  title="Clear generate form"
                >
                  <TrashIcon className="size-3" />
                </Button>
              )}
            </div>

            <ScrollArea
              className={cn(
                // Layout & Positioning
                "flex-1 min-h-0"
              )}
            >
              <div
                className={cn(
                  // Sizing & Spacing
                  "space-y-4 p-4 pb-12"
                )}
              >
                <div
                  className={cn(
                    // Sizing & Spacing
                    "space-y-1"
                  )}
                >
                  <Label
                    className={cn(
                      // Typography
                      "text-xs font-semibold text-muted-foreground"
                    )}
                  >
                    Header (JSON)
                  </Label>
                  <TextEditor
                    value={genHeader}
                    language="json"
                    onChange={(v) => setGenHeader(v ?? '')}
                    height={160}
                    className={cn(
                      // Layout & Positioning
                      "overflow-hidden",

                      // Backgrounds & Borders
                      "rounded-md border border-input"
                    )}
                    theme={theme}
                  />
                </div>

                <div
                  className={cn(
                    // Sizing & Spacing
                    "space-y-1"
                  )}
                >
                  <Label
                    className={cn(
                      // Typography
                      "text-xs font-semibold text-muted-foreground"
                    )}
                  >
                    Payload (JSON)
                  </Label>
                  <TextEditor
                    value={genPayload}
                    language="json"
                    onChange={(v) => setGenPayload(v ?? '')}
                    height={180}
                    className={cn(
                      // Layout & Positioning
                      "overflow-hidden",

                      // Backgrounds & Borders
                      "rounded-md border border-input"
                    )}
                    theme={theme}
                  />
                </div>

                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-start",

                    // Sizing & Spacing
                    "gap-3 pt-1"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex-1",

                      // Sizing & Spacing
                      "space-y-1"
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between"
                      )}
                    >
                      <Label
                        className={cn(
                          // Typography
                          "text-xs font-semibold text-muted-foreground"
                        )}
                      >
                        {isNone ? 'Key' : isAsymmetric ? 'Private Key (PEM)' : 'Secret Key'}
                      </Label>
                      {!isNone && (
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-center",

                            // Sizing & Spacing
                            "gap-1"
                          )}
                        >
                          {genSecret && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className={cn(
                                // Sizing & Spacing
                                "h-5 px-1.5 gap-1",

                                // Typography
                                "text-[11px] text-muted-foreground",

                                // Interactive & States
                                "hover:text-foreground"
                              )}
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
                              className={cn(
                                // Sizing & Spacing
                                "h-5 px-1.5 gap-1",

                                // Typography
                                "text-[11px] text-muted-foreground",

                                // Interactive & States
                                "hover:text-foreground"
                              )}
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
                      <div
                        className={cn(
                          // Layout & Positioning
                          "relative"
                        )}
                      >
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
                  <div
                    className={cn(
                      // Layout & Positioning
                      "shrink-0",

                      // Sizing & Spacing
                      "w-[105px] space-y-1"
                    )}
                  >
                    <Label
                      className={cn(
                        // Typography
                        "text-xs font-semibold text-muted-foreground"
                      )}
                    >
                      Algorithm
                    </Label>
                    <Select
                      value={genAlgorithm}
                      onValueChange={(v) => setGenAlgorithm(v as JwtAlgorithm)}
                    >
                      <SelectTrigger
                        className={cn(
                          // Sizing & Spacing
                          "h-8",

                          // Typography
                          "text-xs",

                          // Backgrounds & Borders
                          "bg-background"
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedAlgorithms).map(([category, items]) => (
                          <SelectGroup key={category}>
                            <SelectLabel
                              className={cn(
                                // Sizing & Spacing
                                "px-2 py-1",

                                // Typography
                                "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                              )}
                            >
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
                  <div
                    className={cn(
                      // Sizing & Spacing
                      "p-2.5",

                      // Typography
                      "text-xs font-mono text-destructive",

                      // Backgrounds & Borders
                      "rounded-md bg-destructive/5"
                    )}
                  >
                    {genError}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Action Footer */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-end shrink-0",

                // Sizing & Spacing
                "p-2.5 px-3",

                // Backgrounds & Borders
                "border-t bg-muted/10"
              )}
            >
              <Button
                size="sm"
                className={cn(
                  // Sizing & Spacing
                  "h-7 px-3 gap-1.5",

                  // Typography
                  "text-xs font-medium"
                )}
                onClick={onGenerate}
                disabled={generating || (!isNone && !genSecret.trim())}
              >
                <KeyIcon className="size-3.5" />
                {generating ? 'Generating...' : 'Generate JWT'}
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Output */}
        <ResizablePanel defaultSize={50} minSize={30}>
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
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between shrink-0",

                // Sizing & Spacing
                "h-8 px-3",

                // Backgrounds & Borders
                "border-b bg-muted/10"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-baseline",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                <span
                  className={cn(
                    // Typography
                    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  )}
                >
                  Generated Token
                </span>
                <span
                  className={cn(
                    // Layout & Positioning
                    "hidden sm:inline",

                    // Typography
                    "text-[10px] text-muted-foreground"
                  )}
                >
                  Signed output
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopy(generatedToken)}
                disabled={!generatedToken}
                className={cn(
                  // Sizing & Spacing
                  "h-6 w-6",

                  // Typography
                  "text-muted-foreground",

                  // Interactive & States
                  "hover:text-foreground"
                )}
                title="Copy generated token"
              >
                <CopyIcon className="size-3" />
              </Button>
            </div>
            <div
              className={cn(
                // Layout & Positioning
                "flex-1 min-h-0 overflow-auto",

                // Sizing & Spacing
                "p-4",

                // Typography
                "font-mono text-xs whitespace-pre-wrap break-all"
              )}
            >
              {colorizedToken ?? (
                <span
                  className={cn(
                    // Typography
                    "text-muted-foreground"
                  )}
                >
                  Generated JWT token will appear here...
                </span>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
