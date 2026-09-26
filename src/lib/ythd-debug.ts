// Diagnostic logging for sideloaded test builds handed to a bug reporter.
//
// The flag is `import.meta.env.PROD`, the same one that decides whether analytics reports, so the
// two can never disagree: a build that logs is a build that sends nothing, and a store build is
// silent in the console and reporting to GA4. The minifier folds the constant, so every call below
// disappears from a production bundle rather than shipping dead.
const IS_DEBUG_BUILD = !import.meta.env.PROD;

const PREFIX = "[YTHD]";

export function logDebug(message: string, data?: Record<string, unknown>) {
  if (!IS_DEBUG_BUILD) {
    return;
  }

  if (data) {
    console.log(`${PREFIX} ${message}`, data);
    return;
  }

  console.log(`${PREFIX} ${message}`);
}
