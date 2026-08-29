

import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import type { PageTabItem } from '@/layout/tabs-layout/types';
import { cn } from '@/lib/utils';
import { useJwtPage } from './hooks/use-jwt-page';
import { JwtDecodeView } from './components/jwt-decode-view';
import { JwtGenerateView } from './components/jwt-generate-view';

export function JwtPage() {
  const page = useJwtPage();

  const tabs: PageTabItem[] = [
    {
      id: 'decode',
      name: 'Decoder',
      closable: false,
      renamable: false,
      indicator: page.vulnerabilities.length > 0 ? (
        <span
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center",

            // Sizing & Spacing
            "h-3.5 min-w-3.5 p-1",

            // Typography
            "text-[8px] font-bold leading-none text-white",

            // Backgrounds & Borders
            "rounded-full bg-amber-600"
          )}
        >
          {page.vulnerabilities.length}
        </span>
      ) : undefined,
    },
    {
      id: 'generate',
      name: 'Generator',
      closable: false,
      renamable: false,
    },
  ];

  return (
    <TabbedPageLayout
      tabs={tabs}
      activeTabId={page.mode}
      onTabChange={(id) => page.setMode(id as 'decode' | 'generate')}
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full"
      )}
      contentClassName={cn(
        // Layout & Positioning
        "flex-1 min-h-0 overflow-hidden",

        // Sizing & Spacing
        "m-2",

        // Backgrounds & Borders
        "border rounded-md bg-background"
      )}
    >
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
            onClear={page.handleClear}
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
            generatingKey={page.generatingKey}
            onGenerate={page.handleGenerate}
            onGenerateKey={page.handleGenerateKey}
            onCopy={page.handleCopy}
            onClear={page.handleClearGenerate}
          />
        )}
      </main>
    </TabbedPageLayout>
  );
}
