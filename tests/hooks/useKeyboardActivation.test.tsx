import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import useKeyboardActivation from '@/hooks/useKeyboardActivation';

type UseKeyboardActivationOptions = Parameters<typeof useKeyboardActivation>[0];

const TestButton = ({
  options,
  onClick,
}: {
  options?: UseKeyboardActivationOptions;
  onClick?: () => void;
}) => {
  const handleActivation = useKeyboardActivation<HTMLButtonElement>(options);

  return (
    <button data-testid="keyboard-target" onClick={onClick} onKeyDown={handleActivation}>
      Activate
    </button>
  );
};

describe('useKeyboardActivation', () => {
  const dispatchKeyEvent = (element: HTMLElement, key: string) => {
    const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true });
    fireEvent(element, event);
    return event;
  };

  it('delegates activation to click for default keys', () => {
    const handleClick = vi.fn();
    render(<TestButton onClick={handleClick} />);

    const button = screen.getByTestId('keyboard-target');
    const event = dispatchKeyEvent(button, 'Enter');

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(event.cancelBubble).toBe(false);
  });

  it('supports activating with the space bar', () => {
    const handleClick = vi.fn();
    render(<TestButton onClick={handleClick} />);

    const button = screen.getByTestId('keyboard-target');
    dispatchKeyEvent(button, ' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects custom activation keys', () => {
    const handleClick = vi.fn();
    render(<TestButton options={{ keys: ['k'] }} onClick={handleClick} />);

    const button = screen.getByTestId('keyboard-target');
    dispatchKeyEvent(button, 'Enter');
    dispatchKeyEvent(button, 'k');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can skip preventDefault when configured', () => {
    const handleClick = vi.fn();
    render(<TestButton options={{ preventDefault: false }} onClick={handleClick} />);

    const button = screen.getByTestId('keyboard-target');
    const event = dispatchKeyEvent(button, 'Enter');

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('can stop event propagation when requested', () => {
    const parentHandler = vi.fn();
    render(
      <div onKeyDown={parentHandler}>
        <TestButton options={{ stopPropagation: true }} />
      </div>,
    );

    const button = screen.getByTestId('keyboard-target');
    dispatchKeyEvent(button, 'Enter');

    expect(parentHandler).not.toHaveBeenCalled();
  });

  it('invokes custom activation callback and does not click automatically', () => {
    const handleClick = vi.fn();
    const onActivate = vi.fn();
    render(<TestButton options={{ onActivate }} onClick={handleClick} />);

    const button = screen.getByTestId('keyboard-target');
    const event = dispatchKeyEvent(button, 'Enter');

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
    expect(handleClick).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });
});
