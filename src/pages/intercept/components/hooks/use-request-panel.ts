import { toast } from 'sonner';
import { useInterceptStore } from '../../state/intercept-store';
import { formatRawMessage } from '../../lib';

export function useRequestPanel() {
  const rawRequest = useInterceptStore((state) => state.rawRequest);
  const selectedRequestId = useInterceptStore((state) => state.selectedRequestId);
  const selectedDirection = useInterceptStore((state) => state.selectedDirection);
  const setRawRequest = useInterceptStore((state) => state.setRawRequest);

  const messageLabel = selectedDirection === 'response' ? 'Response' : 'Request';

  const handleRawChange = (value: string | undefined) => {
    setRawRequest(value ?? '');
  };

  const handleFormat = () => {
    if (!rawRequest) return;
    const formatted = formatRawMessage(rawRequest);
    if (formatted !== rawRequest) {
      setRawRequest(formatted);
      toast.success('Formatted JSON body');
    } else {
      toast.info('No JSON payload found to format');
    }
  };

  return {
    rawRequest,
    selectedRequestId,
    messageLabel,
    handleRawChange,
    handleFormat,
  };
}
