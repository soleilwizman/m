# Tubestack

A tiny reader that turns any YouTube video into a quiet, Substack-style page.
Paste a YouTube URL, and Tubestack fetches the transcript, groups it into
paragraphs, and lays it out in long-form serif typography. Every paragraph is
timestamped and links back to the exact moment in the source video.

## Run locally

Requires Node 18+.

```bash
npm install
npm start
```

Then open http://localhost:3000.

## How it works

- `server.js` — Express app. `POST /api/transcript` takes a YouTube URL,
  resolves the video ID, pulls captions via `youtube-transcript`, fetches
  title/author/thumbnail via YouTube's oEmbed endpoint, then groups segments
  into readable paragraphs.
- `public/` — Static frontend. Landing page with a single URL input, then a
  Substack-flavored article view (drop cap, generous serif body, timestamp
  pills inline with each paragraph).

## Notes

- Tubestack only works for videos that have captions enabled (auto-generated
  captions count). Private, region-locked, or caption-disabled videos return
  a friendly error.
- This is a reader for publicly available captions — no scraping or
  re-uploading of video content.
