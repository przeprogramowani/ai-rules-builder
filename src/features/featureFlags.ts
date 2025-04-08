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
    local: false,
    integration: true,
    prod: false,
  },
  collections: {
    local: false,
    integration: false,
    prod: false,
  },
};

/**
 * Gets the current environment from import.meta.env.ENV_NAME
 * Defaults to 'local' if not set
 */
const currentEnv: Env = (import.meta.env.ENV_NAME as Env) || 'local';

/**
 * Checks if a given feature is enabled for the current environment
 *
 * @param feature - The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  const isEnabled = featureFlags[feature][currentEnv];
  console.log(`isFeatureEnabled('${feature}') called in env '${currentEnv}': ${isEnabled}`);
  return isEnabled;
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
