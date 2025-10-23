/**
 * URL parameter utilities for deep linking to prompts
 */

export interface PromptLinkParams {
  org?: string; // slug or ID
  collection?: string; // slug or ID
  segment?: string; // slug or ID
  prompt?: string; // ID only
}

/**
 * UUID validation regex (standard v4 format)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Parse prompt link parameters from a URL
 */
export function parsePromptParams(url: URL): PromptLinkParams {
  const params = url.searchParams;

  return {
    org: params.get('org') || undefined,
    collection: params.get('collection') || undefined,
    segment: params.get('segment') || undefined,
    prompt: params.get('prompt') || undefined,
  };
}

/**
 * Build a prompt URL with the given parameters
 */
export function buildPromptUrl(params: PromptLinkParams): string {
  const url = new URL('/prompts', window.location.origin);

  if (params.org) {
    url.searchParams.set('org', params.org);
  }

  if (params.collection) {
    url.searchParams.set('collection', params.collection);
  }

  if (params.segment) {
    url.searchParams.set('segment', params.segment);
  }

  if (params.prompt) {
    url.searchParams.set('prompt', params.prompt);
  }

  return url.toString();
}

/**
 * Check if the params object has at least one valid parameter
 */
export function hasValidParams(params: PromptLinkParams): boolean {
  return !!(params.org || params.collection || params.segment || params.prompt);
}
