/** Per-form "last seen" submission counts — used for unread badges on Forms list. */

const STORAGE_KEY = "oneform_form_seen_counts";

type SeenMap = Record<string, number>;

function readMap(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: SeenMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: SeenMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

export function getUnreadSubmissionCount(formId: string, totalCount: number): number {
  const map = readMap();
  if (!(formId in map)) {
    // First time seeing this form in the list — baseline to current total (no huge badge).
    map[formId] = totalCount;
    writeMap(map);
    return 0;
  }
  return Math.max(0, totalCount - map[formId]);
}

export function markFormSubmissionsSeen(formId: string, totalCount: number) {
  const map = readMap();
  map[formId] = Math.max(map[formId] ?? 0, totalCount);
  writeMap(map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("oneform-form-seen-updated"));
  }
}

/** Mark every listed form as fully seen (e.g. when opening Submissions page). */
export function markAllFormSubmissionsSeen(forms: Array<{ id: string; count: number }>) {
  const map = readMap();
  for (const form of forms) {
    map[form.id] = Math.max(map[form.id] ?? 0, form.count);
  }
  writeMap(map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("oneform-form-seen-updated"));
  }
}

export function subscribeFormSeenUpdates(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("oneform-form-seen-updated", listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("oneform-form-seen-updated", listener);
  };
}
