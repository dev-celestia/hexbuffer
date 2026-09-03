import { cn } from '@/lib/utils';
import { useMockApiPage } from './hooks/use-mock-api-page';
import { MockApiContent } from './components/mock-api-content';

export function MockApiPage() {
  const page = useMockApiPage();

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
        <MockApiContent page={page} />
      </div>
    </div>
  );
}

// Alias for backward compatibility
export const MockForgePage = MockApiPage;
export default MockApiPage;
