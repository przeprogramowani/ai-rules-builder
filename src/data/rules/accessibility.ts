import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Accessibility library rules based on WCAG 2.2
 */
export const accessibilityRules: LibraryRulesMap = {
  [Library.WCAG_PERCEIVABLE]: [
    'Provide text alternatives for non-text content including images, icons, and graphics with appropriate alt attributes',
    'Ensure pre-recorded audio-visual content has captions, audio descriptions, and transcripts for {{media_content}}',
    'Maintain minimum contrast ratios of 4.5:1 for normal text and 3:1 for large text and UI components',
    'Enable content to be presented in different ways without losing information or structure when zoomed or resized',
    'Avoid using color alone to convey information; pair with text, patterns, or icons for {{status_indicators}}',
    'Provide controls to pause, stop, or hide any moving, blinking, or auto-updating content',
    'Ensure text can be resized up to 200% without loss of content or functionality in {{responsive_layouts}}',
    'Use responsive design that adapts to different viewport sizes and zoom levels without horizontal scrolling',
    'Enable users to customize text spacing (line height, paragraph spacing, letter/word spacing) without breaking layouts',
  ],

  [Library.WCAG_OPERABLE]: [
    'Make all functionality accessible via keyboard with visible focus indicators for {{interactive_elements}}',
    'Avoid keyboard traps where focus cannot move away from a component via standard navigation',
    'Provide mechanisms to extend, adjust, or disable time limits if present in {{timed_interactions}}',
    'Avoid content that flashes more than three times per second to prevent seizure triggers',
    'Implement skip navigation links to bypass blocks of repeated content across pages',
    'Use descriptive page titles, headings, and link text that indicate purpose and destination',
    'Ensure focus order matches the visual and logical sequence of information presentation',
    'Support multiple ways to find content (search, site map, logical navigation hierarchy)',
    'Allow pointer gesture actions to be accomplished with a single pointer without path-based gestures',
    'Implement pointer cancellation to prevent unintended function activation, especially for {{critical_actions}}',
  ],

  [Library.WCAG_UNDERSTANDABLE]: [
    'Specify the human language of the page and any language changes using lang attributes',
    'Ensure components with the same functionality have consistent identification and behavior across {{application_sections}}',
    'Provide clear labels, instructions, and error messages for user inputs and {{form_elements}}',
    'Implement error prevention for submissions with legal or financial consequences (confirmation, review, undo)',
    'Make navigation consistent across the site with predictable patterns for menus and interactive elements',
    'Ensure that receiving focus or changing settings does not automatically trigger unexpected context changes',
    'Design context-sensitive help for complex interactions including validated input formats',
    'Use clear language and define unusual terms, abbreviations, and jargon for {{domain_specific_content}}',
    'Provide visual and programmatic indication of current location within navigation systems',
  ],

  [Library.WCAG_ROBUST]: [
    'Use valid, well-formed markup that follows HTML specifications for {{document_structure}}',
    'Provide name, role, and value information for all user interface components',
    'Ensure custom controls and interactive elements maintain compatibility with assistive technologies',
    'Implement status messages that can be programmatically determined without receiving focus',
    'Use semantic HTML elements that correctly describe the content they contain (buttons, lists, headings, etc.)',
    'Validate code against technical specifications to minimize compatibility errors',
    'Test with multiple browsers and assistive technologies for cross-platform compatibility',
    'Avoid deprecated HTML elements and attributes that may not be supported in future technologies',
  ],

  [Library.ARIA]: [
    'Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)',
    'Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents',
    'Set aria-expanded and aria-controls for expandable content like accordions and dropdowns',
    'Use aria-live regions with appropriate politeness settings for dynamic content updates',
    'Implement aria-hidden to hide decorative or duplicative content from screen readers',
    'Apply aria-label or aria-labelledby for elements without visible text labels',
    'Use aria-describedby to associate descriptive text with form inputs or complex elements',
    'Implement aria-current for indicating the current item in a set, navigation, or process',
    'Avoid redundant ARIA that duplicates the semantics of native HTML elements',
    'Apply aria-invalid and appropriate error messaging for form validation in {{form_validation}}',
  ],

  [Library.ACCESSIBILITY_TESTING]: [
    'Test keyboard navigation to verify all interactive elements are operable without a mouse',
    'Verify screen reader compatibility with NVDA, JAWS, and VoiceOver for {{critical_user_journeys}}',
    'Use automated testing tools like Axe, WAVE, or Lighthouse to identify common accessibility issues',
    'Check color contrast using tools like Colour Contrast Analyzer for all text and UI components',
    'Test with page zoomed to 200% to ensure content remains usable and visible',
    'Perform manual accessibility audits using WCAG 2.2 checklist for key user flows',
    'Test with voice recognition software like Dragon NaturallySpeaking for voice navigation',
    'Validate form inputs have proper labels, instructions, and error handling mechanisms',
    'Conduct usability testing with disabled users representing various disability types',
    'Implement accessibility unit tests for UI components to prevent regression',
  ],

  [Library.MOBILE_ACCESSIBILITY]: [
    'Ensure touch targets are at least 44 by 44 pixels for comfortable interaction on mobile devices',
    'Implement proper viewport configuration to support pinch-to-zoom and prevent scaling issues',
    'Design layouts that adapt to both portrait and landscape orientations without loss of content',
    'Support both touch and keyboard navigation for hybrid devices with {{input_methods}}',
    'Ensure interactive elements have sufficient spacing to prevent accidental activation',
    'Test with mobile screen readers like VoiceOver (iOS) and TalkBack (Android)',
    'Design forms that work efficiently with on-screen keyboards and autocomplete functionality',
    'Implement alternatives to complex gestures that require fine motor control',
    'Ensure content is accessible when device orientation is locked for users with fixed devices',
    'Provide alternatives to motion-based interactions for users with vestibular disorders',
  ],
};
