const INPUT_IDS = ['p_source', 'l_total', 'l_to_first', 'step', 'd_mm', 'rho', 'mu_mpa', 'q_at_70', 'n_exp', 'blasius_corr', 'nozzle_min_p'];

function getInputValues() {
  const values = {};
  for (const id of INPUT_IDS) {
    const el = document.getElementById(id);
    values[id] = parseFloat(el.value);
  }
  return {
    P_source_bar: values.p_source,
    L_total:    values.l_total,
    L_to_first: values.l_to_first,
    step:       values.step,
    D_mm:       values.d_mm,
    rho:        values.rho,
    mu_mPa:     values.mu_mpa,
    q_at_70:       values.q_at_70,
    n:             values.n_exp,
    blasius_corr:          values.blasius_corr,
    nozzle_min_pressure_bar: values.nozzle_min_p,
    raw:                     values,
  };
}

function showError(message) {
  const errBox = document.getElementById('errorBox');
  errBox.textContent = message;
  errBox.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
}

function hideError() {
  document.getElementById('errorBox').classList.add('hidden');
  for (const id of INPUT_IDS) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error-input');
  }
}

function highlightField(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('error-input');
  el.focus();
}

function showResultsPanel() {
  document.getElementById('results').classList.remove('hidden');
  // На мобильных сворачиваем панель параметров после расчёта
  if (window.innerWidth <= 768) {
    document.getElementById('paramsPanel').classList.remove('expanded');
    const btn = document.getElementById('btnToggleParams');
    if (btn) btn.textContent = 'Показать параметры';
  }
}

function toggleParamsPanel() {
  const panel = document.getElementById('paramsPanel');
  const btn = document.getElementById('btnToggleParams');
  panel.classList.toggle('expanded');
  btn.textContent = panel.classList.contains('expanded')
    ? 'Скрыть параметры'
    : 'Показать параметры';
}

function updateStats(R) {
  document.getElementById('stPend').textContent   = Math.round(paToBar(R.P_after));
  document.getElementById('stP1').textContent     = Math.round(paToBar(R.P[0]));
  document.getElementById('stQtotal').textContent = (mlMin(R.Q_total) / 1000).toFixed(2);
  document.getElementById('stN').textContent      = R.cfg.N;
}

function renderTable(R) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';
  for (let i = 0; i < R.cfg.N; i++) {
    const tr = document.createElement('tr');
    const pBar = paToBar(R.P[i]);
    const isCritical = pBar < R.cfg.nozzle_min_pressure_bar;
    if (isCritical) tr.style.color = '#dc2626';
    tr.innerHTML = `<td>${i + 1}</td>
      <td>${R.x[i].toFixed(1)}</td>
      <td>${Math.round(pBar)}</td>
      <td>${Math.round(mlMin(R.Qn[i]))}</td>
      <td>${(mlMin(R.Qs[i]) / 1000).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  }
}
