// UI logic for plagiarism checker — My Ultra Tools
const body = document.getElementById('body');
const card = document.getElementById('card');
const toggle = document.getElementById('themeToggle');
const ta = document.getElementById('text');
const wordCount = document.getElementById('wordCount');
const langInfo = document.getElementById('langInfo');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const results = document.getElementById('results');

const MAX_WORDS = 10000;
(function initTheme(){
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
})();
toggle.addEventListener('click', () => {
  const next = (localStorage.getItem('theme') || 'light') === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', next);
  applyTheme(next);
});
function applyTheme(t){
  const dark = t === 'dark';
  body.className = 'min-h-screen ' + (dark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900') + ' transition-colors duration-200';
  card.className = (dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900') + ' rounded-2xl shadow p-4 sm:p-6 space-y-4 fade-in';
}

function countWords(s){ return (s.trim().match(/\S+/g) || []).length; }
function enforceLimit(){
  const words = ta.value.split(/\s+/);
  if(words.length > MAX_WORDS){
    ta.value = words.slice(0, MAX_WORDS).join(' ');
  }
  wordCount.textContent = countWords(ta.value) + ' / ' + MAX_WORDS;
}
ta.addEventListener('input', enforceLimit);
enforceLimit();

// Lightweight client hint for RTL scripts
function detectLangClient(text){
  if(!text) return '—';
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic/Persian/Urdu (RTL)';
  if (/[\u0400-\u04FF]/.test(text)) return 'Cyrillic';
  return 'Unknown';
}
ta.addEventListener('input', ()=> {
  langInfo.textContent = detectLangClient(ta.value);
});

clearBtn.addEventListener('click', ()=>{
  ta.value=''; enforceLimit(); results.classList.add('hidden'); results.innerHTML=''; langInfo.textContent='—';
});
sampleBtn.addEventListener('click', ()=>{
  const demo = "This is a sample sentence. This is a sample sentence. Another unique sentence appears here!";
  ta.value = demo;
  enforceLimit();
  langInfo.textContent = detectLangClient(demo);
});

checkBtn.addEventListener('click', async ()=>{
  const text = ta.value.trim();
  if(!text){ alert('Please enter some text.'); return; }
  checkBtn.disabled = true; checkBtn.textContent = 'Checking...';
  try{
    const r = await fetch('/api/check', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text })
    });
    const data = await r.json();
    if(data.error){ alert(data.error); return; }
    renderResults(data);
  }catch(e){
    alert('Error: ' + e.message);
  }finally{
    checkBtn.disabled = false; checkBtn.textContent = 'Check Plagiarism';
  }
});

function renderResults(data){
  results.classList.remove('hidden');
  const { language, totalWords, uniquePercent, duplicatePercent, findings } = data;
  const scoreColor = duplicatePercent > 30 ? 'text-red-500' : duplicatePercent > 10 ? 'text-yellow-500' : 'text-green-500';

  const rows = (findings||[]).map((f,i)=>`
    <tr class="border-b">
      <td class="p-2">${i+1}</td>
      <td class="p-2">${f.type}</td>
      <td class="p-2">${f.similarity}%</td>
      <td class="p-2">${escapeHtml(f.snippet)}</td>
      <td class="p-2">${f.source ? '<a href="'+f.source+'" target="_blank" rel="nofollow">Open</a>' : '-'}</td>
    </tr>
  `).join('');

  results.innerHTML = `
    <div class="${body.classList.contains('bg-gray-900') ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 class="text-xl font-semibold">Results</h2>
          <p class="text-sm opacity-80">Language: <strong>${language}</strong> • Words: <strong>${totalWords}</strong></p>
        </div>
        <div class="text-right">
          <div class="text-sm opacity-80">Uniqueness</div>
          <div class="text-2xl font-bold ${scoreColor}">${uniquePercent}%</div>
        </div>
      </div>

      <div class="mt-4 overflow-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b font-semibold">
              <th class="p-2 text-left">#</th>
              <th class="p-2 text-left">Type</th>
              <th class="p-2 text-left">Match</th>
              <th class="p-2 text-left">Snippet</th>
              <th class="p-2 text-left">Source</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td class="p-2" colspan="5">No significant duplicates found in local checks.</td></tr>'}</tbody>
        </table>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <form method="POST" action="/api/export/pdf" target="_blank">
          <input type="hidden" name="payload" value='${JSON.stringify(data).replace(/'/g, '&apos;')}'>
          <button class="px-4 py-2 rounded-xl border shadow-sm">Export PDF</button>
        </form>
        <form method="POST" action="/api/export/csv" target="_blank">
          <input type="hidden" name="payload" value='${JSON.stringify(data).replace(/'/g, '&apos;')}'>
          <button class="px-4 py-2 rounded-xl border shadow-sm">Export CSV</button>
        </form>
      </div>
      <p class="mt-3 text-xs opacity-70">Tip: Connect a web plagiarism provider in the backend to detect matches across the internet.</p>
    </div>
  `;
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
