import { getInitialData, saveSettings } from './storage.js';
import { drawChart } from './chart.js';

let { players, mechanics } = getInitialData();
let selectedPlayers = new Set();
let selectedMechanic = null;
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

// File I/O
document.getElementById('loadLogBtn').addEventListener('click', () => fileInput.click());

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

document.getElementById('endSessionBtn').addEventListener('click', () => {
  const currentSession = logTextarea.value.trim();
  if (!currentSession) return;

  const separator = '-----------------------------------------------------------';
  const fullContent = masterFileContent.trim()
    ? `${masterFileContent.trim()}\n${separator}\n${currentSession}`
    : currentSession;

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
