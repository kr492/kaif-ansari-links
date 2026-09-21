/**
 * Optional backend for the Kaif Ansari link page.
 *
 * The page itself (index.html, css/, js/, assets/) is a static site
 * and works perfectly without this server — that's the whole point of
 * keeping it at the repo root: drop the repo onto GitHub Pages,
 * Netlify, or Vercel and it just works, zero config.
 *
 * This server is an optional add-on for when you self-host on a
 * Node-capable platform (Render, Railway, Fly.io, a VPS) and want
 * first-party click analytics instead of a third-party dashboard.
 *
 * Routes:
 *   GET  /                → serves index.html and its assets
 *   POST /api/click       → body: { id, ts } — increments a counter
 *   GET  /api/stats       → returns current click counts as JSON
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = __dirname;
const DATA_FILE = path.join(__dirname, 'analytics.json');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// --- tiny JSON-file "database" for click counts -------------------
function readAnalytics() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    return { counts: {}, events: [] };
  }
}

function writeAnalytics(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post('/api/click', (req, res) => {
  const { id, ts } = req.body || {};

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "id" field' });
  }

  const data = readAnalytics();
  data.counts[id] = (data.counts[id] || 0) + 1;

  // Keep only the most recent 500 raw events so the file doesn't grow forever
  data.events.push({ id, ts: ts || Date.now() });
  if (data.events.length > 500) {
    data.events = data.events.slice(-500);
  }

  writeAnalytics(data);
  res.status(204).end();
});

app.get('/api/stats', (req, res) => {
  const data = readAnalytics();
  res.json(data.counts);
});

app.listen(PORT, () => {
  console.log(`Kaif's link page is running at http://localhost:${PORT}`);
});
