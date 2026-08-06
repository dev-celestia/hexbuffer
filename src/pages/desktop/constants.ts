export interface DesktopWidgetOption {
  id: string;
  label: string;
  description: string;
}

export const DESKTOP_WIDGETS: DesktopWidgetOption[] = [
  { id: 'collections', label: 'Collections Widget', description: 'Access request collections quickly.' },
  { id: 'proxy', label: 'Proxy Widget', description: 'Monitor and control the local proxy listener.' },
  { id: 'vpn', label: 'VPN Widget', description: 'Manage OpenVPN configuration files and connect.' },
  { id: 'target', label: 'Target Widget', description: 'Manage and activate monitoring target scope.' },
  { id: 'scratchpad', label: 'Scratchpad Widget', description: 'Write down quick notes or scripts.' },
  { id: 'clipboard', label: 'Clipboard Widget', description: 'Capture system clipboard history.' },
];

export const DEFAULT_ICON_COLORS = {
  bg: 'bg-muted/40 dark:bg-white/[0.03]',
  hoverBg: 'group-hover:bg-primary/10',
  border: 'border-transparent',
};
