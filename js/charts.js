let chartP = null;

function getRegimeColor(Re) {
  if (Re < CONSTANTS.RE_LAMINAR) {
    return { name: 'laminar', label: 'Ламинарное', color: 'rgba(22,163,74,.18)', text: '#166534' };
  }
  if (Re < CONSTANTS.RE_TRANSITION_END) {
    return { name: 'transitional', label: 'Переходное', color: 'rgba(245,158,11,.18)', text: '#92400e' };
  }
  return { name: 'turbulent', label: 'Турбулентное', color: 'rgba(239,68,68,.18)', text: '#991b1b' };
}

function buildRegimeAnnotations(R, cfg) {
  const segments = [];
  segments.push({ start: 0, end: cfg.L0, Re: reynolds(R.Q_total, cfg) });
  for (let i = 0; i < cfg.N - 1; i++) {
    segments.push({ start: R.x[i], end: R.x[i + 1], Re: reynolds(R.Qs[i], cfg) });
  }
  segments.push({ start: R.x[cfg.N - 1], end: cfg.L_total, Re: reynolds(R.Qs[cfg.N - 1], cfg) });

  let current = null;
  const regimes = [];
  for (const seg of segments) {
    const r = getRegimeColor(seg.Re);
    if (!current || current.name !== r.name) {
      if (current) regimes.push(current);
      current = { ...r, xMin: seg.start, xMax: seg.end };
    } else {
      current.xMax = seg.end;
    }
  }
  if (current) regimes.push(current);

  const annotations = {};
  regimes.forEach((r, i) => {
    annotations[`regime_${i}`] = {
      type: 'box',
      xMin: r.xMin,
      xMax: r.xMax,
      yMin: 0,
      backgroundColor: r.color,
      borderWidth: 0,
      drawTime: 'beforeDatasetsDraw'
    };
  });
  return annotations;
}

function renderCharts(R, cfg) {
  const xMin = R.x[0];
  const xMax = R.x[R.x.length - 1];

  const pointsP = R.x.map((xi, i) => ({ x: xi, y: paToBar(R.P[i]) }));
  const pointColors = R.P.map(p => paToBar(p) < cfg.nozzle_min_pressure_bar ? '#dc2626' : '#2563eb');
  const pointBgColors = R.P.map(p => paToBar(p) < cfg.nozzle_min_pressure_bar ? 'rgba(220, 38, 38, 0.35)' : 'rgba(37, 99, 235, 0.35)');

  const annotations = buildRegimeAnnotations(R, cfg);

  // Порог минимального давления корректного распыления
  annotations.minPressureLine = {
    type: 'line',
    yMin: cfg.nozzle_min_pressure_bar,
    yMax: cfg.nozzle_min_pressure_bar,
    borderColor: 'rgba(220, 38, 38, 0.7)',
    borderWidth: 1,
    borderDash: [5, 5],
    drawTime: 'beforeDatasetsDraw',
  };

  if (chartP) chartP.destroy();

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: { display: false },
      annotation: { annotations },
      tooltip: {
        backgroundColor: 'rgba(26,26,46,0.9)',
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: xMin,
        max: xMax,
        title: { display: true, text: 'Расстояние от источника, м', font: { size: 12, weight: '500' } },
        grid: { color: '#f0f0f0' }
      },
      y: {
        grid: { color: '#f0f0f0' },
        beginAtZero: true,
        max: paToBar(cfg.Psource) + 20,
      }
    }
  };

  chartP = new Chart(document.getElementById('chartP'), {
    type: 'line',
    data: {
      datasets: [{
        label: 'Давление, бар',
        data: pointsP,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.12)',
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: pointBgColors,
        pointBorderColor: pointColors,
        pointBorderWidth: 2,
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, title: { display: true, text: 'P, бар', font: { size: 12, weight: '500' } } }
      },
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          ...commonOptions.plugins.tooltip,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              return `Форсунка №${idx + 1}`;
            },
            label: (item) => {
              const idx = item.dataIndex;
              const pVal = Math.round(item.parsed.y);
              const qVal = Math.round(mlMin(R.Qn[idx]));
              return [`Давление: ${pVal} бар`, `Расход: ${qVal} мл/мин`];
            },
            labelColor: () => ({ borderColor: 'transparent', backgroundColor: 'transparent' })
          }
        }
      }
    }
  });
}
