/**
 * Landing page scroll animations
 * Uses Intersection Observer for fade-in effects
 */

import { OBSERVER_THRESHOLDS, ROOT_MARGINS } from '../data/landingAnimations';

// Initialize scroll animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
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
