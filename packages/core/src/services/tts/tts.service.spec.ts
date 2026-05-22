import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ttsService } from './tts.service';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  ttsService.clearCache();
});

describe('TTSService', () => {
  it('falls back to browser speech when the OpenAI generation endpoint is unavailable', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'method_not_allowed' }), { status: 405 }));

    const result = await ttsService.getAudioForText({ text: 'Yes', language: 'en' });

    expect(result.success).toBe(true);
    expect(result.cached).toBe(false);
    expect(result.audioUrl).toBeUndefined();
    expect(result.metadata).toMatchObject({
      provider: 'browser',
      language: 'en',
      voice: 'nova',
      model: 'tts-1',
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(String(mockFetch.mock.calls[1][0])).toBe('https://tts.tikoapi.org/generate');
    expect(console.error).not.toHaveBeenCalledWith(
      'Error generating OpenAI audio:',
      expect.anything(),
    );
  });
});
