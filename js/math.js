function barToPa(bar) { return bar * CONSTANTS.PA_PER_BAR; }
function paToBar(pa)   { return pa / CONSTANTS.PA_PER_BAR; }
function mmToM(mm)     { return mm * CONSTANTS.MM_TO_M; }
function mlMin(Q)      { return Q * CONSTANTS.M3S_TO_MLMIN; }

function frictionFactor(Re, cfg) {
  const corr = cfg.blasius_corr;
  if (Re < 1.0) return 64.0;
  if (Re < CONSTANTS.RE_LAMINAR) return 64.0 / Re;
  if (Re < CONSTANTS.RE_TRANSITION_END) {
    const t = (Re - CONSTANTS.RE_LAMINAR) / (CONSTANTS.RE_TRANSITION_END - CONSTANTS.RE_LAMINAR);
    return (1.0 - t) * (64.0 / Re) + t * (corr * 0.316 / Math.pow(Re, 0.25));
  }
  return corr * 0.316 / Math.pow(Re, 0.25);
}

function reynolds(Q, cfg) {
  if (Math.abs(Q) < CONSTANTS.MIN_Q_FOR_REYNOLDS) return 0.0;
  const v = Math.abs(Q) / cfg.A;
  return cfg.rho * v * cfg.D / cfg.mu;
}

function pressureDrop(Q, length, cfg) {
  if (Math.abs(Q) < CONSTANTS.MIN_Q_FOR_REYNOLDS || length <= 0.0) return 0.0;
  const v = Math.abs(Q) / cfg.A;
  const Re = reynolds(Q, cfg);
  const f = frictionFactor(Re, cfg);
  return f * (cfg.rho / 2.0) * (length / cfg.D) * v * v;
}

function nozzleFlow(P, cfg) {
  if (P <= 0.0) return 0.0;
  return cfg.kPa * Math.pow(P, cfg.n);
}

function solveLastNozzle(P_after, cfg) {
  function residual(P_last) {
    const Q = nozzleFlow(P_last, cfg);
    return P_last - P_after - pressureDrop(Q, cfg.step, cfg);
  }

  let lo = P_after;
  if (residual(lo) >= 0.0) return [lo, 0.0];

  let hi = Math.max(lo + 1.0, cfg.Psource);
  for (let i = 0; i < CONSTANTS.MAX_BISECTION_ITERS_INNER; i++) {
    if (residual(hi) > 0.0) break;
    hi *= 2.0;
  }

  for (let i = 0; i < CONSTANTS.MAX_BISECTION_ITERS_INNER; i++) {
    const mid = (lo + hi) / 2.0;
    if (residual(mid) > 0.0) hi = mid;
    else lo = mid;
    if (hi - lo < CONSTANTS.TOLERANCE_INNER_PA) break;
  }

  const P_last = (lo + hi) / 2.0;
  return [P_last, nozzleFlow(P_last, cfg)];
}

function computeProfile(P_after, cfg) {
  const N = cfg.N;
  const x = [];
  for (let i = 0; i < N; i++) x.push(cfg.L0 + i * cfg.step);

  const P  = new Array(N).fill(0.0);
  const Qn = new Array(N).fill(0.0);
  const Qs = new Array(N).fill(0.0);

  const last = solveLastNozzle(P_after, cfg);
  P[N - 1]  = last[0];
  Qn[N - 1] = last[1];
  let Q_acc = Qn[N - 1];
  Qs[N - 1] = Q_acc;

  for (let i = N - 2; i >= 0; i--) {
    P[i]  = P[i + 1] + pressureDrop(Q_acc, cfg.step, cfg);
    Qn[i] = nozzleFlow(P[i], cfg);
    Q_acc += Qn[i];
    Qs[i] = Q_acc;
  }

  return { x, P, Qn, Qs };
}

function inletPressure(P0, Q_total, cfg) {
  return P0 + pressureDrop(Q_total, cfg.L0, cfg);
}
