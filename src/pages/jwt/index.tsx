

import { Button, ButtonGroup } from '@celestia-project/ui';
import { CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useJwtPage } from './hooks/use-jwt-page';
import { JwtDecodeView } from './components/jwt-decode-view';
import { JwtGenerateView } from './components/jwt-generate-view';

export function JwtPage() {
  const page = useJwtPage();

  const isEmpty =
    page.mode === 'decode'
      ? !page.tokenInput
      : !page.genHeader && !page.genPayload && !page.generatedToken;

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
          "border rounded-md"
        )}
      >
        {/* Toolbar */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "h-10 px-3 gap-2",

            // Backgrounds & Borders
            "border-b bg-muted/40"
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
            <ButtonGroup>
              <Button size="sm"
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "h-6 px-2.5",

                  // Typography
                  "text-xs",

                  // Interactive & States
                  page.mode === 'decode' && 'text-green-500'
                )}
                data-state={page.mode === 'decode' ? 'on' : 'off'}
                onClick={() => page.setMode('decode')}
              >
                Decode
              </Button>
              <Button size="sm"
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "h-6 px-2.5",

                  // Typography
                  "text-xs",

                  // Interactive & States
                  page.mode === 'generate' && 'text-green-500'
                )}
                data-state={page.mode === 'generate' ? 'on' : 'off'}
                onClick={() => page.setMode('generate')}
              >
                Generate
              </Button>
            </ButtonGroup>

            {page.mode === 'decode' && page.decoded && (
              <span
                className={cn(
                  // Sizing & Spacing
                  "px-1 py-0.5",

                  // Typography
                  "text-[10px] font-mono",

                  // Visuals & Colors
                  "text-white bg-blue-600 rounded"
                )}
              >
                {page.decoded.algorithm}
              </span>
            )}
            {page.mode === 'decode' && page.vulnerabilities.length > 0 && (
              <span
                className={cn(
                  // Sizing & Spacing
                  "px-1 py-0.5",

                  // Typography
                  "text-[10px] font-mono",

                  // Visuals & Colors
                  "text-white bg-amber-600 rounded"
                )}
              >
                {page.vulnerabilities.length} finding
                {page.vulnerabilities.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            {page.mode === 'decode' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => page.handleCopy(page.tokenInput)}
                  disabled={!page.tokenInput}
                  className={cn(
                    // Sizing & Spacing
                    "h-7 px-2 gap-1",

                    // Typography
                    "text-xs"
                  )}
                >
                  <CopyIcon className="h-3 w-3" />
                  Copy Token
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={page.handleClear}
                  disabled={!page.tokenInput}
                  className={cn(
                    // Sizing & Spacing
                    "h-7 w-7",

                    // Visuals & Colors / Interactive & States
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {page.mode === 'generate' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => page.handleCopy(page.generatedToken)}
                  disabled={!page.generatedToken}
                  className={cn(
                    // Sizing & Spacing
                    "h-7 px-2 gap-1",

                    // Typography
                    "text-xs"
                  )}
                >
                  <CopyIcon className="h-3 w-3" />
                  Copy Token
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={page.handleClearGenerate}
                  disabled={isEmpty}
                  className={cn(
                    // Sizing & Spacing
                    "h-7 w-7",

                    // Visuals & Colors / Interactive & States
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <main
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-h-0"
          )}
        >
          {page.mode === 'decode' ? (
            <JwtDecodeView
              tokenInput={page.tokenInput}
              setTokenInput={page.setTokenInput}
              decoded={page.decoded}
              vulnerabilities={page.vulnerabilities}
              decodeError={page.decodeError}
              onCopy={page.handleCopy}
            />
          ) : (
            <JwtGenerateView
              genHeader={page.genHeader}
              setGenHeader={page.setGenHeader}
              genPayload={page.genPayload}
              setGenPayload={page.setGenPayload}
              genSecret={page.genSecret}
              setGenSecret={page.setGenSecret}
              genAlgorithm={page.genAlgorithm}
              setGenAlgorithm={page.setGenAlgorithm}
              generatedToken={page.generatedToken}
              genError={page.genError}
              generating={page.generating}
              onGenerate={page.handleGenerate}
              onCopy={page.handleCopy}
            />
          )}
        </main>
      </div>

    </div>
  );
}
