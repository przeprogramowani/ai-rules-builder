import React from 'react';

/**
 * Highlights curly bracket placeholders in the text with lime color
 * @param text The text to process
 * @returns React elements with highlighted placeholders
 */
export const highlightPlaceholders = (text: string): React.ReactNode => {
  if (!text) return null;

  // Regular expression to match curly bracket placeholders like {{...}}
  const regex = /(\{\{.*?\}\})/g;

  // Split the text by the regex matches
  const parts = text.split(regex);

  // Map each part to either plain text or a highlighted span
  return parts.map((part, index) => {
    if (part.match(regex)) {
      // This part is a placeholder, highlight it
      return (
        <span key={index} className="text-lime-400">
          {part}
        </span>
      );
    }
    // This is regular text
    return part;
  });
};

/**
 * Styles markdown content with colored headers and highlighted placeholders
 * @param text The markdown text to process
 * @returns React elements with styled markdown
 */
export const styleMarkdownContent = (text: string): React.ReactNode => {
  if (!text) return null;

  // Regular expressions for different markdown elements
  // Use word boundaries and non-greedy matching to avoid conflicts
  const h2Regex = /(^|\n)(## [^\n]+)(\n|$)/g;
  const h3Regex = /(^|\n)(### [^\n]+)(\n|$)/g;
  const h4Regex = /(^|\n)(#### [^\n]+)(\n|$)/g;
  const placeholderRegex = /(\{\{.*?\}\})/g;

  // First replace headers with styled spans
  let processedText = text.replace(h2Regex, (match, start, content, end) => {
    return `${start}<h2-styled>${content}</h2-styled>${end}`;
  });

  processedText = processedText.replace(
    h3Regex,
    (match, start, content, end) => {
      return `${start}<h3-styled>${content}</h3-styled>${end}`;
    },
  );

  processedText = processedText.replace(
    h4Regex,
    (match, start, content, end) => {
      return `${start}<h4-styled>${content}</h4-styled>${end}`;
    },
  );

  // Split by custom tags and placeholders
  const combinedRegex =
    /(<h2-styled>.*?<\/h2-styled>|<h3-styled>.*?<\/h3-styled>|<h4-styled>.*?<\/h4-styled>|\{\{.*?\}\})/gs;
  const parts = processedText.split(combinedRegex);

  // Process each part
  return parts.map((part, index) => {
    if (part.startsWith('<h2-styled>') && part.endsWith('</h2-styled>')) {
      // H2 header - primary purple (indigo)
      const content = part
        .replace('<h2-styled>', '')
        .replace('</h2-styled>', '');
      return (
        <span key={index} className="text-indigo-400">
          {content}
        </span>
      );
    } else if (
      part.startsWith('<h3-styled>') &&
      part.endsWith('</h3-styled>')
    ) {
      // H3 header - secondary purple
      const content = part
        .replace('<h3-styled>', '')
        .replace('</h3-styled>', '');
      return (
        <span key={index} className="text-purple-400">
          {content}
        </span>
      );
    } else if (
      part.startsWith('<h4-styled>') &&
      part.endsWith('</h4-styled>')
    ) {
      // H4 header - lighter purple
      const content = part
        .replace('<h4-styled>', '')
        .replace('</h4-styled>', '');
      return (
        <span key={index} className="text-purple-300">
          {content}
        </span>
      );
    } else if (part.match(placeholderRegex)) {
      // Placeholder - lime green
      return (
        <span key={index} className="text-lime-400">
          {part}
        </span>
      );
    }
    // Regular text
    return part;
  });
};
