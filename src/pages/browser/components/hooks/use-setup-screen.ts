import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CrawlSetupConfig } from '../../types';

export const setupFormSchema = z.object({
  targetUrl: z.string().min(1, 'Target URL is required.').refine((val) => {
    try {
      const url = new URL(val);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }, 'Enter a valid URL (e.g. https://example.com).'),
  maxDepth: z.coerce.number({ message: 'Must be a number.' }).int().min(1, 'Must be at least 1.').max(20, 'Maximum depth is 20.'),
  maxPages: z.coerce.number({ message: 'Must be a number.' }).int().min(1, 'Must be at least 1.').max(10000, 'Maximum is 10,000.'),
  requestDelayMs: z.coerce.number({ message: 'Must be a number.' }).int().min(0, 'Cannot be negative.').max(30000, 'Maximum is 30,000 ms.'),
  timeoutMs: z.coerce.number({ message: 'Must be a number.' }).int().min(1000, 'Must be at least 1,000 ms.').max(120000, 'Maximum is 120,000 ms.'),
  networkSettleMs: z.coerce.number({ message: 'Must be a number.' }).int().min(0, 'Cannot be negative.').max(30000, 'Maximum is 30,000 ms.'),
  captureScreenshots: z.boolean(),
  captureRenderedHtml: z.boolean(),
  enableAiInsights: z.boolean(),
  excludePaths: z.string().refine((val) => {
    if (!val.trim()) return true;
    const segments = val.split(',').map((s) => s.trim()).filter(Boolean);
    return segments.every((s) => s.startsWith('/'));
  }, 'Each path must start with /.'),
});

export type SetupFormValues = z.infer<typeof setupFormSchema>;

export function toFormDefaults(setup: CrawlSetupConfig): SetupFormValues {
  return {
    targetUrl: setup.targetUrl,
    maxDepth: setup.maxDepth,
    maxPages: setup.maxPages,
    requestDelayMs: setup.requestDelayMs,
    timeoutMs: setup.timeoutMs,
    networkSettleMs: setup.networkSettleMs ?? 2000,
    captureScreenshots: setup.captureScreenshots ?? true,
    captureRenderedHtml: setup.captureRenderedHtml ?? true,
    enableAiInsights: setup.enableAiInsights ?? true,
    excludePaths: setup.excludePaths,
  };
}

interface UseSetupScreenProps {
  setup: CrawlSetupConfig;
  onSetupChange: (patch: Partial<CrawlSetupConfig>) => void;
  onSave: () => void;
}

export function useSetupScreen({ setup, onSetupChange, onSave }: UseSetupScreenProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema) as any,
    defaultValues: toFormDefaults(setup),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormDefaults(setup));
    }
  }, [open, setup, form.reset]);

  const onSubmit = useCallback(
    (values: SetupFormValues) => {
      onSetupChange(values);
      onSave();
      setOpen(false);
    },
    [onSetupChange, onSave],
  );

  return {
    open,
    setOpen,
    form,
    onSubmit,
  };
}
