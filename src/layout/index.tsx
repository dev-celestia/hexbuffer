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
          "w-48"
        )}
      >
        <ContextMenuItem
          id="ctx-settings"
          onClick={() => navigate('/settings')}
        >
          <GearSixIcon className="size-4" />
          Settings
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Appearance submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger id="ctx-appearance">
            <MonitorIcon className="size-4 mr-2" />
            Appearance
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {/* Dark / Light mode */}
            <ContextMenuItem
              id="ctx-theme-light"
              onClick={() => setTheme('light')}
            >
              <SunIcon className="size-4" />
              Light mode
              {theme === 'light' && <span className="ml-auto text-primary text-xs">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem
              id="ctx-theme-dark"
              onClick={() => setTheme('dark')}
            >
              <MoonIcon className="size-4" />
              Dark mode
              {theme === 'dark' && <span className="ml-auto text-primary text-xs">✓</span>}
            </ContextMenuItem>

            <ContextMenuSeparator />

            {/* Background */}
            <ContextMenuItem
              id="ctx-change-background"
              onClick={() => navigate('/settings?tab=appearance')}
            >
              <ImageIcon className="size-4" />
              Change Background…
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}

