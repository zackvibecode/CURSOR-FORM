import { flushSync } from "react-dom";

/** Paint loading/disabled UI in the same frame as the click. */
export function setPendingInstant<T>(setPending: (value: T) => void, value: T): void {
  flushSync(() => {
    setPending(value);
  });
}
