import * as React from 'react';
import {
  PAYLOAD_CATEGORIES,
  PREDEFINED_PAYLOADS,
  type PredefinedPayload,
} from '../../data/predefined-payloads';

export interface UsePayloadPresetDialogProps {
  onUsePayload: (payload: PredefinedPayload) => void;
  onOpenChange: (open: boolean) => void;
}

export function usePayloadPresetDialog({
  onUsePayload,
  onOpenChange,
}: UsePayloadPresetDialogProps) {
  const [selectedCategory, setSelectedCategory] = React.useState(PAYLOAD_CATEGORIES[0] ?? '');
  const [selectedPayloadId, setSelectedPayloadId] = React.useState(
    PREDEFINED_PAYLOADS[0]?.id ?? ''
  );
  const [search, setSearch] = React.useState('');

  const visiblePayloads = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return PREDEFINED_PAYLOADS.filter((payload) => {
      const matchesCategory = payload.category === selectedCategory;
      if (!query) {
        return matchesCategory;
      }

      return (
        matchesCategory &&
        `${payload.name} ${payload.description}`.toLowerCase().includes(query)
      );
    });
  }, [search, selectedCategory]);

  const selectedPayload =
    PREDEFINED_PAYLOADS.find((payload) => payload.id === selectedPayloadId) ??
    visiblePayloads[0] ??
    PREDEFINED_PAYLOADS[0];

  const previewValues = React.useMemo(() => {
    return selectedPayload?.values.slice(0, 500) ?? [];
  }, [selectedPayload]);

  const hiddenPreviewCount = selectedPayload
    ? Math.max(0, selectedPayload.values.length - previewValues.length)
    : 0;

  React.useEffect(() => {
    if (
      visiblePayloads.length > 0 &&
      !visiblePayloads.some((payload) => payload.id === selectedPayloadId)
    ) {
      setSelectedPayloadId(visiblePayloads[0].id);
    }
  }, [selectedPayloadId, visiblePayloads]);

  const handleCategorySelect = React.useCallback((category: string) => {
    setSelectedCategory(category);
    setSearch('');
    const firstMatching = PREDEFINED_PAYLOADS.find((payload) => payload.category === category);
    if (firstMatching) {
      setSelectedPayloadId(firstMatching.id);
    }
  }, []);

  const handleUsePayload = React.useCallback(() => {
    if (!selectedPayload) {
      return;
    }

    onUsePayload(selectedPayload);
    onOpenChange(false);
  }, [selectedPayload, onUsePayload, onOpenChange]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return {
    selectedCategory,
    selectedPayloadId,
    search,
    setSearch,
    visiblePayloads,
    selectedPayload,
    previewValues,
    hiddenPreviewCount,
    handleCategorySelect,
    setSelectedPayloadId,
    handleUsePayload,
    handleClose,
  };
}

export const useInvokerPayloadPresetDialog = usePayloadPresetDialog;
