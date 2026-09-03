// Default arrays are empty so you can build your roster and mechanics from scratch
const DEFAULT_PLAYERS = [];
const DEFAULT_MECHANICS = [];

export function getInitialData() {
  if (window.location.hash) {
    try {
      const hashData = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
      if (hashData.players && hashData.mechanics) {
        saveSettings(hashData.players, hashData.mechanics);
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {
      // Ignore bad hash
    }
  }

  const players = JSON.parse(localStorage.getItem('ffxiv_charList')) || DEFAULT_PLAYERS;
  const mechanics = JSON.parse(localStorage.getItem('ffxiv_mechList')) || DEFAULT_MECHANICS;

  return { players, mechanics };
}

export function saveSettings(players, mechanics) {
  localStorage.setItem('ffxiv_charList', JSON.stringify(players));
  localStorage.setItem('ffxiv_mechList', JSON.stringify(mechanics));
}
