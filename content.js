(() => {
    function addFloatingButton() {
      if (document.getElementById('mqee-fab')) return;
  
      const btn = document.createElement('button');
      btn.id = 'mqee-fab';
      btn.title = 'Alt+Shift+Q to copy';
      Object.assign(btn.style, {
        position: 'fixed',
        right: '24px',
        bottom: '80px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: 'none',
        background: '#1976d2',
        color: '#fff',
        fontSize: '24px',
        cursor: 'pointer',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
      });
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M16 4h2a2 2 0 0 1 2 2v4"/><path d="M21 14H11"/><path d="m15 10-4 4 4 4"/></svg>`;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.addEventListener('click', copyQuizTable);
      document.body.appendChild(btn);
    }
  
    function parseQuiz() {
      const questions = Array.from(document.querySelectorAll('div.que'));
      if (!questions.length) {
        throw new Error('Question block not found.');
      }
  
      const rows = [];
      let maxOptions = 0;
  
      const indexToLabel = i => String.fromCharCode(97 + i); // 0 -> a, 1 -> b
  
      for (const q of questions) {
        const qtext = q.querySelector('.qtext')?.innerText.trim() ?? '';
  
        const optionNodes = q.querySelectorAll('.d-flex.w-auto[id] .flex-fill.ml-1');
        const options = Array.from(optionNodes, n => n.innerText.trim());
  
        const ra = q.querySelector('.rightanswer')?.innerText.trim() ?? '';
        const afterColon = ra.split(':').slice(1).join(':').trim();
        const correctTexts = afterColon
          ? afterColon.split(',').map(t => t.trim())
          : [];
  
        const correctLabels = options.reduce((acc, opt, idx) => {
          if (correctTexts.includes(opt)) acc.push(indexToLabel(idx));
          return acc;
        }, []);
  
        if (correctLabels.length === 0 && /correct answer is 'true'/i.test(ra)) {
          options.length = 0;
          options.push('はい', 'いいえ');
          correctLabels.push('はい');
        } else if (correctLabels.length === 0 && /correct answer is 'false'/i.test(ra)) {
          options.length = 0;
          options.push('いいえ', 'はい');
          correctLabels.push('いいえ');
        }
  
        maxOptions = Math.max(maxOptions, options.length);
        rows.push([qtext, correctLabels.length, ...options]);
      }
  
      return { rows, maxOptions };
    }
  
    async function copyQuizTable() {
      try {
        const { rows, maxOptions } = parseQuiz();
  
        const headers = ['問題', '解答数'];
        for (let i = 0; i < maxOptions; ++i) headers.push(`選択肢${String.fromCharCode(97 + i)}`);
  
        const tsv = [headers, ...rows].map(r => r.join('\t')).join('\n');
  
        const htmlRows = [headers, ...rows].map(
          r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`
        ).join('');
        const html = `<table>${htmlRows}</table>`;
  
        const blobText = new Blob([tsv], { type: 'text/plain' });
        const blobHtml = new Blob([html], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': blobText,
            'text/html': blobHtml
          })
        ]);
  
        toast('Quiz copied to clipboard.');
      } catch (err) {
        console.error(err);
        toast('Copy failed: ' + err.message);
      }
    }
  
    function toast(msg) {
      const n = document.createElement('div');
      n.textContent = msg;
      Object.assign(n.style, {
        position: 'fixed',
        left: '50%',
        bottom: '80px',
        transform: 'translateX(-50%)',
        background: '#323232',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: '4px',
        zIndex: 10000,
        opacity: '0',
        transition: 'opacity .3s'
      });
      document.body.appendChild(n);
      requestAnimationFrame(() => (n.style.opacity = '1'));
      setTimeout(() => {
        n.style.opacity = '0';
        setTimeout(() => n.remove(), 300);
      }, 2500);
    }
  
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.action === 'COPY_QUIZ_TABLE') copyQuizTable();
      sendResponse?.();
    });
  
    addFloatingButton();
  })();
  