const KEY_API_KEY = "v2p:gemini_api_key";
const KEY_MODEL = "v2p:gemini_model";

export const DEFAULT_MODEL = "gemini-2.5-pro";

export const SUPPORTED_MODELS = [
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (recommended — best video understanding)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (faster, cheaper)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
] as const;

export function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_API_KEY) ?? "";
}

export function saveApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) window.localStorage.setItem(KEY_API_KEY, key);
  else window.localStorage.removeItem(KEY_API_KEY);
}

export function loadModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return window.localStorage.getItem(KEY_MODEL) ?? DEFAULT_MODEL;
}

export function saveModel(model: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_MODEL, model);
}
