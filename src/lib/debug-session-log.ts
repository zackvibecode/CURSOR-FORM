import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const DEBUG_LOG = join(process.cwd(), "debug-6a31c9.log");

export function debugSessionLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "pre-fix"
): void {
  try {
    mkdirSync(dirname(DEBUG_LOG), { recursive: true });
    appendFileSync(
      DEBUG_LOG,
      `${JSON.stringify({ sessionId: "6a31c9", location, message, data, hypothesisId, runId, timestamp: Date.now() })}\n`,
      "utf8"
    );
  } catch {
    // ignore
  }
}
