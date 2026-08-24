export {};

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    /** Meta Pixel — set by the fbevents.js base code. */
    fbq?: FbqFn;
    /** Internal pixel queue — same function as fbq while the script loads. */
    _fbq?: FbqFn;
  }
}
