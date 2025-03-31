import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// This is just a sample component for testing
function ExampleComponent({ text }: { text: string }) {
  return <div>{text}</div>;
}

describe('Example Component', () => {
  it('renders the text correctly', () => {
    const testText = 'Hello, world!';
    render(<ExampleComponent text={testText} />);

    expect(screen.getByText(testText)).toBeInTheDocument();
  });
});
