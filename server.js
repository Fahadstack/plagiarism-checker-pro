// Plagiarism Checker — My Ultra Tools
// Advanced UI + SEO + 10k limit + 50+ languages + PDF/CSV Export
// Ready for Render free hosting and Blogger iframe embedding
const express = require("express");
const path = require("path");
const app = express();

// Static files serve karna (index.html, script.js, css, etc.)
app.use(express.static(path.join(__dirname)));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Render ka PORT use karna (important)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const franc = require('franc');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'));

// Helpers
function words(text){
  return (text.toLowerCase().match(/\p{L}+/gu) || []);
}
function splitSentences(text){
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?۔؟])\s+/) // include Urdu/Arabic punctuation
    .map(s => s.trim())
    .filter(Boolean);
}
function shingles(tokens, k=3){
  const out = new Set();
  for(let i=0;i<=tokens.length-k;i++){
    out.add(tokens.slice(i, i+k).join(' '));
  }
  return out;
}
function jaccard(a, b){
  const inter = new Set([...a].filter(x => b.has(x)));
  const uni = new Set([...a, ...b]);
  return uni.size ? inter.size/uni.size : 0;
}

app.get('/health', (req,res)=> res.json({ ok: true }));

// API: Check
app.post('/api/check', async (req, res) => {
  try {
    const text = (req.body.text || '').toString();
    const totalWords = words(text).length;
    if(!text || !totalWords){
      return res.json({ error: 'Empty text', findings: [] });
    }
    if(totalWords > 10000){
      return res.json({ error: 'Word limit exceeded (10,000).', findings: [] });
    }

    // Language detection (50+ with franc; returns ISO 639-3 code)
    const langCode = franc(text, { minLength: 20 });
    const language = langCode === 'und' ? 'Unknown' : langCode;

    // Within-document duplicates + shingle overlaps
    const sents = splitSentences(text);
    const seen = new Map();
    const findings = [];
    sents.forEach((s, idx) => {
      const key = s.toLowerCase();
      const count = (seen.get(key) || 0) + 1;
      seen.set(key, count);
      if(count > 1){
        findings.push({ type: 'Within-Document Duplicate', index: idx, snippet: s, similarity: 100 });
      }
    });

    const sentShingles = sents.map(s => shingles(words(s)));
    for(let i=0;i<sentShingles.length;i++){
      for(let j=i+1;j<sentShingles.length;j++){
        const sim = Math.round(jaccard(sentShingles[i], sentShingles[j]) * 100);
        if(sim >= 70){
          findings.push({ type: 'High Overlap (3-gram)', index: j, snippet: sents[j], similarity: sim });
        }
      }
    }

    // TODO: External Web Check Provider (optional)
    // Example: integrate RapidAPI or Copyleaks here using your key
    // Push findings like: { type: 'Web Match', snippet, similarity, source }

    const duplicatePercent = Math.min(100, Math.round((findings.length / Math.max(1, sents.length)) * 100));
    const uniquePercent = Math.max(0, 100 - duplicatePercent);

    res.json({ language, totalWords, uniquePercent, duplicatePercent, findings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// API: Export PDF
app.post('/api/export/pdf', (req, res) => {
  let payload = req.body.payload || '';
  try { payload = JSON.parse(payload); } catch { payload = null; }
  if(!payload){ return res.status(400).send('Invalid payload'); }

  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="plagiarism-report.pdf"');
  doc.pipe(res);

  doc.fontSize(20).text('Plagiarism Report — My Ultra Tools');
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Language: ${payload.language}  |  Words: ${payload.totalWords}`);
  doc.text(`Uniqueness: ${payload.uniquePercent}%  |  Duplicate: ${payload.duplicatePercent}%`);
  doc.moveDown(1);
  doc.fontSize(13).text('Findings:', { underline: true });
  doc.moveDown(0.5);
  if((payload.findings||[]).length === 0){
    doc.text('No significant duplicates found.');
  } else {
    payload.findings.forEach((f, i) => {
      doc.text(`${i+1}. [${f.type}] Match: ${f.similarity}%`);
      doc.text(f.snippet);
      if(f.source){ doc.text(`Source: ${f.source}`); }
      doc.moveDown(0.5);
    });
  }
  doc.end();
});

// API: Export CSV
app.post('/api/export/csv', async (req, res) => {
  let payload = req.body.payload || '';
  try { payload = JSON.parse(payload); } catch { payload = null; }
  if(!payload){ return res.status(400).send('Invalid payload'); }

  const file = path.join(__dirname, `report_${Date.now()}.csv`);
  const csvWriter = createCsvWriter({ path: file, header: [
    {id: 'idx', title: 'Index'},
    {id: 'type', title: 'Type'},
    {id: 'similarity', title: 'Similarity'},
    {id: 'snippet', title: 'Snippet'},
    {id: 'source', title: 'Source'}
  ]});

  const rows = (payload.findings || []).map((f, i) => ({
    idx: i+1, type: f.type, similarity: f.similarity, snippet: f.snippet, source: f.source || ''
  }));
  await csvWriter.writeRecords(rows);
  res.download(file, 'plagiarism-report.csv', (err) => {
    if(err) console.error(err);
    fs.unlink(file, ()=>{});
  });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`My Ultra Tools Plagiarism Checker running on http://localhost:${PORT}`);
});
