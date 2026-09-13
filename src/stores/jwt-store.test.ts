// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useJwtStore } from './jwt-store';
import { DEFAULT_HEADER, DEFAULT_PAYLOAD } from '@/pages/jwt/constants';

function reset() {
  useJwtStore.setState({
    mode: 'decode',
    tokenInput: '',
    genHeader: DEFAULT_HEADER,
    genPayload: DEFAULT_PAYLOAD,
    genSecret: '',
    genAlgorithm: 'HS256',
    generatedToken: '',
  });
}

beforeEach(reset);

describe('useJwtStore', () => {
  it('stores decode/generate inputs', () => {
    const s = useJwtStore.getState();
    s.setMode('generate');
    s.setTokenInput('abc.def.ghi');
    s.setGenHeader('{"alg":"none"}');
    s.setGenPayload('{"sub":"1"}');
    s.setGenSecret('shh');
    s.setGenAlgorithm('ES256');
    s.setGeneratedToken('aaa.bbb.ccc');

    const state = useJwtStore.getState();
    expect(state.mode).toBe('generate');
    expect(state.tokenInput).toBe('abc.def.ghi');
    expect(state.genHeader).toBe('{"alg":"none"}');
    expect(state.genPayload).toBe('{"sub":"1"}');
    expect(state.genSecret).toBe('shh');
    expect(state.genAlgorithm).toBe('ES256');
    expect(state.generatedToken).toBe('aaa.bbb.ccc');
  });

  it('clearDecode resets only the token input', () => {
    const s = useJwtStore.getState();
    s.setTokenInput('abc.def.ghi');
    s.setGeneratedToken('x.y.z');
    s.clearDecode();

    const state = useJwtStore.getState();
    expect(state.tokenInput).toBe('');
    expect(state.generatedToken).toBe('x.y.z');
  });

  it('clearGenerate resets generation fields but keeps the token input and algorithm', () => {
    const s = useJwtStore.getState();
    s.setGenHeader('{"alg":"none"}');
    s.setGenPayload('{"sub":"1"}');
    s.setGenSecret('shh');
    s.setGenAlgorithm('ES256');
    s.setGeneratedToken('x.y.z');
    s.setTokenInput('keep.me.here');
    s.clearGenerate();

    const state = useJwtStore.getState();
    expect(state.genHeader).toBe(DEFAULT_HEADER);
    expect(state.genPayload).toBe(DEFAULT_PAYLOAD);
    expect(state.genSecret).toBe('');
    expect(state.generatedToken).toBe('');
    expect(state.genAlgorithm).toBe('ES256');
    expect(state.tokenInput).toBe('keep.me.here');
  });
});
