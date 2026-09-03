import { cn } from '@/lib/utils';
import { useResponseOverridePage } from './hooks/use-response-override-page';
import { ResponseOverrideContent } from './components/response-override-content';

export function ApiOverridePage() {
  const page = useResponseOverridePage();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-1 flex-col min-h-0 overflow-hidden",

        // Sizing & Spacing
        "h-full p-2"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 flex-col min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-lg bg-background"
        )}
      >
        <ResponseOverrideContent page={page} />
      </div>
    </div>
  );
}

export const ResponseOverridePage = ApiOverridePage;
export default ApiOverridePage;
