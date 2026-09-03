let chartInstance = null;

function parseLog(text) {
  const parsed = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes(':') && !line.startsWith('---'))
    .map(line => {
      const [rawPlayers, rawMech] = line.split(':');
      return {
        players: rawPlayers.split('/').map(p => p.trim()).filter(Boolean),
        mechanic: rawMech ? rawMech.trim() : null
      };
    })
    .filter(entry => entry.players.length > 0 && entry.mechanic);

  if (parsed.length === 0) return { labels: [], datasets: [] };

  const mechanics = [...new Set(parsed.map(e => e.mechanic))];
  const playerTotals = {};
  const matrix = {};

  parsed.forEach(({ players, mechanic }) => {
    players.forEach(p => {
      playerTotals[p] = (playerTotals[p] || 0) + 1;
      matrix[p] = matrix[p] || {};
      matrix[p][mechanic] = (matrix[p][mechanic] || 0) + 1;
    });
  });

  const labels = Object.keys(playerTotals).sort((a, b) => playerTotals[b] - playerTotals[a] || a.localeCompare(b));

  const datasets = mechanics.map(mech => ({
    label: mech,
    data: labels.map(player => matrix[player][mech] || 0),
    maxBarThickness: 24,
    barPercentage: 0.9,
    categoryPercentage: 0.9
  }));

  return { labels, datasets };
}

export function drawChart(logText, canvasElem) {
  const { labels, datasets } = parseLog(logText);

  // Dynamically shrink the canvas container so bars stack tightly at the top
  const container = canvasElem.parentElement;
  if (container) {
    const rowHeight = 36;
    const minHeight = 400;
    const calculatedHeight = Math.max(labels.length * rowHeight + 60, minHeight);
    container.style.height = labels.length > 0 ? `${calculatedHeight}px` : '400px';
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvasElem, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 10
        }
      },
      scales: {
        x: {
          stacked: true,
          position: 'top',
          ticks: { stepSize: 1, color: '#a0a0b0' },
          grid: { color: '#33333d' }
        },
        y: {
          stacked: true,
          ticks: { 
            color: '#e1e1e6',
            font: {
              size: 15,
              weight: 'bold'
            }
          },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#e1e1e6', boxWidth: 12 }
        }
      }
    }
  });
}
