/**
 * Micro-interactions for landing page
 * Handles hover effects, tab switching animations, and other interactive behaviors
 */

import {
  ANIMATION_DURATIONS,
  MAGNETIC_BUTTON,
  OBSERVER_THRESHOLDS,
  ROOT_MARGINS,
} from '../data/landingAnimations';

/**
 * Enhance tab switching with fade transitions
 */
export function initializeTabAnimations(): void {
  const tabButtons = document.querySelectorAll('[data-tab]');
  const tabContents = document.querySelectorAll('[data-tab-content]');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      tabContents.forEach((content) => {
        const contentId = content.getAttribute('data-tab-content');

        if (contentId === tabName) {
          content.classList.remove('hidden');
          (content as HTMLElement).style.animation =
            `fadeIn ${ANIMATION_DURATIONS.TAB_FADE_IN}ms ease-out`;
        } else {
          (content as HTMLElement).style.animation =
            `fadeOut ${ANIMATION_DURATIONS.TAB_FADE_OUT}ms ease-out`;
          setTimeout(() => {
            content.classList.add('hidden');
          }, ANIMATION_DURATIONS.TAB_HIDE_DELAY);
        }
      });
    });
  });
}

/**
 * Initialize copy button interactions
 */
export function initializeCopyButtons(): void {
  const copyButtons = document.querySelectorAll('.copy-button');

  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-copy-target');
      if (!targetId) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      const text = target.textContent || '';

      try {
        await navigator.clipboard.writeText(text);

        // Add success animation
        button.classList.add('copied');

        // Change button text temporarily
        const originalText = button.textContent;
        button.textContent = 'Copied!';

        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = originalText;
        }, ANIMATION_DURATIONS.COPY_FEEDBACK);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    });
  });
}

/**
 * Initialize magnetic button effect (advanced)
 * Button follows cursor slightly when hovered
 */
export function initializeMagneticButtons(): void {
  const magneticButtons = document.querySelectorAll('.magnetic-button');

  magneticButtons.forEach((button) => {
    const element = button as HTMLElement;

    button.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left - rect.width / 2;
      const y = (e as MouseEvent).clientY - rect.top - rect.height / 2;

      element.style.transform = `translate(${x * MAGNETIC_BUTTON.TRANSFORM_MULTIPLIER}px, ${y * MAGNETIC_BUTTON.TRANSFORM_MULTIPLIER}px) scale(${MAGNETIC_BUTTON.HOVER_SCALE})`;
    });

    button.addEventListener('mouseleave', () => {
      element.style.transform = `translate(0, 0) scale(${MAGNETIC_BUTTON.DEFAULT_SCALE})`;
    });
  });
}

/**
 * Initialize entrance animations for sections on scroll
 */
export function initializeScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optionally unobserve after animation
          // observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: OBSERVER_THRESHOLDS.LOW,
      rootMargin: ROOT_MARGINS.DEFAULT,
    },
  );

  // Observe elements with animation classes
  const animatedElements = document.querySelectorAll(
    '.trust-badge, .problem-card, .solution-card, .layer-card, .contributor-avatar',
  );
  animatedElements.forEach((element) => observer.observe(element));
}

/**
 * Initialize step card animations when "How It Works" section scrolls into view
 */
export function initializeStepCardAnimations(): void {
  const howItWorksSection = document.querySelector('#how-it-works');
  if (!howItWorksSection) return;

  // Mark all containers as will-animate on initialization
  const containers = howItWorksSection.querySelectorAll('.step-cards-container');
  containers.forEach((container) => {
    container.classList.add('will-animate');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('step-cards-animated')) {
          // Mark section as animated to prevent re-triggering
          entry.target.classList.add('step-cards-animated');

          // Animate visible step cards with stagger
          const visibleContainer = entry.target.querySelector(
            '.tab-content:not(.hidden)',
          ) as HTMLElement;

          if (visibleContainer) {
            const cards = visibleContainer.querySelectorAll('[data-step-index] .step-card');

            cards.forEach((card, index) => {
              // Trigger animation with stagger delay
              setTimeout(() => {
                card.classList.add('animate-in');

                // Animate step number as well
                const stepNumber = card.querySelector('.step-number');
                if (stepNumber) {
                  stepNumber.classList.add('animate-in');
                }

                // Remove will-animate and add animated class after last card completes
                if (index === cards.length - 1) {
                  setTimeout(() => {
                    visibleContainer.classList.remove('will-animate');
                    visibleContainer.classList.add('animated');
                  }, 800); // Wait for animation transition to complete (increased from 600ms)
                }
              }, index * 200); // Increased from ANIMATION_DURATIONS.COUNTER_STAGGER_DELAY (100ms) to 200ms
            });
          }

          // Unobserve after animation triggers
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: OBSERVER_THRESHOLDS.LOW,
      rootMargin: ROOT_MARGINS.DEFAULT,
    },
  );

  observer.observe(howItWorksSection);
}

/**
 * Check if animations should be disabled for performance
 */
function shouldDisableAnimations(): boolean {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return isSafari || isMobile || prefersReducedMotion;
}

/**
 * Initialize all micro-interactions
 */
export function initializeMicroInteractions(): void {
  // Always enable essential interactions (copy buttons)
  initializeCopyButtons();

  // Check if we should disable expensive animations
  if (shouldDisableAnimations()) {
    console.log('[Performance] Disabling expensive micro-interactions for better performance');

    // Show step cards immediately without animation
    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach((card) => {
      card.classList.remove('will-animate');
      const stepNumber = card.querySelector('.step-number');
      if (stepNumber) {
        stepNumber.classList.add('animate-in');
      }
    });

    return;
  }

  // Enable all animations on high-performance browsers (Chrome Desktop)
  initializeTabAnimations();
  initializeMagneticButtons();
  initializeScrollAnimations();
  initializeStepCardAnimations();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeMicroInteractions();
  });
}
