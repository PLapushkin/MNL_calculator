/**
 * Глобальные константы и значения по умолчанию.
 */
const CONSTANTS = {
  PA_PER_BAR: 1e5,
  MM_TO_M: 1e-3,
  MPA_TO_PA: 1e-3,
  M3S_TO_MLMIN: 6e7,

  RE_LAMINAR: 2300,
  RE_TRANSITION_START: 2300,
  RE_TRANSITION_END: 4000,

  MAX_BISECTION_ITERS_OUTER: 60,
  MAX_BISECTION_ITERS_INNER: 80,
  TOLERANCE_OUTER_PA: 1e-3,
  TOLERANCE_INNER_PA: 1e-6,
  MIN_Q_FOR_REYNOLDS: 1e-18,

  MAX_NOZZLES: 100000,
  N_MIN: 0.1,
  N_MAX: 1.0,

};

const DEFAULTS = {
  P_source_bar: 70,
  L_total: 100,
  L_to_first: 20,
  step: 3,
  D_mm: 4.5,
  rho: 998.2,
  mu_mPa: 1.002,
  q_at_70: 36,
  // Для мелкодисперсных вихревых форсунок (swirl atomizer с
  // тангенциальными входами) экспериментально n ≈ 1.0.
  // Для классических орбифисов n ≈ 0.5.
  n: 1.0,

  // Порог корректного распыления форсунок, бар
  nozzle_min_pressure_bar: 25,
};
