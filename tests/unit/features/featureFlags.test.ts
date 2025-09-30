import { describe, expect, it, beforeEach, vi } from 'vitest';

type MutableEnv = Record<string, unknown>;

const mutableEnv = import.meta.env as MutableEnv;
const originalEnv = { ...mutableEnv };

function resetEnv() {
  for (const key of Object.keys(mutableEnv)) {
    if (!(key in originalEnv)) {
      delete mutableEnv[key];
    }
  }

  Object.assign(mutableEnv, originalEnv);
}

describe('featureFlags', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
    mutableEnv.PUBLIC_ENV_NAME = 'local';
    mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED = 'false';
    mutableEnv.PROMPT_MANAGER_ENABLED = 'false';
  });

  it('disables prompt manager by default', async () => {
    const { isPromptManagerEnabled } = await import('@/features/featureFlags');
    expect(isPromptManagerEnabled()).toBe(false);
  });

  it('enables prompt manager when PUBLIC_PROMPT_MANAGER_ENABLED=1', async () => {
    mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED = '1';
    const { isPromptManagerEnabled } = await import('@/features/featureFlags');
    expect(isPromptManagerEnabled()).toBe(true);
  });

  it('can disable prompt manager explicitly via override', async () => {
    mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED = 'true';
    const { isPromptManagerEnabled } = await import('@/features/featureFlags');
    expect(isPromptManagerEnabled()).toBe(true);

    vi.resetModules();
    mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED = 'off';
    const { isPromptManagerEnabled: reloadIsPromptManagerEnabled } = await import('@/features/featureFlags');
    expect(reloadIsPromptManagerEnabled()).toBe(false);
  });

  it('respects PROMPT_MANAGER_ENABLED env override on local', async () => {
    delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
    mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
    const { isPromptManagerEnabled } = await import('@/features/featureFlags');
    expect(isPromptManagerEnabled()).toBe(true);
  });

  it('exposes prompt manager flag inside getAllFeatureFlags', async () => {
    const { getAllFeatureFlags, PROMPT_MANAGER_ENABLED } = await import('@/features/featureFlags');
    const flags = getAllFeatureFlags();
    expect(flags[PROMPT_MANAGER_ENABLED]).toBe(false);
  });
});
