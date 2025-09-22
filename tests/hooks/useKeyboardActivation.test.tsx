import { renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import useKeyboardActivation from '@/hooks/useKeyboardActivation';

type EventFactoryResult = {
  event: KeyboardEvent<HTMLElement>;
  preventDefault: ReturnType<typeof vi.fn>;
  stopPropagation: ReturnType<typeof vi.fn>;
};

const createKeyboardEvent = (key: string): EventFactoryResult => {
  const preventDefault = vi.fn();
  const stopPropagation = vi.fn();

  const event = {
    key,
    preventDefault,
    stopPropagation,
  } as unknown as KeyboardEvent<HTMLElement>;

  return { event, preventDefault, stopPropagation };
};

describe('useKeyboardActivation', () => {
  it('invokes the provided callback when an activation key is pressed', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() => useKeyboardActivation(onActivate));
    const { event, preventDefault, stopPropagation } = createKeyboardEvent('Enter');

    result.current(event);

    expect(onActivate).toHaveBeenCalledWith(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it('ignores keys that are not configured as activation keys', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() => useKeyboardActivation(onActivate));
    const { event, preventDefault, stopPropagation } = createKeyboardEvent('Escape');

    result.current(event);

    expect(onActivate).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it('respects the preventDefault option', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardActivation(onActivate, { preventDefault: false }),
    );
    const { event, preventDefault } = createKeyboardEvent('Enter');

    result.current(event);

    expect(onActivate).toHaveBeenCalledWith(event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('calls stopPropagation when configured', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardActivation(onActivate, { stopPropagation: true }),
    );
    const { event, stopPropagation } = createKeyboardEvent('Enter');

    result.current(event);

    expect(onActivate).toHaveBeenCalledWith(event);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });
});
