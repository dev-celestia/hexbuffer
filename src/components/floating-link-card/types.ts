import type { ComponentType } from 'react';

export interface FloatingCardCustomProps {
  card: FloatingLinkCardData;
  depth: number;
  isFront: boolean;
  canCycle: boolean;
  onCycle?: () => void;
  onDismiss?: () => void;
}

export interface FloatingLinkCardData {
  id: string;
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  component?: ComponentType<FloatingCardCustomProps>;
}
