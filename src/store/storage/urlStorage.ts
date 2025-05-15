import type { PersistStorage, StorageValue } from 'zustand/middleware';
import * as LZString from 'lz-string';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString;

class UrlStorage<TState> implements PersistStorage<TState> {
  private queryParams: URLSearchParams;

  constructor() {
    if (this.isServerSide()) {
      this.queryParams = new URLSearchParams('');
    } else {
      this.queryParams = new URLSearchParams(window.location.search);
    }
  }

  getItem(name: string): StorageValue<TState> | Promise<StorageValue<TState> | null> | null {
    const value = this.queryParams.get(name);
    if (!value) return null;
    return JSON.parse(decompressFromEncodedURIComponent(value));
  }

  setItem(name: string, value: StorageValue<TState>): unknown | Promise<unknown> {
    this.queryParams.set(name, compressToEncodedURIComponent(JSON.stringify(value)));
    this.updateUrl();

    return Promise.resolve();
  }

  removeItem(name: string): unknown | Promise<unknown> {
    this.queryParams.delete(name);
    this.updateUrl();

    return Promise.resolve();
  }

  private updateUrl() {
    if (this.isServerSide()) return;
    window.history.pushState({}, '', window.location.pathname + '?' + this.queryParams.toString());
  }

  private isServerSide() {
    return typeof window === 'undefined';
  }
}

export const createUrlStorage = <TState>() => new UrlStorage<TState>();
export const doesUrlContainState = (url: URL, name: string): boolean =>
  url.searchParams.get(name) !== null;
