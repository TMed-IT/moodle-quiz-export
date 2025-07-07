(() => {
    function addFloatingButton() {
      if (document.getElementById('mqee-fab')) return;
  
      const footerButton = document.evaluate('/html/body/div[2]/div[5]/footer/div[1]/button', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!footerButton) return;
  
      const btn = document.createElement('button');
      btn.id = 'mqee-fab';
      btn.title = 'Left click: Copy without headers\nRight click: Copy with headers';
  
      const footerRect = footerButton.getBoundingClientRect();
      Object.assign(btn.style, {
        position: 'fixed',
        right: `${window.innerWidth - footerRect.right - 5}px`,
        bottom: `${window.innerHeight - footerRect.top + 24}px`,
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: 'none',
        background: '#1976d2',
        color: '#fff',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
      });
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M16 4h2a2 2 0 0 1 2 2v4"/><path d="M21 14H11"/><path d="m15 10-4 4 4 4"/></svg>`;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.addEventListener('click', () => copyQuizTable(false));
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        copyQuizTable(true);
      });
      btn.addEventListener('dblclick', () => copyQuizTable(false));
      document.body.appendChild(btn);
    }
  
    function parseQuiz(includeHeaders = true) {
      const questions = Array.from(document.querySelectorAll('div.que'));
      console.log(questions);
      if (!questions.length) {
        throw new Error('Question block not found.');
      }
  
      const rows = [];
      let maxOptions = 0;
  
      for (const q of questions) {
        const qtext = q.querySelector('.qtext')?.innerText.trim() ?? '';
  
        const optionNodes = q.querySelector('.answer')?.querySelectorAll('div.r0, div.r1') ?? [];
        const options = Array.from(optionNodes, n => n.querySelector('div > div > div > div')?.innerText.trim());

        console.log(options);

        const ra = q.querySelector('.rightanswer')?.innerText.trim() ?? '';
        const afterColon = ra.split(':').slice(1).join(':').trim();
        const correctTexts = afterColon
          ? afterColon.split(',').map(t => t.trim())
          : [];

        console.log(correctTexts);

        options.sort((a, b) => a.localeCompare(b, 'ja'));
        
        const correctOptions = options.filter(opt => correctTexts.includes(opt));
        const incorrectOptions = options.filter(opt => !correctTexts.includes(opt));
        options.length = 0;
        options.push(...correctOptions, ...incorrectOptions);
  
        maxOptions = Math.max(maxOptions, options.length);
        rows.push([qtext, correctOptions.length, ...options]);
      }
  
      return { rows, maxOptions, includeHeaders };
    }
  
    async function copyQuizTable(includeHeaders = true) {
      try {
        const { rows, maxOptions } = parseQuiz(includeHeaders);
  
        const headers = ['問題', '正答数'];
        for (let i = 0; i < maxOptions; ++i) headers.push(`選択肢${String.fromCharCode(97 + i)}`);
  
        const dataToCopy = includeHeaders ? [headers, ...rows] : rows;
        const tsv = dataToCopy.map(r => r.join('\t')).join('\n');
  
        const htmlRows = dataToCopy.map(
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
  
        toast(`Quiz copied to clipboard${includeHeaders ? ' with headers' : ''}.`);
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
  