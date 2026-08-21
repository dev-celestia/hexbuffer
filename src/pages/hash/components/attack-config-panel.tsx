import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Input,
  Checkbox,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { FolderOpen, Info, X } from '@phosphor-icons/react';
import { open } from '@tauri-apps/plugin-dialog';
import type { AttackMode, AttackConfig, HashType, CharsetConfig } from '../types';
import {
  ATTACK_MODE_OPTIONS,
  RULE_PRESETS,
  CHARSET_PRESETS,
  MASK_PLACEHOLDERS,
  HASH_OPTIONS,
} from '../constants';
import { useState } from 'react';

interface AttackConfigPanelProps {
  config: AttackConfig | null;
  algorithm: HashType;
  onConfigChange: (config: AttackConfig) => void;
  onAlgorithmChange: (algorithm: HashType) => void;
  disabled: boolean;
}

export function AttackConfigPanel({
  config,
  algorithm,
  onConfigChange,
  onAlgorithmChange,
  disabled,
}: AttackConfigPanelProps) {
  const [activeMode, setActiveMode] = useState<AttackMode>(config?.mode || 'straight');
  const [selectedRules, setSelectedRules] = useState<string[]>(
    config?.mode === 'straight' ? config.rules : []
  );
  const [maskPattern, setMaskPattern] = useState(
    config?.mode === 'mask' ? config.pattern : '?l?l?l?l?d?d'
  );
  const [charset, setCharset] = useState<CharsetConfig>(
    config?.mode === 'mask' ? config.charset : CHARSET_PRESETS[0].charset
  );

  const handleModeChange = (mode: AttackMode) => {
    setActiveMode(mode);

    switch (mode) {
      case 'straight':
        onConfigChange({
          mode: 'straight',
          wordlistPath: config && 'wordlistPath' in config ? config.wordlistPath : '',
          rules: selectedRules,
        });
        break;
      case 'combinator':
        onConfigChange({
          mode: 'combinator',
          leftWordlistPath: '',
          rightWordlistPath: '',
        });
        break;
      case 'mask':
        onConfigChange({
          mode: 'mask',
          pattern: maskPattern,
          charset,
        });
        break;
      case 'hybrid':
        onConfigChange({
          mode: 'hybrid',
          wordlistPath: config && 'wordlistPath' in config ? config.wordlistPath : '',
          mask: maskPattern,
        });
        break;
    }
  };

  const handleWordlistPathChange = (
    field: 'wordlistPath' | 'leftWordlistPath' | 'rightWordlistPath',
    path: string
  ) => {
    if (!config) return;

    if (config.mode === 'straight' && field === 'wordlistPath') {
      onConfigChange({ ...config, wordlistPath: path });
    } else if (config.mode === 'combinator') {
      onConfigChange({ ...config, [field]: path });
    } else if (config.mode === 'hybrid' && field === 'wordlistPath') {
      onConfigChange({ ...config, wordlistPath: path });
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    const preset = RULE_PRESETS.find((r) => r.id === ruleId);
    if (!preset || !config || config.mode !== 'straight') return;

    const newRules = preset.rules;
    setSelectedRules(newRules);
    onConfigChange({ ...config, rules: newRules });
  };

  const handleMaskPatternChange = (pattern: string) => {
    setMaskPattern(pattern);
    if (config?.mode === 'mask') {
      onConfigChange({ ...config, pattern });
    } else if (config?.mode === 'hybrid') {
      onConfigChange({ ...config, mask: pattern });
    }
  };

  const handleCharsetChange = (updates: Partial<CharsetConfig>) => {
    const newCharset = { ...charset, ...updates };
    setCharset(newCharset);
    if (config?.mode === 'mask') {
      onConfigChange({ ...config, charset: newCharset });
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col gap-4 overflow-y-auto",

        // Sizing & Spacing
        "w-full p-4",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Algorithm Selection */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Hash Algorithm
        </Label>
        <Select
          value={algorithm}
          onValueChange={(v) => onAlgorithmChange(v as HashType)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HASH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attack Mode Selection */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Attack Mode
        </Label>
        <div
          className={cn(
            // Layout & Positioning
            "grid grid-cols-2 gap-2"
          )}
        >
          {ATTACK_MODE_OPTIONS.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              disabled={disabled}
              className={cn(
                // Layout & Positioning
                "flex flex-col items-start",

                // Sizing & Spacing
                "p-3 gap-1",

                // Typography
                "text-left text-sm",

                // Backgrounds & Borders
                "border rounded-md",
                activeMode === mode.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground",

                // Interactive & States
                "hover:border-primary/50 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <span className="font-semibold">{mode.label}</span>
              <span className="text-xs opacity-80">{mode.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode-Specific Configuration */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {activeMode === 'straight' && (
          <>
            <WordlistPathPicker
              label="Wordlist Path"
              path={config?.mode === 'straight' ? config.wordlistPath : ''}
              onPathChange={(p) => handleWordlistPathChange('wordlistPath', p)}
              disabled={disabled}
            />

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rule Preset
              </Label>
              <Select
                value={
                  RULE_PRESETS.find(
                    (r) => JSON.stringify(r.rules) === JSON.stringify(selectedRules)
                  )?.id || 'none'
                }
                onValueChange={handleRuleToggle}
                disabled={disabled}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.description} ({preset.rules.length} rules)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {activeMode === 'combinator' && (
          <>
            <WordlistPathPicker
              label="Left Wordlist Path"
              path={config?.mode === 'combinator' ? config.leftWordlistPath : ''}
              onPathChange={(p) => handleWordlistPathChange('leftWordlistPath', p)}
              disabled={disabled}
            />
            <WordlistPathPicker
              label="Right Wordlist Path"
              path={config?.mode === 'combinator' ? config.rightWordlistPath : ''}
              onPathChange={(p) => handleWordlistPathChange('rightWordlistPath', p)}
              disabled={disabled}
            />
          </>
        )}

        {activeMode === 'mask' && (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mask Pattern
              </Label>
              <Input
                value={maskPattern}
                onChange={(e) => handleMaskPatternChange(e.target.value)}
                placeholder="?l?l?l?l?d?d"
                disabled={disabled}
                className="h-9 font-mono text-sm"
              />
              <div
                className={cn(
                  // Sizing & Spacing
                  "p-2 gap-1",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "bg-muted/30 rounded border border-border/50"
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Available placeholders:</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {MASK_PLACEHOLDERS.map((ph) => (
                    <div key={ph.symbol} className="flex gap-2">
                      <code className="font-mono text-primary">{ph.symbol}</code>
                      <span className="text-muted-foreground">{ph.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Character Set
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={charset.lower}
                    onCheckedChange={(checked) =>
                      handleCharsetChange({ lower: checked as boolean })
                    }
                    disabled={disabled}
                    id="charset-lower"
                  />
                  <Label htmlFor="charset-lower" className="text-sm cursor-pointer">
                    Lowercase (a-z)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={charset.upper}
                    onCheckedChange={(checked) =>
                      handleCharsetChange({ upper: checked as boolean })
                    }
                    disabled={disabled}
                    id="charset-upper"
                  />
                  <Label htmlFor="charset-upper" className="text-sm cursor-pointer">
                    Uppercase (A-Z)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={charset.digits}
                    onCheckedChange={(checked) =>
                      handleCharsetChange({ digits: checked as boolean })
                    }
                    disabled={disabled}
                    id="charset-digits"
                  />
                  <Label htmlFor="charset-digits" className="text-sm cursor-pointer">
                    Digits (0-9)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={charset.special}
                    onCheckedChange={(checked) =>
                      handleCharsetChange({ special: checked as boolean })
                    }
                    disabled={disabled}
                    id="charset-special"
                  />
                  <Label htmlFor="charset-special" className="text-sm cursor-pointer">
                    Special (!@#$...)
                  </Label>
                </div>
              </div>
              <Input
                value={charset.custom || ''}
                onChange={(e) => handleCharsetChange({ custom: e.target.value })}
                placeholder="Custom characters (optional)"
                disabled={disabled}
                className="h-8 text-sm font-mono"
              />
            </div>
          </>
        )}

        {activeMode === 'hybrid' && (
          <>
            <WordlistPathPicker
              label="Wordlist Path"
              path={config?.mode === 'hybrid' ? config.wordlistPath : ''}
              onPathChange={(p) => handleWordlistPathChange('wordlistPath', p)}
              disabled={disabled}
            />
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mask Suffix
              </Label>
              <Input
                value={maskPattern}
                onChange={(e) => handleMaskPatternChange(e.target.value)}
                placeholder="?d?d?d"
                disabled={disabled}
                className="h-9 font-mono text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface WordlistPathPickerProps {
  label: string;
  path: string;
  onPathChange: (path: string) => void;
  disabled: boolean;
}

function WordlistPathPicker({ label, path, onPathChange, disabled }: WordlistPathPickerProps) {
  const handleBrowseFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'Wordlists', extensions: ['txt', 'dic', 'lst', 'dict', 'wordlist'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });

      if (selected && typeof selected === 'string') {
        onPathChange(selected);
      }
    } catch (err) {
      console.error('Failed to open file picker:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          placeholder="/path/to/wordlist.txt"
          disabled={disabled}
          className="h-9 text-xs font-mono flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBrowseFile}
          disabled={disabled}
          className="h-9 gap-1.5 px-3 shrink-0"
        >
          <FolderOpen className="h-4 w-4" />
          Browse
        </Button>
        {path && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onPathChange('')}
            disabled={disabled}
            className="h-9 w-9 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
