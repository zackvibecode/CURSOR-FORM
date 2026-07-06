declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown[] & { loaded?: boolean; push?: unknown; queue?: unknown[] };
  }
}

export {};
