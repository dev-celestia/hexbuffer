import { Tabs } from '@celestia-project/ui';
import type { ReactNode } from 'react';

import { PageTabBar } from './tab-bar';
import type { PageTabItem } from './types';
import { cn } from '@/lib/utils';

interface TabbedPageLayoutProps {
  tabs: PageTabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabRename?: (id: string, name: string) => void;
  onTabClose?: (id: string) => void;
  onTabAdd?: () => void;
  onCloseTabsToLeft?: (id: string) => void;
  onCloseTabsToRight?: (id: string) => void;
  renderTabContextMenuItems?: (tab: PageTabItem) => ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function TabbedPageLayout({
  tabs,
  activeTabId,
  onTabChange,
  onTabRename,
  onTabClose,
  onTabAdd,
  onCloseTabsToLeft,
  onCloseTabsToRight,
  renderTabContextMenuItems,
  children,
  className = 'flex flex-col h-full',
  contentClassName,
}: Readonly<TabbedPageLayoutProps>) {
  return (
    <div className={className}>
      <div className="border-b border-primary">
        <PageTabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
          onTabRename={onTabRename}
          onTabClose={onTabClose}
          onTabAdd={onTabAdd}
          onCloseTabsToLeft={onCloseTabsToLeft}
          onCloseTabsToRight={onCloseTabsToRight}
          renderTabContextMenuItems={renderTabContextMenuItems}
        />
      </div>
      <div className={cn('flex-1 min-h-0 overflow-hidden', contentClassName ?? 'm-2 border rounded-md bg-background')}>
        <Tabs value={activeTabId} onValueChange={onTabChange} className="gap-0 h-full w-full flex flex-col min-w-0">
          {children}
        </Tabs>
      </div>
    </div>
  );
}
