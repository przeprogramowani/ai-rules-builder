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
export type FeatureFlag = 'auth' | 'collections';

type FeatureConfig = {
  [K in FeatureFlag]: {
    [E in Env]: boolean;
  };
};

const featureFlags: FeatureConfig = {
  auth: {
    local: true,
    integration: true,
    prod: false,
  },
  collections: {
    local: true,
    integration: true,
    prod: false,
  },
};

/**
 * Gets the current environment from import.meta.env.ENV_NAME
 * Returns null if not set, which disables features
 */
function getCurrentEnv(): Env | null {
  return (import.meta.env.ENV_NAME as Env) || null;
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
  return featureFlags[feature][env];
}

/**
 * Gets all available feature flags
 *
 * @returns Record of all feature flags and their states for the current environment
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>;

  (Object.keys(featureFlags) as FeatureFlag[]).forEach((feature) => {
    flags[feature] = isFeatureEnabled(feature);
  });

  return flags;
}
