import { describe, expect, it } from 'vitest';
import worker from './index';

const env = {} as Parameters<typeof worker.fetch>[1];

describe('content-api CORS contract', () => {
  it('echoes approved dev app origins for credentialed items preflight', async () => {
    const response = await worker.fetch(
      new Request('https://items.tikoapi.org/rest/v1/items?limit=1', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://dev.cards.tikoapps.org',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,prefer,content-type',
        },
      }),
      env,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://dev.cards.tikoapps.org');
    expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Prefer');
  });

  it('does not emit wildcard CORS for disallowed credentialed origins', async () => {
    const response = await worker.fetch(
      new Request('https://items.tikoapi.org/rest/v1/items?limit=1', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil.example',
          'Access-Control-Request-Method': 'GET',
        },
      }),
      env,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });
});
