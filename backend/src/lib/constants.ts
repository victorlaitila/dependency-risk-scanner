// AI model and formatting defaults
export const DEFAULT_HUGGINGFACE_MODEL_ID = "openai/gpt-oss-120b:fastest";
export const MAX_EXPLANATION_LENGTH = 350;

// Server defaults
export const DEFAULT_MAX_LOCKFILE_SIZE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_PORT = 3001;
export const LOCALHOST_ORIGINS: RegExp[] = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
