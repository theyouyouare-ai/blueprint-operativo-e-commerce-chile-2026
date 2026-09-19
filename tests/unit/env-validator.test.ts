import { expect, test } from 'vitest';
import { validateProductionEnv } from '../../server/env-validator';
test('production without Gemini key supports local fallback with defaults', () => {
  const result = validateProductionEnv({ strict: true, env: { NODE_ENV: 'production' } });
  expect(result.success).toBe(true);
  expect(result.data.PORT).toBe(3000);
  expect(result.data.GEMINI_TIMEOUT_MS).toBe(12000);
});
test('rejects invalid port and timeout configuration', () => {
  for (const env of [{ PORT: 'invalid' }, { PORT: '70000' }, { GEMINI_TIMEOUT_MS: '-1' }]) {
    expect(validateProductionEnv({ env }).success).toBe(false);
  }
});
