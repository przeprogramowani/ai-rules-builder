/**
 * Landing page shared constants
 * Contains truly shared content used across multiple landing page components
 * Component-specific content has been moved to respective component files
 * Animation constants moved to landingAnimations.ts
 */

// GitHub repository URL
export const GITHUB_REPO_URL = 'https://github.com/przeprogramowani/ai-rules-builder';

// MCP documentation URL
export const MCP_DOCS_URL =
  'https://github.com/przeprogramowani/ai-rules-builder/tree/main/mcp-server';

// ============================================================================
// LINKS AND ROUTES
// ============================================================================

// Internal application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
} as const;

// Anchor links for in-page navigation
export const ANCHORS = {
  MAIN_CONTENT: '#main-content',
  FEATURES: '#features',
  CHOOSE_YOUR_PATH: '#choose-your-path',
} as const;

// External links
export const EXTERNAL_LINKS = {
  GITHUB: GITHUB_REPO_URL,
  GITHUB_CONTRIBUTING: `${GITHUB_REPO_URL}/blob/main/CONTRIBUTING.md`,
  MCP_DOCS: MCP_DOCS_URL,
  LIBRARY_FORM: 'https://airtable.com/appBN64leXIbQ1gDe/pagwa0kilsbzLUFBQ/form',
} as const;

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

// Animation delays for gradient orbs (in seconds)
export const GRADIENT_ORB_DELAYS = {
  HERO_BLUE: '0s',
  HERO_TEAL: '7s',
  HERO_PURPLE: '3s',

  FEATURES_BLUE: '2s',
  FEATURES_TEAL: '5s',

  TECH_PURPLE: '4s',
  TECH_TEAL: '1s',

  MCP_PURPLE: '6s',

  CTA_BLUE: '0s',
  CTA_TEAL: '3s',
} as const;
