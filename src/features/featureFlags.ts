/**
 * Feature Flags Module
 *
 * This module provides functionality to control feature availability based on the current environment.
 * It supports 'local', 'integration', and 'prod' environments and allows for feature toggling
 * at various levels of the application.
 */

export type Env = 'local' | 'integration' | 'prod';

/**
 * Available feature flags in the application
 */
export type FeatureFlag = 'auth' | 'collections' | 'authOnUI' | 'promptManager';
export const PROMPT_MANAGER_ENABLED: FeatureFlag = 'promptManager';
type FeatureConfig = {
  [E in Env]: {
    [K in FeatureFlag]: boolean;
  };
};

const FEATURE_KEYS: FeatureFlag[] = ['auth', 'collections', 'authOnUI', PROMPT_MANAGER_ENABLED];

const featureFlags: FeatureConfig = {
  local: {
    auth: true,
    collections: true,
    authOnUI: true,
    [PROMPT_MANAGER_ENABLED]: true,
  },
  integration: {
    auth: true,
    collections: true,
    authOnUI: true,
    [PROMPT_MANAGER_ENABLED]: false,
  },
  prod: {
    auth: true,
    collections: true,
    authOnUI: true,
    [PROMPT_MANAGER_ENABLED]: false,
  },
};

const PROMPT_MANAGER_OVERRIDE_KEYS = [
  'PUBLIC_PROMPT_MANAGER_ENABLED',
  'PROMPT_MANAGER_ENABLED',
] as const;

function readPromptManagerOverride(): boolean | null {
  const env = import.meta.env as Record<string, string | undefined>;

  for (const key of PROMPT_MANAGER_OVERRIDE_KEYS) {
    const value = env[key];
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'on', 'yes'].includes(normalized)) {
        return true;
      }
      if (['0', 'false', 'off', 'no'].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

/**
 * Gets the current environment from import.meta.env.PUBLIC_ENV_NAME
 * Returns null if not set, which disables features
 */
function getCurrentEnv(): Env | null {
  return (import.meta.env.PUBLIC_ENV_NAME as Env) || null;
}

/**
 * Checks if a given feature is enabled for the current environment
 *
 * @param feature - The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  const env = getCurrentEnv();
  if (!env) {
    return false;
  }

  if (feature === PROMPT_MANAGER_ENABLED) {
    const override = readPromptManagerOverride();
    if (override !== null) {
      return override;
    }
  }

  return featureFlags[env][feature];
}

/**
 * Gets all available feature flags
 *
 * @returns Record of all feature flags and their states for the current environment
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const entries = FEATURE_KEYS.map((feature) => [feature, isFeatureEnabled(feature)] as const);
  return Object.fromEntries(entries) as Record<FeatureFlag, boolean>;
}

export function isPromptManagerEnabled(overrides?: Partial<Record<FeatureFlag, boolean>>): boolean {
  if (overrides && typeof overrides[PROMPT_MANAGER_ENABLED] === 'boolean') {
    return overrides[PROMPT_MANAGER_ENABLED];
  }

  return isFeatureEnabled(PROMPT_MANAGER_ENABLED);
}
