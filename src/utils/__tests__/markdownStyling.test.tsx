import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  highlightPlaceholders,
  processRulesContentMarkdown,
  styleMarkdownContent,
} from '../markdownStyling';
import type { RulesContent } from '../../services/rules-builder/RulesBuilderTypes';

describe('markdownStyling utilities', () => {
  describe('highlightPlaceholders', () => {
    test('should return null for empty input', () => {
      // Arrange
      const input = '';

      // Act
      const result = highlightPlaceholders(input);

      // Assert
      expect(result).toBeNull();
    });

    test('should highlight placeholders with lime color', () => {
      // Arrange
      const input = 'This is a {{placeholder}} in text';

      // Act
      const result = highlightPlaceholders(input);

      // Assert - Rendering to verify the structure
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe('This is a {{placeholder}} in text');
      expect(container.querySelector('.text-lime-400')).not.toBeNull();
      expect(container.querySelector('.text-lime-400')?.textContent).toBe('{{placeholder}}');
    });

    test('should handle multiple placeholders correctly', () => {
      // Arrange
      const input = '{{first}} text {{second}}';

      // Act
      const result = highlightPlaceholders(input);

      // Assert
      const { container } = render(<>{result}</>);
      const highlightedElements = container.querySelectorAll('.text-lime-400');
      expect(highlightedElements.length).toBe(2);
      expect(highlightedElements[0].textContent).toBe('{{first}}');
      expect(highlightedElements[1].textContent).toBe('{{second}}');
    });
  });

  describe('processRulesContentMarkdown', () => {
    test('should return null for empty input', () => {
      // Arrange
      const input = '';

      // Act
      const result = processRulesContentMarkdown(input);

      // Assert
      expect(result).toBeNull();
    });

    test('should style H2 headers with indigo color', () => {
      // Arrange
      const input = '## Header 2\nSome content';

      // Act
      const result = processRulesContentMarkdown(input);

      // Assert
      const { container } = render(<>{result}</>);
      expect(container.querySelector('.text-indigo-400')).not.toBeNull();
      expect(container.querySelector('.text-indigo-400')?.textContent).toBe('## Header 2');
    });

    test('should style H3 headers with purple color', () => {
      // Arrange
      const input = '### Header 3\nSome content';

      // Act
      const result = processRulesContentMarkdown(input);

      // Assert
      const { container } = render(<>{result}</>);
      expect(container.querySelector('.text-purple-400')).not.toBeNull();
      expect(container.querySelector('.text-purple-400')?.textContent).toBe('### Header 3');
    });

    test('should style H4 headers with light purple color', () => {
      // Arrange
      const input = '#### Header 4\nSome content';

      // Act
      const result = processRulesContentMarkdown(input);

      // Assert
      const { container } = render(<>{result}</>);
      expect(container.querySelector('.text-purple-300')).not.toBeNull();
      expect(container.querySelector('.text-purple-300')?.textContent).toBe('#### Header 4');
    });

    test('should highlight placeholders inside markdown content', () => {
      // Arrange
      const input = 'Text with {{placeholder}} inside';

      // Act
      const result = processRulesContentMarkdown(input);

      // Assert
      const { container } = render(<>{result}</>);
      expect(container.querySelector('.text-lime-400')).not.toBeNull();
      expect(container.querySelector('.text-lime-400')?.textContent).toBe('{{placeholder}}');
    });

    test('should correctly process complex markdown with multiple elements', () => {
      // Arrange
      const input = '## Title\nContent with {{placeholder}}\n### Subtitle\nMore text';

      // Act
      const result = processRulesContentMarkdown(input);

      // Assert
      const { container } = render(<>{result}</>);
      expect(container.querySelectorAll('.text-indigo-400').length).toBe(1);
      expect(container.querySelectorAll('.text-purple-400').length).toBe(1);
      expect(container.querySelectorAll('.text-lime-400').length).toBe(1);
      expect(container.textContent).toContain('Title');
      expect(container.textContent).toContain('Content with');
      expect(container.textContent).toContain('{{placeholder}}');
      expect(container.textContent).toContain('Subtitle');
      expect(container.textContent).toContain('More text');
    });
  });

  describe('styleMarkdownContent', () => {
    test('should process an array of RulesContent objects', () => {
      // Arrange
      const rulesContent: RulesContent[] = [
        { markdown: '## Header\nContent {{here}}', label: 'Rule 1', fileName: 'rule1.mdc' },
        { markdown: '### Subheader\nMore content', label: 'Rule 2', fileName: 'rule2.mdc' },
      ];

      // Act
      const result = styleMarkdownContent(rulesContent);

      // Assert
      expect(result.length).toBe(2);

      // Render and check first rule
      const { container: container1 } = render(<>{result[0]}</>);
      expect(container1.querySelector('.text-indigo-400')).not.toBeNull();
      expect(container1.querySelector('.text-lime-400')).not.toBeNull();

      // Render and check second rule
      const { container: container2 } = render(<>{result[1]}</>);
      expect(container2.querySelector('.text-purple-400')).not.toBeNull();
    });

    test('should handle empty array', () => {
      // Arrange
      const rulesContent: RulesContent[] = [];

      // Act
      const result = styleMarkdownContent(rulesContent);

      // Assert
      expect(result.length).toBe(0);
    });
  });
});
