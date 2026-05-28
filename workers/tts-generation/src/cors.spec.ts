import { describe, expect, it, vi } from 'vitest';
import worker from './index';

function createEnv(audio: unknown = null): Parameters<typeof worker.fetch>[1] {
  return {
    TTS_DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => audio),
        })),
      })),
    },
    AUDIO_BUCKET: {},
    OPENAI_API_KEY: 'test',
    ENVIRONMENT: 'test',
  } as unknown as Parameters<typeof worker.fetch>[1];
}

describe('tts-generation CORS and metadata contract', () => {
  it('echoes approved app origins and allows Prefer for credentialed preflight', async () => {
    const response = await worker.fetch(
      new Request('https://tts.tikoapi.org/metadata?textHash=abc', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://dev.type.tikoapps.org',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,prefer,content-type',
        },
      }),
      createEnv(),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://dev.type.tikoapps.org');
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Prefer');
  });

  it('serves clean metadata lookup without REST-style tts_audio path', async () => {
    const response = await worker.fetch(
      new Request('https://tts.tikoapi.org/metadata?textHash=abc', {
        headers: { Origin: 'https://dev.yesno.tikoapps.org' },
      }),
      createEnv({
        audio_url: '/audio?key=audio%2Fabc.mp3',
        provider: 'openai',
        language: 'en',
        voice: 'nova',
        model: 'tts-1',
        generated_at: '2026-05-28T00:00:00.000Z',
        file_size_bytes: 123,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://dev.yesno.tikoapps.org');
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        audio_url: '/audio?key=audio%2Fabc.mp3',
        provider: 'openai',
      },
    });
  });
});
