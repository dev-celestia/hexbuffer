import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@celestia-project/ui';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useTheme } from '@/components/theme-provider';

import { MonitorIcon, SunIcon, MoonIcon, ImageIcon, GearSixIcon } from '@phosphor-icons/react';
import { AppSidebar } from './taskbar';
import { DesktopWorkspace } from './desktop-workspace';
import { cn } from '@/lib/utils';

import whiteWallpaper from '@/assets/white-wallpaper.png';
import blackWallpaper from '@/assets/black-wallpaper.png';

function BgLayer() {
  const bgType = useAppSettingsStore((s) => s.bgType);
  const bgValue = useAppSettingsStore((s) => s.bgValue);
  const { theme } = useTheme();

  const lightWallpaperSrc = typeof whiteWallpaper === 'string' ? whiteWallpaper : (whiteWallpaper as { src?: string })?.src ?? '';
  const darkWallpaperSrc = typeof blackWallpaper === 'string' ? blackWallpaper : (blackWallpaper as { src?: string })?.src ?? '';

  let style: React.CSSProperties = {};

  if (bgType === 'image' && bgValue) {
    const isPreset = bgValue === 'default-light' || bgValue === 'default-dark';
    const bgUrl = isPreset
      ? (bgValue === 'default-light' ? lightWallpaperSrc : darkWallpaperSrc)
      : convertFileSrc(bgValue);

    style = {
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  } else if (bgType === 'color' && bgValue) {
    style = { backgroundColor: bgValue };
  } else {
    // bgType === 'none' — use theme-specific default wallpaper
    const wallpaper = theme === 'light' ? lightWallpaperSrc : darkWallpaperSrc;
    style = {
      backgroundImage: `url(${wallpaper})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "absolute inset-0 z-0 pointer-events-none"
      )}
      style={style}
    />
  );
}

interface AppLayoutProps {
  readonly children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            // Layout & Positioning
            "relative flex flex-col overflow-hidden",

            // Sizing & Spacing
            "h-screen",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          <BgLayer />
          <div
            className={cn(
              // Layout & Positioning
              "relative z-10 flex-1 min-h-0"
            )}
          >
            <DesktopWorkspace activeChild={children} />
          </div>
          <AppSidebar />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent
        className={cn(
          // Sizing & Spacing
          "w-44 p-1",

          // Typography
          "text-xs font-sans"
        )}
      >
        <ContextMenuItem
          id="ctx-settings"
          onClick={() => navigate('/settings')}
          className={cn(
            // Sizing & Spacing
            "py-1 px-1.5 gap-2",

            // Typography
            "text-xs"
          )}
        >
          <GearSixIcon
            className={cn(
              // Sizing & Spacing
              "size-3.5"
            )}
          />
          Settings
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Appearance submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger
            id="ctx-appearance"
            className={cn(
              // Sizing & Spacing
              "py-1 px-1.5 gap-2",

              // Typography
              "text-xs"
            )}
          >
            <MonitorIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5"
              )}
            />
            Appearance
          </ContextMenuSubTrigger>
          <ContextMenuSubContent
            className={cn(
              // Sizing & Spacing
              "w-44 p-1",

              // Typography
              "text-xs font-sans"
            )}
          >
            {/* Dark / Light mode */}
            <ContextMenuItem
              id="ctx-theme-light"
              onClick={() => setTheme('light')}
              className={cn(
                // Sizing & Spacing
                "py-1 px-1.5 gap-2",

                // Typography
                "text-xs"
              )}
            >
              <SunIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
              Light mode
              {theme === 'light' && (
                <span
                  className={cn(
                    // Layout & Positioning
                    "ml-auto",

                    // Typography
                    "text-[10px] text-primary font-medium"
                  )}
                >
                  ✓
                </span>
              )}
            </ContextMenuItem>
            <ContextMenuItem
              id="ctx-theme-dark"
              onClick={() => setTheme('dark')}
              className={cn(
                // Sizing & Spacing
                "py-1 px-1.5 gap-2",

                // Typography
                "text-xs"
              )}
            >
              <MoonIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
              Dark mode
              {theme === 'dark' && (
                <span
                  className={cn(
                    // Layout & Positioning
                    "ml-auto",

                    // Typography
                    "text-[10px] text-primary font-medium"
                  )}
                >
                  ✓
                </span>
              )}
            </ContextMenuItem>

            <ContextMenuSeparator />

            {/* Background */}
            <ContextMenuItem
              id="ctx-change-background"
              onClick={() => navigate('/settings?tab=appearance')}
              className={cn(
                // Sizing & Spacing
                "py-1 px-1.5 gap-2",

                // Typography
                "text-xs"
              )}
            >
              <ImageIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5"
                )}
              />
              Change Background…
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}

