/**
 * Landing page scroll animations
 * Uses Intersection Observer for fade-in effects
 */

import { OBSERVER_THRESHOLDS, ROOT_MARGINS } from '../data/landingAnimations';

// Initialize scroll animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Detect Safari and mobile devices for performance optimizations
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Add classes for CSS targeting
  if (isSafari) {
    document.documentElement.classList.add('is-safari');
  }
  if (isMobile) {
    document.documentElement.classList.add('is-mobile');
  }
  if (prefersReducedMotion) {
    document.documentElement.classList.add('prefers-reduced-motion');
  }

  // For Safari and mobile, disable expensive animations entirely
  const shouldDisableAnimations = isSafari || isMobile || prefersReducedMotion;
  if (shouldDisableAnimations) {
    console.log('[Performance] Disabling expensive animations for better performance', {
      isSafari,
      isMobile,
      prefersReducedMotion,
    });
  }

  // Only enable scroll animations on high-performance browsers (Chrome Desktop)
  if (!shouldDisableAnimations) {
    // Create intersection observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            // Optionally unobserve after animation
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: OBSERVER_THRESHOLDS.LOW,
        rootMargin: ROOT_MARGINS.DEFAULT,
      },
    );

    // Observe all sections for fade-in
    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      section.classList.add('animate-on-scroll');
      observer.observe(section);
    });
  }

  // Smooth scroll for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    });
  });
});
