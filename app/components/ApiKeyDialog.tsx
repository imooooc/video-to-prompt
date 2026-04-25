"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { SUPPORTED_MODELS } from "../lib/storage";

type Props = {
  open: boolean;
  initialApiKey: string;
  initialModel: string;
  onClose: () => void;
  onSave: (apiKey: string, model: string) => void;
};

export function ApiKeyDialog({
  open,
  initialApiKey,
  initialModel,
  onClose,
  onSave,
}: Props) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setApiKey(initialApiKey);
      setModel(initialModel);
    }
  }, [open, initialApiKey, initialModel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Your API key is stored locally in your browser only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="mb-1.5 block text-sm font-medium">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
                className="w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 pr-16 text-sm font-mono outline-none transition focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
            >
              Get a free Gemini API key from Google AI Studio
              <ExternalLink size={12} />
            </a>
          </div>

          <div>
            <label htmlFor="model" className="mb-1.5 block text-sm font-medium">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(apiKey.trim(), model)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
