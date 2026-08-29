

import {
  Button,
  Label,
  type MonacoInstance,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  TextEditor,
  type TextEditorInstance,
} from '@celestia-project/ui';
import * as React from 'react';
import { CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import type { JwtDecoded, JwtVulnerability } from '../types';
import { DecodedSection } from './decoded-section';
import { VulnerabilityCard } from './vulnerability-card';

interface JwtDecodeViewProps {
  tokenInput: string;
  setTokenInput: (v: string) => void;
  decoded: JwtDecoded | null;
  vulnerabilities: JwtVulnerability[];
  decodeError: string | null;
  onCopy: (text: string) => void;
  onClear?: () => void;
}

export function JwtDecodeView({
  tokenInput,
  setTokenInput,
  decoded,
  vulnerabilities,
  decodeError,
  onCopy,
  onClear,
}: JwtDecodeViewProps) {
  const { theme } = useTheme();
  const monacoRef = React.useRef<MonacoInstance | null>(null);

  const handleMount = React.useCallback(
    (_editor: TextEditorInstance, monaco: MonacoInstance) => {
      monacoRef.current = monaco;

      const languages = monaco.languages.getLanguages();
      if (!languages.some((l: { id: string }) => l.id === 'jwt')) {
        monaco.languages.register({ id: 'jwt' });

        monaco.languages.setMonarchTokensProvider('jwt', {
          defaultToken: '',
          tokenPostfix: '.jwt',
          tokenizer: {
            root: [
              [/^[A-Za-z0-9_-]+/, 'jwt-header', '@afterHeader'],
              [/\./, 'jwt-delimiter', '@payload'],
              [/[^.]+/, 'jwt-header'],
            ],
            afterHeader: [
              [/\./, 'jwt-delimiter', '@payload'],
              [/[A-Za-z0-9_-]+/, 'jwt-header'],
              [/[^.]+/, 'jwt-header'],
            ],
            payload: [
              [/[A-Za-z0-9_-]+/, 'jwt-payload', '@afterPayload'],
              [/\./, 'jwt-delimiter', '@signature'],
              [/[^.]+/, 'jwt-payload'],
            ],
            afterPayload: [
              [/\./, 'jwt-delimiter', '@signature'],
              [/[A-Za-z0-9_-]+/, 'jwt-payload'],
              [/[^.]+/, 'jwt-payload'],
            ],
            signature: [
              [/[A-Za-z0-9_-]+/, 'jwt-signature'],
              [/[^.]+/, 'jwt-signature'],
            ],
          },
        });

        monaco.editor.defineTheme('jwt-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'jwt-header', foreground: 'ef4444' },
            { token: 'jwt-payload', foreground: 'c084fc' },
            { token: 'jwt-signature', foreground: '22d3ee' },
            { token: 'jwt-delimiter', foreground: '71717a', fontStyle: 'bold' },
          ],
          colors: {},
        });

        monaco.editor.defineTheme('jwt-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'jwt-header', foreground: 'dc2626' },
            { token: 'jwt-payload', foreground: '9333ea' },
            { token: 'jwt-signature', foreground: '0891b2' },
            { token: 'jwt-delimiter', foreground: '71717a', fontStyle: 'bold' },
          ],
          colors: {},
        });
      }

      monaco.editor.setTheme(theme === 'light' ? 'jwt-light' : 'jwt-dark');
    },
    [theme],
  );

  React.useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'light' ? 'jwt-light' : 'jwt-dark');
    }
  }, [theme]);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0"
        )}
      >
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left: Token Input */}
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
                    JWT Token
                  </span>
                  <span
                    className={cn(
                      // Layout & Positioning
                      "hidden sm:inline",

                      // Typography
                      "text-[10px] text-muted-foreground"
                    )}
                  >
                    Paste token to decode
                  </span>
                </div>
                {onClear && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    disabled={!tokenInput}
                    className={cn(
                      // Sizing & Spacing
                      "h-6 w-6",

                      // Typography
                      "text-muted-foreground",

                      // Interactive & States
                      "hover:text-foreground"
                    )}
                    title="Clear token"
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                )}
              </div>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex-1 min-h-0"
                )}
              >
                <TextEditor
                  value={tokenInput}
                  onChange={(v) => setTokenInput(v ?? '')}
                  language="jwt"
                  theme={theme === 'light' ? 'jwt-light' : 'jwt-dark'}
                  height="100%"
                  onMount={handleMount}
                  options={{
                    wordWrap: 'on',
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    folding: false,
                    renderLineHighlight: 'none',
                  }}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Decoded Output */}
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
                    "flex items-center",

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
                    Decoded Breakdown
                  </span>
                  {decoded && (
                    <span
                      className={cn(
                        // Sizing & Spacing
                        "px-1.5 py-0.2",

                        // Typography
                        "text-[10px] font-mono text-white",

                        // Backgrounds & Borders
                        "bg-primary rounded"
                      )}
                    >
                      {decoded.algorithm}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onCopy(
                      decoded
                        ? `Header:\n${JSON.stringify(decoded.header, null, 2)}\n\nPayload:\n${JSON.stringify(decoded.payload, null, 2)}`
                        : '',
                    )
                  }
                  disabled={!decoded}
                  className={cn(
                    // Sizing & Spacing
                    "h-6 w-6",

                    // Typography
                    "text-muted-foreground",

                    // Interactive & States
                    "hover:text-foreground"
                  )}
                  title="Copy JSON"
                >
                  <CopyIcon className="size-3" />
                </Button>
              </div>

              {decodeError ? (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-h-0 overflow-auto",

                    // Sizing & Spacing
                    "p-4",

                    // Typography
                    "text-xs font-mono text-destructive whitespace-pre-wrap",

                    // Backgrounds & Borders
                    "bg-destructive/5"
                  )}
                >
                  {decodeError}
                </div>
              ) : decoded ? (
                <ScrollArea
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-h-0"
                  )}
                >
                  <div
                    className={cn(
                      // Sizing & Spacing
                      "space-y-4 p-4"
                    )}
                  >
                    <DecodedSection title="Header" data={decoded.header} />
                    <DecodedSection title="Payload" data={decoded.payload} />
                    <div>
                      <Label
                        className={cn(
                          // Typography
                          "text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        )}
                      >
                        Signature
                      </Label>
                      <div
                        className={cn(
                          // Sizing & Spacing
                          "mt-1 space-y-0.5"
                        )}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-baseline",

                            // Sizing & Spacing
                            "gap-2",

                            // Typography
                            "text-xs"
                          )}
                        >
                          <span
                            className={cn(
                              // Layout & Positioning
                              "shrink-0",

                              // Typography
                              "font-mono text-muted-foreground"
                            )}
                          >
                            Algorithm:
                          </span>
                          <span
                            className={cn(
                              // Typography
                              "font-mono"
                            )}
                          >
                            {decoded.algorithm}
                          </span>
                        </div>
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-baseline",

                            // Sizing & Spacing
                            "gap-2",

                            // Typography
                            "text-xs"
                          )}
                        >
                          <span
                            className={cn(
                              // Layout & Positioning
                              "shrink-0",

                              // Typography
                              "font-mono text-muted-foreground"
                            )}
                          >
                            Value:
                          </span>
                          <span
                            className={cn(
                              // Typography
                              "font-mono break-all text-[11px] opacity-85"
                            )}
                          >
                            {decoded.signature}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex flex-1 min-h-0 items-center justify-center",

                    // Typography
                    "text-xs text-muted-foreground"
                  )}
                >
                  Paste a JWT token to decode.
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Vulnerability Findings */}
      {vulnerabilities.length > 0 && (
        <section
          className={cn(
            // Layout & Positioning
            "flex flex-col shrink-0",

            // Backgrounds & Borders
            "border-t bg-background"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between shrink-0",

              // Sizing & Spacing
              "h-8 px-3",

              // Backgrounds & Borders
              "border-b bg-muted/15"
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
                Vulnerability Findings
              </span>
              <span
                className={cn(
                  // Layout & Positioning
                  "hidden sm:inline",

                  // Typography
                  "text-[10px] text-muted-foreground"
                )}
              >
                {vulnerabilities.length} issue{vulnerabilities.length !== 1 ? 's' : ''} detected
              </span>
            </div>
          </div>
          <ScrollArea
            className={cn(
              // Layout & Positioning
              "overflow-auto",

              // Sizing & Spacing
              "max-h-[140px]"
            )}
          >
            <div
              className={cn(
                // Sizing & Spacing
                "space-y-1.5 p-3"
              )}
            >
              {vulnerabilities.map((v) => (
                <VulnerabilityCard key={v.id} vuln={v} />
              ))}
            </div>
          </ScrollArea>
        </section>
      )}
    </div>
  );
}
