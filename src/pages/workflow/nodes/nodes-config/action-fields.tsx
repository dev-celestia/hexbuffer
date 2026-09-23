import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@celestia-project/ui';
import React from 'react';

import type { ActionConfig } from '../../types';

export interface ActionParams {
  params: Record<string, string>;
  updateParam: (key: string, value: string) => void;
}

export function useActionParams(
  config: ActionConfig,
  onChange: (patch: Partial<ActionConfig>) => void
): ActionParams {
  const params = config.params ?? {};
  const updateParam = (key: string, value: string) => {
    onChange({ params: { ...params, [key]: value } });
  };
  return { params, updateParam };
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: Readonly<{
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
}>) {
  return (
    <div className="space-y-1.5">
      <Label size="2xs">{label}</Label>
      <Input textSize="xs"
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: Readonly<{
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}>) {
  return (
    <div className="space-y-1.5">
      <Label size="2xs">{label}</Label>
      <Textarea leading="tight"
        className="min-h-20 resize-none"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  fallback,
  options,
  onChange,
}: Readonly<{
  label: string;
  value: string | undefined;
  fallback: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="space-y-1.5">
      <Label size="2xs">{label}</Label>
      <Select value={value || fallback} onValueChange={onChange}>
        <SelectTrigger leading="tight" className="h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem leading="tight" key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function BooleanField({
  label,
  value,
  fallback,
  onChange,
}: Readonly<{
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (value: string) => void;
}>) {
  return (
    <SelectField
      label={label}
      value={value}
      fallback={fallback}
      onChange={onChange}
      options={[
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]}
    />
  );
}

export const REQUEST_SOURCE_OPTIONS = [
  { value: 'request', label: 'Request' },
  { value: 'response', label: 'Response' },
  { value: 'payload', label: 'Full payload' },
  { value: 'body', label: 'Body' },
];
