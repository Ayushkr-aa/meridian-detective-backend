/**
 * Single Authoritative Source of Truth for Gemini Model Configuration.
 * Defaults to 'gemini-3.8-flash', allowing override via process.env.GEMINI_MODEL
 * if the value conforms to a valid Gemini model identifier.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function getAuthoritativeGeminiModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && (envModel.startsWith('gemini-') || envModel.startsWith('models/gemini-'))) {
    return envModel;
  }
  return DEFAULT_GEMINI_MODEL;
}
