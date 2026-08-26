import type { PortPreset } from '../constants';
import { cn } from '@/lib/utils';

interface ScanWelcomeStateProps {
  onQuickStart: (preset: PortPreset) => void;
}

export function ScanWelcomeState({ onQuickStart }: ScanWelcomeStateProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col items-center justify-center text-center select-none",

        // Sizing & Spacing
        "h-full p-6 space-y-6 max-w-2xl mx-auto"
      )}
    >
      <div className="space-y-2">
        <h1
          className={cn(
            // Typography
            "text-xl font-semibold tracking-tight text-foreground"
          )}
        >
          Network Port Scanner
        </h1>
        <p
          className={cn(
            // Typography
            "text-xs text-muted-foreground leading-relaxed max-w-md mx-auto"
          )}
        >
          Scan hostnames or IP addresses to discover open ports, identify running services,
          and extract server banners.
        </p>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "grid grid-cols-1 sm:grid-cols-3",

          // Sizing & Spacing
          "w-full gap-3 pt-4"
        )}
      >
        <button
          type="button"
          onClick={() => onQuickStart('quick')}
          className={cn(
            // Layout & Positioning
            "flex flex-col items-start text-left",

            // Sizing & Spacing
            "p-3.5",

            // Backgrounds & Borders
            "rounded-sm border bg-card/45",

            // Interactive & States
            "hover:bg-muted/10 hover:border-primary/30 transition-all active:scale-[0.97] outline-none cursor-pointer group"
          )}
        >
          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            Quick Scan
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 leading-snug">
            Scan top 18 common ports (web, ssh, db)
          </span>
        </button>

        <button
          type="button"
          onClick={() => onQuickStart('web')}
          className={cn(
            // Layout & Positioning
            "flex flex-col items-start text-left",

            // Sizing & Spacing
            "p-3.5",

            // Backgrounds & Borders
            "rounded-sm border bg-card/45",

            // Interactive & States
            "hover:bg-muted/10 hover:border-primary/30 transition-all active:scale-[0.97] outline-none cursor-pointer group"
          )}
        >
          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            Web Ports
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 leading-snug">
            Scan common HTTP/HTTPS, proxies, and web services
          </span>
        </button>

        <button
          type="button"
          onClick={() => onQuickStart('top100')}
          className={cn(
            // Layout & Positioning
            "flex flex-col items-start text-left",

            // Sizing & Spacing
            "p-3.5",

            // Backgrounds & Borders
            "rounded-sm border bg-card/45",

            // Interactive & States
            "hover:bg-muted/10 hover:border-primary/30 transition-all active:scale-[0.97] outline-none cursor-pointer group"
          )}
        >
          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            Top 100 Ports
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 leading-snug">
            Scan top 100 common network services
          </span>
        </button>
      </div>
    </div>
  );
}
