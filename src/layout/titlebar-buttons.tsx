import { useTitlebarButtons } from './hooks/use-titlebar-buttons';
import { cn } from '@/lib/utils';

const BASE_CLASS = cn(
  // Layout & Positioning
  "flex items-center justify-center cursor-pointer",

  // Sizing & Spacing
  "size-3",

  // Backgrounds & Borders
  "rounded-full",

  // Interactive & States
  "transition-all duration-200 hover:scale-110"
);

export function TitlebarButtons() {
  const { handleClose, handleFullscreen, handleMinimize } = useTitlebarButtons();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center",

        // Sizing & Spacing
        "gap-3 p-1",

        // Backgrounds & Borders
        "bg-muted rounded-full"
      )}
    >
      <button
        id="titlebar-close"
        className={cn(
          BASE_CLASS,

          // Backgrounds & Borders
          "bg-[#FF5F57]",

          // Interactive & States
          "hover:shadow-[0_0_5px_1px_rgba(255,95,87,0.35)]"
        )}
        title="Close"
        onClick={handleClose}
      />

      <button
        id="titlebar-minimize"
        className={cn(
          BASE_CLASS,

          // Backgrounds & Borders
          "bg-[#FFBD2E]",

          // Interactive & States
          "hover:shadow-[0_0_5px_1px_rgba(255,189,46,0.35)]"
        )}
        title="Minimize"
        onClick={handleMinimize}
      />

      <button
        id="titlebar-maximize"
        className={cn(
          BASE_CLASS,

          // Backgrounds & Borders
          "bg-[#28C840]",

          // Interactive & States
          "hover:shadow-[0_0_5px_1px_rgba(40,200,64,0.35)]"
        )}
        title="Fullscreen"
        onClick={handleFullscreen}
      />
    </div>
  );
}

