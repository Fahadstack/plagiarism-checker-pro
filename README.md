# My Ultra Tools — Plagiarism Checker (Free Deploy on Render)

Advanced, SEO-friendly plagiarism checker with responsive UI, dark mode, 10,000-word limit, 50+ language detection, and PDF/CSV export. Designed to be **embedded in Blogger** via iframe.

## Features
- Large textarea (SmallSEOTools-style), smooth animations
- 10,000 words per check (client + server enforced)
- 50+ language detection (franc)
- Dark/Light theme with persistence
- PDF and CSV export
- SEO meta, OpenGraph, JSON-LD schema
- Mobile-first responsive (Tailwind CDN)
- Footer: **My Ultra Tools | All Rights Reserved**

---

## A→Z Free Setup (GitHub + Render)

### 1) Create GitHub Repo (account: `fahad-stack`)
- New repo name: `plagiarism-checker`
- Upload all files from this folder (drag & drop on github.com works).

### 2) Deploy on Render (free)
- Sign up: https://render.com
- Click **New +** → **Web Service**
- Connect GitHub → select `fahad-stack/plagiarism-checker`
- Environment: **Node**
- Build Command: `npm install`
- Start Command: `node server.js`
- Region: Asia (Singapore)
- Click **Deploy** → you’ll get a URL like:
  `https://plagiarism-checker.onrender.com`

### 3) Embed in Blogger
- Blogger → **Pages** → New Page → switch to **HTML** view.
- Paste:
```html
<iframe src="https://plagiarism-checker.onrender.com" width="100%" height="900" style="border:none; border-radius:12px;"></iframe>
```
- Publish.

---

## Optional: Connect a Web Plagiarism API
Edit `server.js` in `/api/check` route and call your provider (RapidAPI/Copyleaks). Push findings like:
```js
findings.push({ type: 'Web Match', snippet, similarity: 92, source: 'https://example.com' });
```
Recalculate the duplicate score if needed.

---

## Run Locally
```bash
npm install
npm start
# open http://localhost:3000
```

---

## Notes
- This project does **local** duplicate detection (within text + shingle overlap).
- Web-wide detection needs an external provider/API (optional).
- Free hosting on Render generally stays online (free tier).

(c) My Ultra Tools | All Rights Reserved
