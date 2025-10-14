/**
 * Landing page animation constants
 * Animation-related configuration shared across landing page scripts
 */

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  // Transition durations for hover effects
  HOVER_TRANSITION: 300,

  // Tab switching animations
  TAB_FADE_IN: 400,
  TAB_FADE_OUT: 200,
  TAB_HIDE_DELAY: 200,

  // Counter animations
  COUNTER_DEFAULT: 1500,
  COUNTER_LAYER: 1200,
  COUNTER_STAGGER_DELAY: 100,

  // Copy button feedback
  COPY_FEEDBACK: 2000,
} as const;

// Root margins for Intersection Observer (in pixels)
export const ROOT_MARGINS = {
  DEFAULT: '0px 0px -50px 0px',
  LARGE: '0px 0px -100px 0px',
} as const;

// Threshold values for Intersection Observer (0-1 scale)
export const OBSERVER_THRESHOLDS = {
  LOW: 0.1,
  MEDIUM: 0.2,
  HIGH: 0.3,
} as const;

// Magnetic button effect settings
export const MAGNETIC_BUTTON = {
  TRANSFORM_MULTIPLIER: 0.2,
  HOVER_SCALE: 1.05,
  DEFAULT_SCALE: 1,
} as const;
