# Video to Prompt

> Reverse-engineer any video into a production-ready prompt for Veo, Sora, Seedance, Kling, Runway, and any AI video generator.

Drop in a reference clip — a saved TikTok, an old shot of yours, a movie scene — and get back a structured, time-coded prompt that captures the action, camera moves, dialogue, and look. Powered by Google Gemini.

The whole pipeline runs in your browser. Your video goes directly from your laptop to Google with your own API key; nothing else is in the path.

## Why

Video models like Veo 3, Sora 2, and Seedance 2.0 are getting good fast. The bottleneck has shifted — the hard part is no longer the rendering, it's writing a prompt that actually describes a scene the way a director would. If you can break a 12-second clip into four beats with the right camera language and the dialogue intact, you can recreate or remix anything you've seen. This tool does that work for you.

## Features

- Drag-and-drop upload, MP4 / MOV / WebM / AVI / WMV / 3GP / MKV, up to 2 GB
- Bring-your-own [Gemini API key](https://aistudio.google.com/apikey), stored only in your browser's `localStorage` — no account, no signup, no server
- Time-coded shot list output (`0–3s: …`, `3–7s: …`) so you can see exactly how the model perceives each beat
- Dialogue captured verbatim inside the matching beat, never paraphrased, never split across two lines
- Switch between `gemini-2.5-pro` (best for video) and `gemini-2.5-flash` (faster)
- One-click handoff to [Seegen.ai](https://seegen.ai) to actually render the video, or copy the prompt anywhere

## Run locally

```bash
git clone https://github.com/imooooc/video-to-prompt.git
cd video-to-prompt
pnpm install
pnpm dev
```

Open <http://localhost:3000>, click the gear icon, paste your Gemini API key, drop a video.

## How it works

A few engineering choices that materially affect output quality:

1. **2 FPS sampling.** Gemini's video API defaults to 1 frame per second, which silently swallows quick-cut montages — whole shots can disappear between sample points. We bump to 2 FPS via `Part.videoMetadata.fps`, doubling token cost in exchange for shot-boundary recall.
2. **`MEDIA_RESOLUTION_HIGH`.** Each sampled frame gets roughly twice the visual tokens of the default tier, which is the difference between "a person in a courtroom" and "a stern judge in a curly wig slamming a gavel."
3. **Structured system prompt.** The model is instructed to emit integer-second time codes (no decimal artifacts of the sampling rate), aim for 3–6 beats total with sub-second inserts merged into neighbors, and place every spoken line verbatim in double quotes inside the matching beat. The full prompt is in [`app/lib/prompt-template.ts`](./app/lib/prompt-template.ts).
4. **Two upload paths.** Videos under 18 MB are sent inline as base64 in a single round trip. Larger videos go through Gemini's [Files API](https://ai.google.dev/gemini-api/docs/files) — uploaded, polled until the file enters the `ACTIVE` state, then referenced by URI.

## Stack

- [Next.js](https://nextjs.org/) (App Router) and React
- TypeScript, Tailwind CSS
- [`@google/genai`](https://www.npmjs.com/package/@google/genai)

The build is fully static. `pnpm build` produces a deployable bundle for Vercel, Cloudflare Pages, Netlify, GitHub Pages, or any static host.

## Roadmap

- Examples gallery — sample clips you can try without uploading anything
- Per-target prompt presets (Seedance, Veo, and Sora each respond to slightly different phrasing)
- Localized UI (zh, ja, ko)
- Browser extension build
- Embeddable widget for video editors

Issues and pull requests welcome — particularly around prompt-template tuning. If you find a clip that produces a poor prompt, open an issue with the file and we'll iterate on the template.

## License

MIT, see [LICENSE](./LICENSE).
