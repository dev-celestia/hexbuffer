import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CodecType, CodecMode } from '../types';
import { CODECS, MODE_LABELS } from '../constants';
import { convert } from '../lib/codec-functions';
import { copyText } from '@/lib/clipboard';

const CODEC_IDS = CODECS.map((codec) => codec.id);
const STORAGE_KEYS = {
  activeType: 'encoder.activeType',
  mode: 'encoder.mode',
} as const;

function loadStoredType(): CodecType {
  const stored = localStorage.getItem(STORAGE_KEYS.activeType);
  return CODEC_IDS.includes(stored as CodecType) ? (stored as CodecType) : 'url';
}

function loadStoredMode(): CodecMode {
  const stored = localStorage.getItem(STORAGE_KEYS.mode);
  return stored === 'decode' ? 'decode' : 'encode';
}

export function useEncoderPage() {
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<CodecType>(loadStoredType);
  const [mode, setMode] = useState<CodecMode>(loadStoredMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeType, activeType);
  }, [activeType]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
  }, [mode]);

  const { output, error } = useMemo(
    () => convert(input, activeType, mode),
    [input, activeType, mode],
  );

  const currentMode = useMemo(() => MODE_LABELS[mode], [mode]);

  const handleCopy = useCallback(async () => {
    if (output) {
      await copyText(output);
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
  }, []);

  const handleSwap = useCallback(() => {
    setMode((current) => (current === 'encode' ? 'decode' : 'encode'));
    setInput(output || input);
  }, [output, input]);

  const isEmpty = !input && !output && !error;

  return {
    input,
    setInput,
    activeType,
    setActiveType,
    mode,
    setMode,
    output,
    error,
    currentMode,
    handleCopy,
    handleClear,
    handleSwap,
    isEmpty,
  };
}
