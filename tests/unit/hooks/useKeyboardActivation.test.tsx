import { fireEvent, render } from '../../setup/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { KeyboardEventHandler } from 'react';
import { useKeyboardActivation } from '@/hooks/useKeyboardActivation';

const TARGET_TEST_ID = 'keyboard-activation-target';
const PARENT_TEST_ID = 'keyboard-activation-parent';

type KeyboardActivationOptions = Parameters<typeof useKeyboardActivation<HTMLDivElement>>[0];
type KeyboardActivationHandler = Parameters<ReturnType<typeof useKeyboardActivation<HTMLDivElement>>>[0];

interface TestComponentProps {
  onActivate: KeyboardActivationHandler;
  options?: KeyboardActivationOptions;
  parentHandler?: KeyboardEventHandler<HTMLDivElement>;
}

function TestComponent({ onActivate, options, parentHandler }: TestComponentProps) {
  const createActivationHandler = useKeyboardActivation<HTMLDivElement>(options);
  const handleKeyDown = createActivationHandler(onActivate);

  return (
    <div data-testid={PARENT_TEST_ID} onKeyDown={parentHandler}>
      <div data-testid={TARGET_TEST_ID} onKeyDown={handleKeyDown} tabIndex={0}>
        Target
      </div>
    </div>
  );
}

describe('useKeyboardActivation', () => {
  it('invokes the handler for default activation keys and prevents the default action', () => {
    const handler = vi.fn();
    const { getByTestId } = render(<TestComponent onActivate={handler} />);
    const target = getByTestId(TARGET_TEST_ID);

    fireEvent.keyDown(target, { key: 'Enter' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].key).toBe('Enter');
    expect(handler.mock.calls[0][0].defaultPrevented).toBe(true);

    fireEvent.keyDown(target, { key: 'Escape' });
    expect(handler).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(target, { key: ' ' });
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0].key).toBe(' ');
    expect(handler.mock.calls[1][0].defaultPrevented).toBe(true);
  });

  it('supports custom activation keys', () => {
    const handler = vi.fn();
    const { getByTestId } = render(
      <TestComponent onActivate={handler} options={{ keys: ['Escape'] }} />,
    );
    const target = getByTestId(TARGET_TEST_ID);

    fireEvent.keyDown(target, { key: 'Enter' });
    expect(handler).not.toHaveBeenCalled();

    fireEvent.keyDown(target, { key: 'Escape' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].defaultPrevented).toBe(true);
  });

  it('respects the preventDefault option', () => {
    const handler = vi.fn();
    const { getByTestId } = render(
      <TestComponent onActivate={handler} options={{ preventDefault: false }} />,
    );
    const target = getByTestId(TARGET_TEST_ID);

    fireEvent.keyDown(target, { key: 'Enter' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].defaultPrevented).toBe(false);
  });

  it('controls event propagation based on configuration', () => {
    const handler = vi.fn();
    const parentHandler = vi.fn();
    const { getByTestId, rerender } = render(
      <TestComponent onActivate={handler} parentHandler={parentHandler} />,
    );
    const target = getByTestId(TARGET_TEST_ID);

    fireEvent.keyDown(target, { key: 'Enter' });
    expect(parentHandler).toHaveBeenCalledTimes(1);

    rerender(
      <TestComponent
        onActivate={handler}
        options={{ stopPropagation: true }}
        parentHandler={parentHandler}
      />,
    );
    const updatedTarget = getByTestId(TARGET_TEST_ID);

    fireEvent.keyDown(updatedTarget, { key: 'Enter' });
    expect(parentHandler).toHaveBeenCalledTimes(1);
  });
});
