import { Badge, Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, TextEditor } from '@celestia-project/ui';
import { createDefaultPayloadConfig, type PayloadConfig, type PayloadType } from '../../../types';
import { IntruderPayloadPresetDialog } from '../../payload-preset-dialog';
import {
  getPayloadCount,
  getPayloadTypeLabel,
  getNumberRangeValues,
  NUMBER_RANGE_PREVIEW_LIMIT,
  usePayloadsTab,
  useNumberRangePayloadEditor,
  usePayloadFileButton,
} from '../../hooks/use-payloads-tab';

export function PayloadsTab() {
  const {
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
  } = usePayloadsTab();

  if (!config) return null;

  if (positions.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Mark payload positions in the request with § markers before assigning payloads.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {positions.map((position) => {
          const payload = config.position_payloads[position.name] ?? createDefaultPayloadConfig();
          const payloadCount = getPayloadCount(payload);
          return (
            <Badge key={position.name} variant="secondary">
              {position.name}: {payloadCount} payloads
            </Badge>
          );
        })}
      </div>

      <Tabs value={selectedPositionName} onValueChange={setActivePositionName}>
        <TabsList className="mb-2 flex h-auto flex-wrap justify-start">
          {positions.map((position) => (
            <TabsTrigger key={position.name} value={position.name}>
              <span className="truncate">
                {position.name}
                {position.default_value ? `: ${position.default_value}` : ''}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {positions.map((position) => {
          const payload = config.position_payloads[position.name] ?? createDefaultPayloadConfig();
          const payloadCount = getPayloadCount(payload);
          const numberRangePreview =
            payload.payload_type === 'NumberRange'
              ? getNumberRangeValues(payload, NUMBER_RANGE_PREVIEW_LIMIT)
              : [];

          return (
            <TabsContent key={position.name} value={position.name} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="truncate">
                  Payloads for {position.name}
                  {position.default_value ? ` (${position.default_value})` : ''}
                </Label>
                <Badge variant={payloadCount > 0 ? 'default' : 'secondary'}>
                  {payloadCount} payloads
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['SimpleList', 'NumberRange'] satisfies PayloadType[]).map((payloadType) => (
                  <Button
                    key={payloadType}
                    type="button"
                    variant={payload.payload_type === payloadType ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updatePayloadType(position.name, payload, payloadType)}
                  >
                    {getPayloadTypeLabel(payloadType)}
                  </Button>
                ))}
              </div>

              {payload.payload_type === 'NumberRange' ? (
                <NumberRangePayloadEditor
                  payload={payload}
                  preview={numberRangePreview}
                  payloadCount={payloadCount}
                  onChange={(updates) => updatePositionPayload(position.name, updates)}
                />
              ) : (
                <>
                  <div className="h-36 overflow-hidden rounded-md border">
                    <TextEditor
                      value={payload.values.join('\n')}
                      onChange={(value) => handleSimpleListTextChange(position.name, value)}
                      language="markdown"
                      className="text-xs [&_.cm-content]:text-xs [&_.cm-gutters]:text-[10px]"
                      theme={theme}
                      disableValidation
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPresetDialogForPosition(position.name)}
                    >
                      Browse Presets
                    </Button>
                    <PayloadFileButton positionName={position.name} />
                    {payload.file_path && (
                      <Badge variant="secondary" className="max-w-full truncate">
                        {payload.file_path}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <IntruderPayloadPresetDialog
        open={presetDialogOpen}
        onOpenChange={setPresetDialogOpen}
        onUsePayload={handleUsePreset}
      />
    </div>
  );
}

function NumberRangePayloadEditor({
  payload,
  preview,
  payloadCount,
  onChange,
}: {
  payload: PayloadConfig;
  preview: string[];
  payloadCount: number;
  onChange: (updates: Partial<PayloadConfig>) => void;
}) {
  const {
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
  } = useNumberRangePayloadEditor({ payload, onChange });

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="grid gap-1.5">
          <Label>Start</Label>
          <Input
            type="number"
            value={payload.number_start ?? ''}
            aria-invalid={isStartInvalid}
            onChange={(event) => handleStartChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>End</Label>
          <Input
            type="number"
            value={payload.number_end ?? ''}
            aria-invalid={isEndInvalid}
            onChange={(event) => handleEndChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Step</Label>
          <Input
            type="number"
            value={payload.number_step ?? ''}
            aria-invalid={isStepInvalid}
            onChange={(event) => handleStepChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Padding</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={paddingWidth}
            aria-invalid={isPaddingInvalid}
            onChange={(event) => handlePaddingChange(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Format</Label>
        <Input
          value={payload.number_format ?? '{}'}
          placeholder="{}"
          onChange={(event) => handleFormatChange(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Preview:</span>
        {hasValidationErrors ? (
          <span>{validationErrors.join(' ')}</span>
        ) : preview.length > 0 ? (
          preview.map((value) => (
            <Badge key={value} variant="secondary">
              {value}
            </Badge>
          ))
        ) : (
          <span>No payloads generated. Check the range direction and step.</span>
        )}
        {payloadCount > preview.length && <span>and {payloadCount - preview.length} more</span>}
      </div>
    </div>
  );
}

function PayloadFileButton({ positionName }: { positionName: string }) {
  const { inputRef, triggerFileSelect, handleLoadPayloads } =
    usePayloadFileButton(positionName);

  return (
    <>
      <Button size="sm" variant="outline" onClick={triggerFileSelect}>
        Load from File
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".txt,.lst,.wordlist"
        onChange={handleLoadPayloads}
      />
    </>
  );
}

export const InvokerPayloadsTab = PayloadsTab;
