const express = require('express');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function extractVideoId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (['embed', 'shorts', 'live', 'v'].includes(parts[0]) && parts[1]) {
      return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
    }
  }

  return null;
}

function formatTimestamp(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function decodeEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function groupIntoParagraphs(segments) {
  const paragraphs = [];
  let buffer = [];
  let bufferStart = 0;
  let bufferWordCount = 0;
  const TARGET_WORDS = 70;

  const flush = () => {
    if (!buffer.length) return;
    const text = buffer
      .map((s) => decodeEntities(s.text).replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' ');
    if (text) {
      paragraphs.push({ start: bufferStart, text });
    }
    buffer = [];
    bufferWordCount = 0;
  };

  segments.forEach((seg) => {
    if (!buffer.length) bufferStart = seg.offset || 0;
    buffer.push(seg);
    const words = decodeEntities(seg.text).trim().split(/\s+/).filter(Boolean).length;
    bufferWordCount += words;
    const endsSentence = /[.!?]["']?\s*$/.test(seg.text.trim());
    if (bufferWordCount >= TARGET_WORDS && endsSentence) {
      flush();
    } else if (bufferWordCount >= TARGET_WORDS * 1.8) {
      flush();
    }
  });
  flush();
  return paragraphs;
}

const ENGLISH_LANGS = ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU', 'en-IN'];

async function fetchEnglishTranscript(videoId) {
  let lastErr;
  for (const lang of ENGLISH_LANGS) {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      if (segments && segments.length) return segments;
    } catch (err) {
      lastErr = err;
    }
  }
  const err = new Error('NO_ENGLISH_TRANSCRIPT');
  err.cause = lastErr;
  throw err;
}

async function fetchOEmbed(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

app.post('/api/transcript', async (req, res) => {
  const { url } = req.body || {};
  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Could not parse a YouTube video ID from that input.' });
  }

  try {
    const [segments, meta] = await Promise.all([
      fetchEnglishTranscript(videoId),
      fetchOEmbed(videoId),
    ]);

    if (!segments || !segments.length) {
      return res.status(404).json({ error: 'No transcript found for this video.' });
    }

    const normalized = segments.map((s) => ({
      text: s.text,
      offset: typeof s.offset === 'number' ? (s.offset > 1000 ? s.offset / 1000 : s.offset) : 0,
      duration: typeof s.duration === 'number' ? (s.duration > 1000 ? s.duration / 1000 : s.duration) : 0,
    }));

    const paragraphs = groupIntoParagraphs(normalized).map((p) => ({
      timestamp: formatTimestamp(p.start),
      seconds: Math.floor(p.start),
      text: p.text,
    }));

    const totalSeconds = normalized.reduce((acc, s) => Math.max(acc, (s.offset || 0) + (s.duration || 0)), 0);
    const wordCount = paragraphs.reduce((acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length, 0);
    const readMinutes = Math.max(1, Math.round(wordCount / 220));

    res.json({
      videoId,
      title: meta?.title || 'Untitled video',
      author: meta?.author_name || 'Unknown channel',
      authorUrl: meta?.author_url || null,
      thumbnail: meta?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      durationSeconds: Math.round(totalSeconds),
      durationFormatted: formatTimestamp(totalSeconds),
      wordCount,
      readMinutes,
      paragraphs,
    });
  } catch (err) {
    const raw = err && err.message ? err.message : 'Failed to fetch transcript.';
    if (raw === 'NO_ENGLISH_TRANSCRIPT') {
      return res.status(404).json({ error: 'No English transcript is available for this video. Tubestack only reads English captions.' });
    }
    const message = raw.replace(/\[YoutubeTranscript\]\s*🚨?\s*/i, '').trim();
    if (/disabled|TranscriptsDisabled/i.test(message)) {
      return res.status(404).json({ error: 'This video has captions turned off, so there is no transcript to read.' });
    }
    if (/no longer available|unavailable|Could not find|video.*not exist/i.test(message)) {
      return res.status(404).json({ error: 'YouTube would not return a transcript for this video. It may be private, region-locked, or have captions disabled.' });
    }
    res.status(500).json({ error: message || 'Failed to fetch transcript.' });
  }
});

app.listen(PORT, () => {
  console.log(`Tubestack running on http://localhost:${PORT}`);
});
