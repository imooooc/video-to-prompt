"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Settings,
  Upload,
  X,
} from "lucide-react";

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
import {
  generatePromptFromVideo,
  type ProgressStage,
} from "../lib/gemini";
import {
  DEFAULT_MODEL,
  loadApiKey,
  loadModel,
  saveApiKey,
  saveModel,
} from "../lib/storage";
import { ApiKeyDialog } from "./ApiKeyDialog";

const SEEGEN_BASE = "https://seegen.ai/app";
const UTM_PARAMS = {
  utm_source: "imooooc",
  utm_medium: "referral",
  utm_campaign: "video-to-prompt",
} as const;
const UTM_QS = `?${new URLSearchParams(UTM_PARAMS).toString()}`;
const GITHUB_URL = "https://github.com/imooooc/video-to-prompt";

const ACCEPTED_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",
  "video/x-flv",
  "video/3gpp",
  "video/x-matroska",
];
const MAX_BYTES = 1.9 * 1024 * 1024 * 1024; // 1.9GB — Gemini free tier hard limit is 2GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function stageLabel(s: ProgressStage): string {
  switch (s.stage) {
    case "uploading":
      return "Uploading video to Gemini…";
    case "processing":
      return "Gemini is processing the video…";
    case "generating":
      return "Generating prompt…";
    default:
      return "";
  }
}

export function VideoToPromptApp() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ProgressStage | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKey(loadApiKey());
    setModel(loadModel());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const seegenLink = useMemo(() => {
    if (!prompt) return SEEGEN_BASE + UTM_QS;
    const params = new URLSearchParams({ prompt, ...UTM_PARAMS });
    return `${SEEGEN_BASE}?${params.toString()}`;
  }, [prompt]);

  const handlePickFile = useCallback((picked: File | null) => {
    setError(null);
    setPrompt(null);
    if (!picked) return;
    if (!picked.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(
        `Video is too large (${formatBytes(picked.size)}). Max is 2 GB on Gemini free tier.`,
      );
      return;
    }
    setFile(picked);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) handlePickFile(f);
    },
    [handlePickFile],
  );

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    setPrompt(null);
    setProgress({ stage: "uploading" });
    try {
      const text = await generatePromptFromVideo({
        file,
        apiKey,
        model,
        onProgress: setProgress,
      });
      setPrompt(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [file, apiKey, model]);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [prompt]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPrompt(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
            <span className="text-sm font-bold">V2P</span>
          </div>
          <span className="font-medium">Video to Prompt</span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
            aria-label="GitHub"
          >
            <GithubIcon size={18} />
          </a>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-12 sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Video to Prompt
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--muted-foreground)] sm:text-lg">
            Drop a video, get a ready-to-use prompt for Veo, Sora, Seedance, and
            any AI video generator. Powered by Gemini, free, open source.
          </p>
        </div>

        <div className="mt-12 w-full max-w-2xl">
          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-12 text-center transition hover:border-[var(--accent)]/60 hover:bg-[var(--muted)]/70"
            >
              <Upload size={32} className="text-[var(--muted-foreground)]" />
              <p className="mt-4 text-base font-medium">
                Drop a video here, or click to choose
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                MP4, MOV, WebM and others — up to 2 GB
              </p>
            </button>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/60 p-4">
              <div className="flex items-start gap-4">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    className="aspect-video w-40 shrink-0 rounded-lg bg-black object-contain"
                    muted
                    playsInline
                    controls
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {formatBytes(file.size)} · {file.type || "video/*"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Working…
                        </>
                      ) : prompt ? (
                        <>
                          <RefreshCw size={14} /> Regenerate
                        </>
                      ) : (
                        "Generate Prompt"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-white/5 hover:text-[var(--foreground)] disabled:opacity-60"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>

              {progress && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  {stageLabel(progress)}
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          {hydrated && !apiKey && !file && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              <span className="text-amber-200">
                You&apos;ll need a free Gemini API key to generate prompts.{" "}
              </span>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="font-medium text-amber-100 underline-offset-2 hover:underline"
              >
                Add it in Settings
              </button>
            </div>
          )}

          {prompt && (
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Your prompt
                </h3>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-[var(--success)]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                {prompt}
              </p>
              <a
                href={seegenLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
              >
                Generate this video on Seegen.ai →
              </a>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Opens in a new tab with your prompt pre-filled.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-[var(--muted-foreground)] sm:flex-row">
        <p>Open source · MIT</p>
        <div className="flex items-center gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)]"
          >
            GitHub
          </a>
          <span>Powered by Google Gemini</span>
        </div>
      </footer>

      <ApiKeyDialog
        open={settingsOpen}
        initialApiKey={apiKey}
        initialModel={model}
        onClose={() => setSettingsOpen(false)}
        onSave={(k, m) => {
          saveApiKey(k);
          saveModel(m);
          setApiKey(k);
          setModel(m);
          setSettingsOpen(false);
        }}
      />
    </div>
  );
}
