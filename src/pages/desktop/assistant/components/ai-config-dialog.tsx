import * as React from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@celestia-project/ui';
import { EyeIcon, EyeSlashIcon, GearSixIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAiConfigDialog } from '../hooks/use-ai-config-dialog';
import type { DashboardAiSettings } from '../types';
import { DEFAULT_OPENAI_COMPATIBLE_MODELS } from '@/pages/settings/constants';

interface AiConfigDialogProps {
  aiSettings: DashboardAiSettings;
  updateAiSettings: (updates: Partial<DashboardAiSettings> & { apiKey?: string }) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_ENDPOINTS = [
  { label: 'OpenAI Cloud', url: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
  { label: 'Ollama (Local)', url: 'http://localhost:11434/v1', defaultModel: 'llama3.1:8b' },
  { label: 'LM Studio (Local)', url: 'http://localhost:1234/v1', defaultModel: 'qwen2.5-coder' },
];

export function AiConfigDialog({
  aiSettings,
  updateAiSettings,
  open,
  onOpenChange,
}: AiConfigDialogProps) {
  const {
    provider,
    setProvider,
    model,
    setModel,
    customBaseUrl,
    setCustomBaseUrl,
    apiKey,
    setApiKey,
    showApiKey,
    setShowApiKey,
    allowThirdPartyAiSharing,
    setAllowThirdPartyAiSharing,
    saving,
    handleSave,
    setPresetBaseUrl,
  } = useAiConfigDialog({
    aiSettings,
    updateAiSettings,
    open,
    onOpenChange,
  });

  const isOpenAi = provider === 'openai-compatible';
  const isLocalEndpoint =
    customBaseUrl.includes('localhost') ||
    customBaseUrl.includes('127.0.0.1') ||
    customBaseUrl.includes('0.0.0.0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Sizing & Spacing
          'sm:max-w-md max-w-[calc(100%-2rem)] p-5 gap-4',
        )}
      >
        <DialogHeader>
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center gap-2',
            )}
          >
            <GearSixIcon className="size-4 text-violet-500" />
            <DialogTitle>AI Assistant Configuration</DialogTitle>
            <Badge
              variant="secondary"
              className={cn(
                // Sizing & Spacing
                'h-4 px-1.5 py-0',
                // Typography
                'text-[9px] font-mono font-semibold uppercase tracking-wider',
                // Backgrounds & Borders
                'text-amber-500 bg-amber-500/10 border border-amber-500/20',
              )}
            >
              Alpha
            </Badge>
          </div>
          <DialogDescription>
            Configure your AI provider, model, and OpenAI-compatible endpoint.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col gap-4 py-1',
          )}
        >
          {/* Provider Selection */}
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-1.5',
            )}
          >
            <Label htmlFor="ai-provider-select">Provider</Label>
            <Select
              value={provider}
              onValueChange={(val) => setProvider(val as any)}
            >
              <SelectTrigger id="ai-provider-select">
                <SelectValue placeholder="Select AI Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek">DeepSeek (Default)</SelectItem>
                <SelectItem value="openai-compatible">OpenAI Compatible (Cloud or Local)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* OpenAI-compatible Base URL & Presets */}
          {isOpenAi && (
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col gap-2',
              )}
            >
              <Label htmlFor="ai-base-url">Base URL</Label>
              <Input
                id="ai-base-url"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-wrap gap-1',
                )}
              >
                {PRESET_ENDPOINTS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetBaseUrl(preset.url, preset.defaultModel)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Model Name */}
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-1.5',
            )}
          >
            <Label htmlFor="ai-model-input">Model</Label>
            {isOpenAi ? (
              <div
                className={cn(
                  // Layout & Positioning
                  'flex flex-col gap-2',
                )}
              >
                <Input
                  id="ai-model-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-4o, llama3.1:8b, qwen2.5-coder"
                />
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex flex-wrap gap-1',
                  )}
                >
                  {DEFAULT_OPENAI_COMPATIBLE_MODELS.slice(0, 5).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setModel(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <Select value={model} onValueChange={(val) => { if (val) setModel(val); }}>
                <SelectTrigger id="ai-model-input">
                  <SelectValue placeholder="Select DeepSeek Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek-v4-flash">deepseek-v4-flash</SelectItem>
                  <SelectItem value="deepseek-v4-pro">deepseek-v4-pro</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* API Key */}
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-1.5',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex items-center justify-between',
              )}
            >
              <Label htmlFor="ai-api-key-input">API Key</Label>
              {aiSettings.hasApiKey && (
                <span
                  className={cn(
                    // Typography
                    'text-[11px] text-green-500 font-medium',
                  )}
                >
                  Saved in OS Keyring
                </span>
              )}
            </div>
            <div
              className={cn(
                // Layout & Positioning
                'relative flex items-center',
              )}
            >
              <Input
                id="ai-api-key-input"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  aiSettings.hasApiKey && !apiKey
                    ? '••••••••••••••••••••••••'
                    : isOpenAi && isLocalEndpoint
                      ? 'Optional for local endpoints (Ollama/LM Studio)'
                      : 'Enter API Key'
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowApiKey((prev) => !prev)}
                tabIndex={-1}
              >
                {showApiKey ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Third-Party AI Sharing */}
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center justify-between rounded-lg border p-2.5',
              // Backgrounds & Borders
              'bg-muted/20 border-border',
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col gap-0.5 pe-2',
              )}
            >
              <Label
                htmlFor="third-party-sharing"
                className={cn(
                  // Typography
                  'text-xs font-medium cursor-pointer',
                )}
              >
                Third-Party AI Sharing
              </Label>
              <span
                className={cn(
                  // Typography
                  'text-[11px] text-muted-foreground',
                )}
              >
                Allow sending prompts, context, and inspection logs to external AI providers.
              </span>
            </div>
            <Switch
              id="third-party-sharing"
              checked={allowThirdPartyAiSharing}
              onCheckedChange={setAllowThirdPartyAiSharing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
