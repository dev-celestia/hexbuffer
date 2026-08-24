import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { FolderOpen, X } from '@phosphor-icons/react';
import { open } from '@tauri-apps/plugin-dialog';
import type { AttackMode, AttackConfig, HashType } from '../types';
import {
  ATTACK_MODE_OPTIONS,
  RULE_PRESETS,
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
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    const preset = RULE_PRESETS.find((r) => r.id === ruleId);
    if (!preset || !config || config.mode !== 'straight') return;

    const newRules = preset.rules;
    setSelectedRules(newRules);
    onConfigChange({ ...config, rules: newRules });
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col overflow-y-auto",

        // Sizing & Spacing
        "w-full p-4 gap-4",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Algorithm Selection */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          )}
        >
          Hash Algorithm
        </span>
        <Select
          value={algorithm}
          onValueChange={(v) => onAlgorithmChange(v as HashType)}
          disabled={disabled}
        >
          <SelectTrigger>
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
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          )}
        >
          Attack Mode
        </span>
        <div
          className={cn(
            // Layout & Positioning
            "grid grid-cols-2",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          {ATTACK_MODE_OPTIONS.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              disabled={disabled}
              className={cn(
                // Layout & Positioning
                "flex flex-col items-start text-left",

                // Sizing & Spacing
                "p-2.5 gap-0.5",

                // Backgrounds & Borders
                "border rounded-md",
                activeMode === mode.value
                  ? "border-primary bg-primary/10 text-foreground font-semibold"
                  : "border-border/60 bg-background text-muted-foreground",

                // Interactive & States
                "hover:border-primary/50 transition-colors active:scale-98",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <span className="text-xs font-semibold">{mode.label}</span>
              <span className="text-[11px] opacity-75">{mode.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode-Specific Configuration */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "gap-3 pt-3",

          // Backgrounds & Borders
          "border-t border-border/40"
        )}
      >
        {activeMode === 'straight' && (
          <>
            <WordlistPathPicker
              label="Wordlist Path"
              path={config?.mode === 'straight' ? config.wordlistPath : ''}
              onPathChange={(p) => handleWordlistPathChange('wordlistPath', p)}
              disabled={disabled}
            />

            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "gap-1.5"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                )}
              >
                Rule Preset
              </span>
              <Select
                value={
                  RULE_PRESETS.find(
                    (r) => JSON.stringify(r.rules) === JSON.stringify(selectedRules)
                  )?.id || 'none'
                }
                onValueChange={handleRuleToggle}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex flex-col"
                        )}
                      >
                        <span className="text-xs">{preset.name}</span>
                        <span className="text-[10px] text-muted-foreground">
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
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-1.5"
      )}
    >
      <span
        className={cn(
          // Typography
          "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-w-0"
          )}
        >
          <Input
            value={path}
            onChange={(e) => onPathChange(e.target.value)}
            placeholder="/path/to/wordlist.txt"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBrowseFile}
          disabled={disabled}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Browse
        </Button>
        {path && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPathChange('')}
            disabled={disabled}
            title="Clear path"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
