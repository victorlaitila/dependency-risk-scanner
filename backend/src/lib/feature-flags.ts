/**
 * Feature flags configuration.
 * Control optional features via environment variables.
 */

function isDisabled(envValue: string | undefined): boolean {
  return envValue === "0";
}

export const featureFlags = {
  /**
   * Disable with ENABLE_AI_EXPLANATIONS=0 to test without AI endpoint calls.
   * Default: true if HUGGINGFACE_API_KEY is set, false otherwise.
   */
  aiExplanationsEnabled: (): boolean => {
    if (isDisabled(process.env.ENABLE_AI_EXPLANATIONS)) {
      return false;
    }
    return !!process.env.HUGGINGFACE_API_KEY;
  },
};
