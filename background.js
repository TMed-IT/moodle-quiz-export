chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'copy-quiz-table') return;
  
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
  
    chrome.tabs.sendMessage(tab.id, { action: 'COPY_QUIZ_TABLE' });
  });
  