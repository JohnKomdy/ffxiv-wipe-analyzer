const DEFAULT_PLAYERS = ["Nafi", "Valuri", "Rumpy", "Ventus", "Ven", "Rym", "Lily", "Reila", "PF1", "PF2", "Tanks", "DPS", "Healers"];
const DEFAULT_MECHANICS = [
  "Arrows", "Blackhole", "DC", "Damage Down", "Forsaken",
  "Graven 1", "Graven 2", "Graven 3", "Knockback", "Laser",
  "Limitcut", "Mit Miss", "Overkill", "Slap Happy", "Stomps",
  "Tankbuster", "Tethers"
];

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