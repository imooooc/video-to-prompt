"use client";

import {
  FileState,
  GoogleGenAI,
  MediaResolution,
  createPartFromUri,
  createUserContent,
} from "@google/genai";
import { VIDEO_TO_PROMPT_INSTRUCTION } from "./prompt-template";

export type ProgressStage =
  | { stage: "uploading" }
  | { stage: "processing" }
  | { stage: "generating" }
  | { stage: "done" };

const INLINE_MAX_BYTES = 18 * 1024 * 1024; // 18MB safety threshold for inline base64
const SAMPLING_FPS = 2; // bump from default 1fps so quick cuts and motion aren't undersampled

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

async function pollUntilActive(ai: GoogleGenAI, name: string, timeoutMs = 5 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const f = await ai.files.get({ name });
    if (f.state === FileState.ACTIVE) return f;
    if (f.state === FileState.FAILED) {
      throw new Error("Gemini failed to process the uploaded video.");
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Timed out waiting for Gemini to process the video.");
}

function extractText(response: { text?: string | null }): string {
  const txt = response.text;
  if (!txt) throw new Error("Gemini returned an empty response.");
  return txt.trim();
}

export async function generatePromptFromVideo(opts: {
  file: File;
  apiKey: string;
  model: string;
  onProgress?: (s: ProgressStage) => void;
}): Promise<string> {
  const { file, apiKey, model, onProgress } = opts;
  if (!apiKey) throw new Error("Missing Gemini API key. Open Settings to add one.");

  const ai = new GoogleGenAI({ apiKey });

  if (file.size <= INLINE_MAX_BYTES) {
    onProgress?.({ stage: "generating" });
    const base64 = await fileToBase64(file);
    const result = await ai.models.generateContent({
      model,
      config: { mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: { mimeType: file.type || "video/mp4", data: base64 },
              videoMetadata: { fps: SAMPLING_FPS },
            },
            { text: VIDEO_TO_PROMPT_INSTRUCTION },
          ],
        },
      ],
    });
    onProgress?.({ stage: "done" });
    return extractText(result);
  }

  onProgress?.({ stage: "uploading" });
  const uploaded = await ai.files.upload({
    file,
    config: { mimeType: file.type || "video/mp4" },
  });

  onProgress?.({ stage: "processing" });
  const name = uploaded.name;
  if (!name) throw new Error("Upload returned no file name.");
  const ready = await pollUntilActive(ai, name);
  if (!ready.uri || !ready.mimeType) {
    throw new Error("Uploaded file is missing uri or mimeType.");
  }

  const videoPart = createPartFromUri(ready.uri, ready.mimeType);
  videoPart.videoMetadata = { fps: SAMPLING_FPS };

  onProgress?.({ stage: "generating" });
  const result = await ai.models.generateContent({
    model,
    config: { mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH },
    contents: createUserContent([videoPart, VIDEO_TO_PROMPT_INSTRUCTION]),
  });
  onProgress?.({ stage: "done" });
  return extractText(result);
}
