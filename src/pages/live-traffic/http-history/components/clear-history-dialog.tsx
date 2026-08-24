import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Input,
} from '@celestia-project/ui';
import { CircleNotchIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { DATE_DELETE_OPTIONS, type DateRangeId } from '../constants';

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRange: DateRangeId;
  onSelectRange: (range: DateRangeId) => void;
  customDate: string;
  onCustomDateChange: (date: string) => void;
  isClearing: boolean;
  onConfirmClear: (e?: React.MouseEvent) => void;
}

export function ClearHistoryDialog({
  open,
  onOpenChange,
  selectedRange,
  onSelectRange,
  customDate,
  onCustomDateChange,
  isClearing,
  onConfirmClear,
}: ClearHistoryDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isClearing) onOpenChange(next);
      }}
    >
      <AlertDialogContent
        className={cn(
          // Sizing & Spacing
          "max-w-md"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Clear History by Date</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how much historical request data to keep.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "my-2 gap-2"
          )}
        >
          {DATE_DELETE_OPTIONS.map((opt) => {
            const isSelected = selectedRange === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => onSelectRange(opt.id)}
                className={cn(
                  // Layout & Positioning
                  "flex flex-col select-none cursor-pointer",

                  // Sizing & Spacing
                  "p-2.5 rounded-md",

                  // Backgrounds & Borders
                  "border transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border/60 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-between"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-xs font-medium",
                      isSelected ? "font-semibold text-primary" : "text-foreground"
                    )}
                  >
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span
                      className={cn(
                        // Typography
                        "text-xs text-primary"
                      )}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    // Sizing & Spacing
                    "mt-0.5",

                    // Typography
                    "text-[11px] leading-tight text-muted-foreground"
                  )}
                >
                  {opt.description}
                </span>

                {opt.id === 'custom' && isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      // Layout & Positioning
                      "flex items-center",

                      // Sizing & Spacing
                      "mt-2 gap-2"
                    )}
                  >
                    <Input
                      type="date"
                      value={customDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => onCustomDateChange(e.target.value)}
                      className={cn(
                        // Sizing & Spacing
                        "h-7 w-full max-w-[180px] text-xs"
                      )}
                    />
                    <span
                      className={cn(
                        // Typography
                        "text-[10px] text-muted-foreground"
                      )}
                    >
                      (deletes back from date)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel size="xs" disabled={isClearing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="xs"
            variant="destructive"
            disabled={isClearing}
            onClick={onConfirmClear}
          >
            {isClearing && <CircleNotchIcon className="mr-1.5 size-3.5 animate-spin" />}
            {isClearing ? 'Clearing…' : 'Clear Selected'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
