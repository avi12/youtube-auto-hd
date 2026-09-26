// web-ext-run ships no types. Only the surface scripts/dev.ts uses is declared here - a
// hand-written shim beats `any`, which would silently swallow a typo in the launch options.
declare module "web-ext-run" {
  interface ExtensionRunner {
    reloadAllExtensions: () => Promise<void>;
    exit: () => Promise<void>;
    registerCleanup: (cleanupCallback: () => void) => void;
  }

  const webExtRun: {
    cmd: {
      run: (options: Record<string, unknown>, config?: { shouldExitProgram?: boolean }) => Promise<ExtensionRunner>;
    };
  };
  export default webExtRun;
}
