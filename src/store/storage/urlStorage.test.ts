import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createUrlStorage, doesUrlContainState } from './urlStorage';
import type { StorageValue } from 'zustand/middleware';

// make the compressing/decompressing methods more readable for testing
vi.mock('lz-string', () => ({
  compressToEncodedURIComponent: vi.fn((str) => `compressed:${str}`),
  decompressFromEncodedURIComponent: vi.fn((str) => str.replace('compressed:', '')),
}));

type TestState = { foo: string };
const TEST_KEY = 'testKey';
const TEST_STATE: TestState = { foo: 'bar' };
const TEST_VALUE: StorageValue<TestState> = { state: TEST_STATE };
const COMPRESSED_VALUE = 'compressed:' + JSON.stringify(TEST_VALUE);

describe('UrlStorage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('client-side, storage', () => {
    const spies = {
      location: vi.spyOn(window, 'location', 'get'),
      pushState: vi.fn(),
    };

    function setLocationSearch(search: string) {
      spies.location.mockReturnValue({
        search,
        pathname: '/test',
        hash: '',
      } as unknown as Location);
    }

    beforeEach(() => {
      spies.location = vi.spyOn(window, 'location', 'get');
      setLocationSearch('');
      spies.pushState = vi.fn();
      global.window.history.pushState = spies.pushState;
    });

    afterEach(() => {
      spies.location.mockRestore();
    });

    it('contains null if key is not present', () => {
      setLocationSearch('');
      const storage = createUrlStorage<TestState>();
      expect(storage.getItem(TEST_KEY)).toBeNull();
    });

    it('contains parsed value if key is present', () => {
      setLocationSearch(`?${TEST_KEY}=${COMPRESSED_VALUE}`);
      const storage = createUrlStorage<TestState>();
      expect(storage.getItem(TEST_KEY)).toEqual(TEST_VALUE);
    });

    it('contains compressed value and updates URL', () => {
      const storage = createUrlStorage<TestState>();
      storage.setItem(TEST_KEY, TEST_VALUE);

      // Construct expected search string using URLSearchParams for consistent encoding
      const expectedParams = new URLSearchParams();
      expectedParams.set(TEST_KEY, COMPRESSED_VALUE);
      const expectedSearchString = expectedParams.toString();
      const expectedUrl = window.location.pathname + '?' + expectedSearchString;

      expect(window.history.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });

    it('removes key and updates URL', () => {
      setLocationSearch(`?${TEST_KEY}=${COMPRESSED_VALUE}`);
      const storage = createUrlStorage<TestState>();
      storage.removeItem(TEST_KEY);

      // After removal, the param should not be present, queryParams.toString() will be empty
      const expectedUrl = window.location.pathname + '?';
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });
  });

  describe('server-side', () => {
    let originalWindow: Window & typeof globalThis;

    beforeAll(() => {
      originalWindow = global.window;
      // @ts-expect-error: Simulate server-side by deleting window
      delete global.window;
    });

    afterAll(() => {
      global.window = originalWindow!;
    });

    it('does not throw and does not update URL', () => {
      const storage = createUrlStorage<TestState>();
      expect(() => storage.setItem(TEST_KEY, TEST_VALUE)).not.toThrow();
      expect(() => storage.removeItem(TEST_KEY)).not.toThrow();
    });
  });
});

describe('doesUrlContainState', () => {
  it('should return true if param exists', () => {
    const url = new URL('http://localhost/?rulesFromUrl=bar');
    expect(doesUrlContainState(url, 'rulesFromUrl')).toBe(true);
  });

  it('should return false if param does not exist', () => {
    const url = new URL('http://localhost/?someOtherParam=bar');
    expect(doesUrlContainState(url, 'rulesFromUrl')).toBe(false);
  });

  it('should return false if param is not present', () => {
    const url = new URL('http://localhost/');
    expect(doesUrlContainState(url, 'rulesFromUrl')).toBe(false);
  });
});
