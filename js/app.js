import { getInitialData, saveSettings } from './storage.js';
import { drawChart } from './chart.js';

let { players, mechanics } = getInitialData();
let selectedPlayers = new Set();
let selectedMechanic = null;

// Track the native file handle for direct disk overwrites (Edge / Chrome / Opera)
let fileHandle = null; 
let masterFileContent = '';

const charButtonsElem = document.getElementById('charButtons');
const mechButtonsElem = document.getElementById('mechButtons');
const logTextarea = document.getElementById('logTextarea');
const wipeChartCanvas = document.getElementById('wipeChart');
const fileInput = document.getElementById('fileInput');
const statusText = document.getElementById('statusText');

function renderChips() {
  charButtonsElem.replaceChildren(...players.map(name => {
    const btn = document.createElement('button');
    btn.className = `chip ${selectedPlayers.has(name) ? 'selected-char' : ''}`;
    btn.textContent = name;
    btn.dataset.name = name;
    return btn;
  }));

  mechButtonsElem.replaceChildren(...mechanics.map(name => {
    const btn = document.createElement('button');
    btn.className = `chip ${selectedMechanic === name ? 'selected-mech' : ''}`;
    btn.textContent = name;
    btn.dataset.name = name;
    return btn;
  }));
}

function updateGraph() {
  drawChart(logTextarea.value, wipeChartCanvas);
}

// Chip Event Delegation
charButtonsElem.addEventListener('click', (e) => {
  const name = e.target.dataset.name;
  if (!name) return;

  selectedPlayers.has(name) ? selectedPlayers.delete(name) : selectedPlayers.add(name);
  renderChips();
});

mechButtonsElem.addEventListener('click', (e) => {
  const name = e.target.dataset.name;
  if (!name) return;

  selectedMechanic = selectedMechanic === name ? null : name;
  renderChips();
});

// Controls
document.getElementById('addCharBtn').addEventListener('click', () => {
  const input = document.getElementById('customCharInput');
  const name = input.value.trim();
  if (name && !players.includes(name)) {
    players.push(name);
    saveSettings(players, mechanics);
    renderChips();
    input.value = '';
  }
});

document.getElementById('removeCharBtn').addEventListener('click', () => {
  if (!selectedPlayers.size) return;
  players = players.filter(p => !selectedPlayers.has(p));
  selectedPlayers.clear();
  saveSettings(players, mechanics);
  renderChips();
});

document.getElementById('addMechBtn').addEventListener('click', () => {
  const input = document.getElementById('customMechInput');
  const name = input.value.trim();
  if (name && !mechanics.includes(name)) {
    mechanics.push(name);
    mechanics.sort();
    saveSettings(players, mechanics);
    renderChips();
    input.value = '';
  }
});

document.getElementById('removeMechBtn').addEventListener('click', () => {
  if (!selectedMechanic) return;
  mechanics = mechanics.filter(m => m !== selectedMechanic);
  selectedMechanic = null;
  saveSettings(players, mechanics);
  renderChips();
});

document.getElementById('addLogBtn').addEventListener('click', () => {
  if (!selectedPlayers.size || !selectedMechanic) {
    alert('Please select at least one player and a mechanic.');
    return;
  }

  const entry = `${Array.from(selectedPlayers).join('/')}: ${selectedMechanic}`;
  logTextarea.value = logTextarea.value.trim() 
    ? `${logTextarea.value.trim()}\n${entry}` 
    : entry;

  selectedPlayers.clear();
  selectedMechanic = null;
  renderChips();
  updateGraph();
});

document.getElementById('shareSettingsBtn').addEventListener('click', async () => {
  const payload = { players, mechanics };
  const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(JSON.stringify(payload))}`;
  
  try {
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard.');
  } catch {
    prompt('Copy URL:', url);
  }
});

// File I/O (Supports File System Access API in MS Edge / Chromium)
document.getElementById('loadLogBtn').addEventListener('click', async () => {
  if ('showOpenFilePicker' in window) {
    try {
      [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }]
      });
      const file = await fileHandle.getFile();
      masterFileContent = await file.text();
      statusText.textContent = `Linked File: ${file.name}`;
    } catch {
      // User cancelled picker
    }
  } else {
    // Firefox / Safari fallback
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    masterFileContent = event.target.result;
    statusText.textContent = `Linked File: ${file.name}`;
  };
  reader.readAsText(file);
});

document.getElementById('endSessionBtn').addEventListener('click', async () => {
  const currentSession = logTextarea.value.trim();
  if (!currentSession) return;

  const separator = '-----------------------------------------------------------';
  let existingText = masterFileContent;

  // If a handle exists, fetch fresh disk content before appending
  if (fileHandle) {
    try {
      const diskFile = await fileHandle.getFile();
      existingText = await diskFile.text();
    } catch {
      // Keep existing memory copy if reading fails
    }
  }

  const fullContent = existingText.trim()
    ? `${existingText.trim()}\n${separator}\n${currentSession}`
    : currentSession;

  // Direct Overwrite using Native File System API (Edge/Chrome)
  if ('showSaveFilePicker' in window || fileHandle) {
    try {
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: 'wipe_log.txt',
          types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }]
        });
      }

      const writable = await fileHandle.createWritable();
      await writable.write(fullContent);
      await writable.close();

      const diskFile = await fileHandle.getFile();
      statusText.textContent = `Linked File: ${diskFile.name}`;
      masterFileContent = fullContent;
      logTextarea.value = '';
      updateGraph();
      alert('Session successfully appended and saved directly to disk!');
      return;
    } catch {
      // Fallback if user cancels save prompt
      return;
    }
  }

  // Fallback anchor download for unsupported browsers
  const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = 'wipe_log.txt';
  downloadLink.click();

  URL.revokeObjectURL(downloadLink.href);
  logTextarea.value = '';
  masterFileContent = fullContent;
  updateGraph();
});

logTextarea.addEventListener('input', updateGraph);

// Init
renderChips();
updateGraph();
