# Kaif Ansari — Link-in-Bio Page

A self-hosted alternative to Linktree: a personal links landing page (resume, GitHub, LinkedIn, Instagram, email) that you fully own — the code, the hosting, and, if you use the optional backend, your own click data.

Dark canvas, layered emerald/teal glow, frosted-glass link cards, with the resume link styled as the primary call to action.

## What's in the box

Everything the site needs lives at the **repo root**, on purpose — that's what lets you drop this straight onto GitHub Pages, Netlify, or Vercel with zero configuration.

```
kaif-ansari-links/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js              ← share panel, iframe preview modal, analytics ping
├── assets/
│   ├── profile.jpg            ← your photo
│   └── resume/
│       └── Md-Kaif-Raza-Ansari_Resume-v1.1.pdf
├── server.js                  ← optional Express backend (click analytics)
├── package.json
├── .gitignore
├── .nojekyll                  ← tells GitHub Pages to skip Jekyll processing
└── README.md                  ← you are here
```

## Do you need the backend?

**No, not for the page to work.** `index.html` is a complete, self-contained website — every link is a plain `<a href>`. Open it directly in a browser, or push the whole folder to a static host and it just works.

**Yes, if you want your own click analytics** — i.e. to see how many times each link was opened, instead of relying on a third-party dashboard. That's what `server.js` is for. It serves the same files *and* adds two endpoints:

| Route | Method | What it does |
|---|---|---|
| `/api/click` | `POST` | Body `{ "id": "github", "ts": 172... }` — increments that link's counter |
| `/api/stats` | `GET` | Returns current counts as JSON, e.g. `{"resume":12,"github":4}` |

Click counts are written to `analytics.json` (created automatically on first click; git-ignored so you never commit personal traffic data). This only runs on a Node-capable host — see below.

---

## Publish it — pick one

### Option 1: GitHub Pages (free, static only, most common choice)

1. Create a new **public** GitHub repo (e.g. `kaif-ansari-links`).
2. Push this folder to it:
   ```bash
   cd kaif-ansari-links
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/kr492/kaif-ansari-links.git
   git push -u origin main
   ```
3. On GitHub: go to the repo → **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)** → **Save**.
5. GitHub gives you a live URL in a minute or two, typically:
   `https://kr492.github.io/kaif-ansari-links/`
6. (Optional) Add a custom domain in the same Pages settings screen once you have one.

### Option 2: Netlify (free, drag-and-drop, fastest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole project folder onto the page.
3. Netlify uploads it and gives you a live `*.netlify.app` URL immediately — no account strictly required to try it, a free account to keep it.
4. (Optional) "Change site name" in Site settings for a nicer subdomain, or add a custom domain.

### Option 3: Vercel (free, connects to GitHub)

1. Push the repo to GitHub (see step 2 in Option 1).
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
3. Framework preset: **Other** (it's static — no build command needed).
4. Deploy. Vercel gives you a `*.vercel.app` URL and redeploys automatically on every push.

All three are free for a personal page like this. GitHub Pages is the simplest if you're already comfortable with Git; Netlify's drag-and-drop is the fastest if you just want it live right now.

### If you want the analytics backend live too

GitHub Pages/Netlify/Vercel (as used above) serve static files only — `server.js` won't run there. For that, deploy the whole project to a small Node host instead: **Render**, **Railway**, or **Fly.io** all have free tiers.
General steps (Render, as an example):
1. Push the repo to GitHub.
2. On Render: **New → Web Service** → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Render assigns a URL and sets `PORT` automatically — `server.js` already reads `process.env.PORT`, so no code changes needed.

---

## Local preview before you deploy

**Static only:** double-click `index.html`. Everything works except the analytics ping (it fails silently — expected and harmless without a backend).

**With the backend:**
```bash
npm install
npm start
```
Then open **http://localhost:3000**, and check counts anytime at **http://localhost:3000/api/stats**.

## Customizing

| To change… | Edit… |
|---|---|
| Name, role, tagline | `index.html` — inside `<div class="profile">` |
| Link URLs / labels / order | `index.html` — the `<ul class="link-list">` items and the `<nav class="social-row">` icons |
| Colors, glow, blur strength | `css/style.css` — variables at the top under `:root` |
| Photo | replace `assets/profile.jpg` (square image, ideally 400px+) |
| Resume | replace the PDF in `assets/resume/` and update the filename in `index.html` if you rename it |

No build step, no framework, no dependencies for the frontend — plain HTML/CSS/JS, so any text editor and a browser refresh is the whole workflow.

## Notes on the design

- Background is two layered, low-opacity radial glows (emerald + a secondary teal) over a diagonal dark gradient, plus a faint grain texture — that combination is what keeps the gradient looking smooth rather than banding, and keeps color visible down the whole page rather than just a spot at the top.
- Link cards, icon buttons, and the footer badge use real `backdrop-filter` blur — genuine frosted glass, not just a tinted background — so the glow behind them visibly bleeds through.
- The four social icons and the five link cards intentionally overlap (Instagram/GitHub/LinkedIn appear in both) — the icon row is for quick taps, the card list is the full menu, matching the original mockup's structure.
- "My Resume" is the only filled/accent card on purpose — it's the highest-value action for anyone landing on this page, so it gets the one bold visual treatment on an otherwise quiet page.
- The top-right button opens a floating share panel (copy link, native share sheet, and quick links to LinkedIn/WhatsApp/Telegram/X/Facebook/Mail) rather than the decorative back arrow from the mockup, since a real webpage already has browser back navigation.
- Icons are hand-drawn generic glyphs (camera, envelope, code brackets, etc.), not brand logo assets — kept deliberately simple and paired with text labels for clarity.

## License

Personal project — use and modify freely.
