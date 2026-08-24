import * as React from 'react';
import { useTheme } from '@/components/theme-provider';
import { useIntruderStore } from '@/stores/intruder';
import {
  createDefaultPayloadConfig,
  type PayloadConfig,
  type PayloadType,
} from '../../types';
import type { PredefinedPayload } from '../../data/predefined-payloads';

export const NUMBER_RANGE_PREVIEW_LIMIT = 8;

export function getPaddingWidth(format?: string) {
  return format?.match(/^\{:0(\d+)\}$/)?.[1] ?? '';
}

export function formatNumberPayload(value: number, format = '{}') {
  const widthMatch = format.match(/^\{:0(\d+)\}$/);

  if (widthMatch) {
    const width = Number(widthMatch[1]);

    if (value < 0) {
      return `-${String(Math.abs(value)).padStart(Math.max(width - 1, 0), '0')}`;
    }

    return String(value).padStart(width, '0');
  }

  return format.replace('{}', String(value));
}

export function getNumberRangeValidation(payload: PayloadConfig) {
  const errors: string[] = [];
  const step = payload.number_step;
  const start = payload.number_start;
  const end = payload.number_end;
  const paddingWidth = getPaddingWidth(payload.number_format);

  if (start === undefined || Number.isNaN(start)) {
    errors.push('Start is required.');
  }

  if (end === undefined || Number.isNaN(end)) {
    errors.push('End is required.');
  }

  if (step === undefined || Number.isNaN(step)) {
    errors.push('Step is required.');
  } else if (step === 0) {
    errors.push('Step cannot be 0.');
  }

  if (paddingWidth && (!Number.isInteger(Number(paddingWidth)) || Number(paddingWidth) < 0)) {
    errors.push('Padding must be 0 or greater.');
  }

  if (
    start !== undefined &&
    end !== undefined &&
    step !== undefined &&
    !Number.isNaN(start) &&
    !Number.isNaN(end) &&
    !Number.isNaN(step) &&
    step !== 0 &&
    ((step > 0 && start > end) || (step < 0 && start < end))
  ) {
    errors.push(step > 0 ? 'Use a negative step for descending ranges.' : 'Use a positive step for ascending ranges.');
  }

  return errors;
}

export function isNumberRangeValid(payload: PayloadConfig) {
  return getNumberRangeValidation(payload).length === 0;
}

export function getNumberRangeValues(payload: PayloadConfig, limit = Number.POSITIVE_INFINITY) {
  if (!isNumberRangeValid(payload)) {
    return [];
  }

  const start = payload.number_start!;
  const end = payload.number_end!;
  const step = payload.number_step!;
  const values: string[] = [];
  let current = start;

  while (step > 0 ? current <= end : current >= end) {
    values.push(formatNumberPayload(current, payload.number_format));

    if (values.length >= limit) {
      break;
    }

    current += step;
  }

  return values;
}

export function getNumberRangeCount(payload: PayloadConfig) {
  if (!isNumberRangeValid(payload)) {
    return 0;
  }

  const start = payload.number_start!;
  const end = payload.number_end!;
  const step = payload.number_step!;

  return Math.floor(Math.abs((end - start) / step)) + 1;
}

export function getPayloadCount(payload: PayloadConfig) {
  return payload.payload_type === 'NumberRange' ? getNumberRangeCount(payload) : payload.values.length;
}

export function parseOptionalNumber(value: string) {
  return value === '' ? undefined : Number(value);
}

export function getPayloadTypeLabel(payloadType: PayloadType) {
  switch (payloadType) {
    case 'NumberRange':
      return 'Number range';
    case 'RuntimeFile':
      return 'Runtime file';
    case 'SimpleList':
    default:
      return 'Simple list';
  }
}

export function usePayloadsTab() {
  const { theme } = useTheme();
  const [presetDialogOpen, setPresetDialogOpen] = React.useState(false);
  const [activePositionName, setActivePositionName] = React.useState<string | null>(null);
  const config = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.config;
  });
  const updatePositionPayload = useIntruderStore((s) => s.updatePositionPayload);

  const positions = React.useMemo(() => config?.positions ?? [], [config?.positions]);
  const selectedPositionName = activePositionName ?? positions[0]?.name ?? '';

  React.useEffect(() => {
    if (!positions.some((position) => position.name === selectedPositionName)) {
      setActivePositionName(positions[0]?.name ?? null);
    }
  }, [positions, selectedPositionName]);

  const updatePayloadType = React.useCallback(
    (positionName: string, payload: PayloadConfig, payloadType: PayloadType) => {
      updatePositionPayload(positionName, {
        payload_type: payloadType,
        ...(payloadType === 'NumberRange'
          ? {
              values: [],
              file_path: undefined,
              number_start: payload.number_start ?? 1,
              number_end: payload.number_end ?? 100,
              number_step: payload.number_step ?? 1,
              number_format: payload.number_format,
            }
          : {}),
      });
    },
    [updatePositionPayload]
  );

  const handleSimpleListTextChange = React.useCallback(
    (positionName: string, value: string | undefined) => {
      updatePositionPayload(positionName, {
        payload_type: 'SimpleList',
        values: (value ?? '').split('\n').filter((line) => line.trim()),
        file_path: undefined,
      });
    },
    [updatePositionPayload]
  );

  const handleUsePreset = React.useCallback(
    (payload: PredefinedPayload) => {
      if (!selectedPositionName) {
        return;
      }

      updatePositionPayload(selectedPositionName, {
        payload_type: 'SimpleList',
        values: payload.values,
        file_path: `Preset: ${payload.name}`,
      });
    },
    [selectedPositionName, updatePositionPayload]
  );

  const openPresetDialogForPosition = React.useCallback((positionName: string) => {
    setActivePositionName(positionName);
    setPresetDialogOpen(true);
  }, []);

  return {
    theme,
    config,
    positions,
    selectedPositionName,
    setActivePositionName,
    presetDialogOpen,
    setPresetDialogOpen,
    updatePositionPayload,
    updatePayloadType,
    handleSimpleListTextChange,
    handleUsePreset,
    openPresetDialogForPosition,
  };
}

export interface UseNumberRangePayloadEditorProps {
  payload: PayloadConfig;
  onChange: (updates: Partial<PayloadConfig>) => void;
}

export function useNumberRangePayloadEditor({
  payload,
  onChange,
}: UseNumberRangePayloadEditorProps) {
  const paddingWidth = getPaddingWidth(payload.number_format);
  const validationErrors = getNumberRangeValidation(payload);
  const hasValidationErrors = validationErrors.length > 0;

  const handleStartChange = React.useCallback(
    (val: string) => {
      onChange({ number_start: parseOptionalNumber(val) });
    },
    [onChange]
  );

  const handleEndChange = React.useCallback(
    (val: string) => {
      onChange({ number_end: parseOptionalNumber(val) });
    },
    [onChange]
  );

  const handleStepChange = React.useCallback(
    (val: string) => {
      onChange({ number_step: parseOptionalNumber(val) });
    },
    [onChange]
  );

  const handlePaddingChange = React.useCallback(
    (widthText: string) => {
      const width = Number(widthText);
      onChange({
        number_format: widthText && width > 0 ? `{:0${width}}` : undefined,
      });
    },
    [onChange]
  );

  const handleFormatChange = React.useCallback(
    (val: string) => {
      onChange({
        number_format: val.trim() ? val : undefined,
      });
    },
    [onChange]
  );

  const isStartInvalid = payload.number_start === undefined || Number.isNaN(payload.number_start);
  const isEndInvalid = payload.number_end === undefined || Number.isNaN(payload.number_end);
  const isStepInvalid =
    payload.number_step === undefined ||
    Number.isNaN(payload.number_step) ||
    payload.number_step === 0;
  const isPaddingInvalid = Boolean(paddingWidth) && Number(paddingWidth) < 0;

  return {
    paddingWidth,
    validationErrors,
    hasValidationErrors,
    handleStartChange,
    handleEndChange,
    handleStepChange,
    handlePaddingChange,
    handleFormatChange,
    isStartInvalid,
    isEndInvalid,
    isStepInvalid,
    isPaddingInvalid,
  };
}

export function usePayloadFileButton(positionName: string) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const updatePositionPayload = useIntruderStore((s) => s.updatePositionPayload);

  const handleLoadPayloads = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const content = loadEvent.target?.result as string;
        updatePositionPayload(positionName, {
          payload_type: 'SimpleList',
          values: content.split(/\r?\n/).filter((line) => line.trim()),
          file_path: file.name,
        });
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [positionName, updatePositionPayload]
  );

  const triggerFileSelect = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    inputRef,
    triggerFileSelect,
    handleLoadPayloads,
  };
}

export const useInvokerPayloadsTab = usePayloadsTab;
