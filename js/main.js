let lastResult = null;

function buildConfig(inputs) {
  const Psource = barToPa(inputs.P_source_bar);
  const D = mmToM(inputs.D_mm);
  const A = Math.PI * (D / 2) ** 2;
  const mu = inputs.mu_mPa * 1e-3;
  const N = Math.round((inputs.L_total - inputs.L_to_first) / inputs.step);

  const Q_target_m3s = inputs.q_at_70 / CONSTANTS.M3S_TO_MLMIN;
  const k_bar = Q_target_m3s / Math.pow(inputs.P_source_bar, inputs.n);
  const kPa = k_bar / Math.pow(1e5, inputs.n);

  return {
    Psource,
    L_total: inputs.L_total,
    L0: inputs.L_to_first,
    step: inputs.step,
    D,
    A,
    rho: inputs.rho,
    mu,
    n: inputs.n,
    blasius_corr: inputs.blasius_corr,
    nozzle_min_pressure_bar: inputs.nozzle_min_pressure_bar,
    N,
    k_bar,
    kPa,
  };
}

function runCalculation() {
  hideError();

  try {
    const inputs = getInputValues();
    validateInputs(inputs);

    const cfg = buildConfig(inputs);

    function residual(P_after) {
      const prof = computeProfile(P_after, cfg);
      const Q_total = prof.Qn.reduce((a, b) => a + b, 0.0);
      const P_in = inletPressure(prof.P[0], Q_total, cfg);
      return P_in - cfg.Psource;
    }

    let lo = 0.0;
    let hi = cfg.Psource;
    const r_lo = residual(lo);
    const r_hi = residual(hi);

    if (r_lo > 0) {
      throw new Error(
        'Даже при нулевом давлении у заглушки входное давление превышает источник. Проверьте единицы k или диаметр трубы.'
      );
    }
    if (r_hi < 0) {
      throw new Error(
        'При P_after = P_источника входное давление всё ещё меньше требуемого. Решения нет.'
      );
    }

    for (let it = 0; it < CONSTANTS.MAX_BISECTION_ITERS_OUTER; it++) {
      const mid = (lo + hi) / 2.0;
      const r_mid = residual(mid);
      if (Math.abs(r_mid) < CONSTANTS.TOLERANCE_OUTER_PA) {
        lo = hi = mid;
        break;
      }
      if (r_mid > 0.0) hi = mid;
      else lo = mid;
    }

    const P_after = (lo + hi) / 2.0;
    const prof = computeProfile(P_after, cfg);
    const Q_total = prof.Qn.reduce((a, b) => a + b, 0.0);
    const P_in = inletPressure(prof.P[0], Q_total, cfg);

    lastResult = {
      cfg,
      P_after,
      P_in,
      Q_total,
      ...prof,
      qAt70: inputs.q_at_70,
    };

    showResultsPanel();
    updateStats(lastResult);
    renderTable(lastResult);
    renderCharts(lastResult, cfg);
  } catch (e) {
    if (e instanceof ValidationError) {
      showError(e.message);
      highlightField(e.field);
    } else {
      showError(e.message);
    }
  }
}

document.getElementById('btnCalc').addEventListener('click', runCalculation);
document.getElementById('btnCsv').addEventListener('click', () => {
  if (lastResult) exportCSV(lastResult);
});
document.getElementById('btnMd').addEventListener('click', () => {
  if (lastResult) exportMD(lastResult);
});

const btnToggle = document.getElementById('btnToggleParams');
if (btnToggle) btnToggle.addEventListener('click', toggleParamsPanel);

// На десктопе сразу раскрываем параметры
if (window.innerWidth > 768) {
  const panel = document.getElementById('paramsPanel');
  if (panel) panel.classList.add('expanded');
}

runCalculation();
