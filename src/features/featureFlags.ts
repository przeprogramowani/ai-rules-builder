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
  [E in Env]: {
    [K in FeatureFlag]: boolean;
  };
};

const featureFlags: FeatureConfig = {
  local: {
    auth: false,
    collections: false,
  },
  integration: {
    auth: true,
    collections: true,
  },
  prod: {
    auth: false,
    collections: false,
  },
};

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
  console.log(`isFeatureEnabled('${feature}') called in env '${env}'`);
  if (!env) {
    return false;
  }
  return featureFlags[env][feature];
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
