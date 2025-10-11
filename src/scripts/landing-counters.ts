/**
 * Number counter animations for landing page
 * Animates numbers from 0 to target value with smooth transitions
 */

import { ANIMATION_DURATIONS, OBSERVER_THRESHOLDS, ROOT_MARGINS } from '../data/landingContent';

interface CounterOptions {
  duration?: number;
  startDelay?: number;
  easing?: (t: number) => number;
}

/**
 * Easing function for smooth counter animation
 */
const easeOutQuad = (t: number): number => {
  return t * (2 - t);
};

/**
 * Animate a number counter from 0 to target value
 */
export function animateCounter(
  element: HTMLElement,
  target: number,
  options: CounterOptions = {},
): void {
  const {
    duration = ANIMATION_DURATIONS.COUNTER_DEFAULT,
    startDelay = 0,
    easing = easeOutQuad,
  } = options;

  const suffix = element.dataset.suffix || '';
  const prefix = element.dataset.prefix || '';

  const startTime = performance.now() + startDelay;

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;

    if (elapsed < 0) {
      requestAnimationFrame(update);
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = Math.floor(easedProgress * target);

    element.textContent = `${prefix}${currentValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Ensure final value is exact
      element.textContent = `${prefix}${target}${suffix}`;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Initialize counter animations when elements come into view
 */
export function initializeCounters(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          const element = entry.target as HTMLElement;
          const target = parseInt(element.dataset.count || '0', 10);
          const delay = parseInt(element.dataset.delay || '0', 10);

          animateCounter(element, target, {
            duration: ANIMATION_DURATIONS.COUNTER_DEFAULT,
            startDelay: delay,
          });

          // Unobserve after animation starts
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: OBSERVER_THRESHOLDS.MEDIUM,
      rootMargin: ROOT_MARGINS.LARGE,
    },
  );

  // Find all elements with data-count attribute
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach((counter) => observer.observe(counter));
}

/**
 * Initialize staggered counter animations for layer cards
 */
export function initializeLayerCounters(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const layerCounts = entry.target.querySelectorAll('.layer-count');
          layerCounts.forEach((counter, index) => {
            if (!counter.classList.contains('counted')) {
              counter.classList.add('counted');
              const element = counter as HTMLElement;
              const target = parseInt(element.dataset.count || '0', 10);

              animateCounter(element, target, {
                duration: ANIMATION_DURATIONS.COUNTER_LAYER,
                startDelay: index * ANIMATION_DURATIONS.COUNTER_STAGGER_DELAY,
              });
            }
          });

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: OBSERVER_THRESHOLDS.MEDIUM,
    },
  );

  // Observe the tech stack container
  const techStackSection = document.querySelector('#tech-stack');
  if (techStackSection) {
    observer.observe(techStackSection);
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeCounters();
    initializeLayerCounters();
  });
}
