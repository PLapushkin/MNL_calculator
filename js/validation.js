class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
    this.allErrors = [];
  }
}

function validateInputs(raw) {
  const errors = [];

  function check(condition, field, message) {
    if (!condition) errors.push({ field, message });
  }

  const { P_source_bar, L_total, L_to_first, step, D_mm, rho, mu_mPa, q_at_70, n } = raw;

  check(Number.isFinite(P_source_bar) && P_source_bar > 0, 'p_source',
    'Давление источника должно быть положительным числом');
  check(Number.isFinite(L_total) && L_total > 0, 'l_total',
    'Общая длина должна быть положительной');
  check(Number.isFinite(L_to_first) && L_to_first >= 0, 'l_to_first',
    'Длина до первой форсунки не может быть отрицательной');
  check(Number.isFinite(step) && step > 0, 'step',
    'Шаг между форсунками должен быть положительным');
  check(Number.isFinite(D_mm) && D_mm > 0, 'd_mm',
    'Диаметр трубы должен быть положительным');
  check(Number.isFinite(rho) && rho > 0, 'rho',
    'Плотность должна быть положительной');
  check(Number.isFinite(mu_mPa) && mu_mPa > 0, 'mu_mpa',
    'Вязкость должна быть положительной');
  check(Number.isFinite(q_at_70) && q_at_70 > 0, 'q_at_70',
    'Расход при 70 бар должен быть положительным');
  check(Number.isFinite(n) && n >= CONSTANTS.N_MIN && n <= CONSTANTS.N_MAX, 'n_exp',
    `Показатель степени n должен быть в диапазоне [${CONSTANTS.N_MIN}, ${CONSTANTS.N_MAX}]`);
  check(Number.isFinite(raw.blasius_corr) && raw.blasius_corr > 0, 'blasius_corr',
    'Коррекция f должна быть положительным числом');
  check(Number.isFinite(raw.nozzle_min_pressure_bar) && raw.nozzle_min_pressure_bar > 0, 'nozzle_min_p',
    'Минимальное давление распыления должно быть положительным');

  if (errors.length === 0) {
    check(L_to_first < L_total, 'l_to_first',
      'Расстояние до первой форсунки должно быть меньше общей длины линии');
  }

  if (errors.length === 0) {
    const N = Math.round((L_total - L_to_first) / step);
    check(N > 0, 'step',
      'При заданных длине и шаге форсунок не получается (N ≤ 0)');
    check(N <= CONSTANTS.MAX_NOZZLES, 'step',
      `Слишком много форсунок (${N} > ${CONSTANTS.MAX_NOZZLES})`);
  }

  if (errors.length > 0) {
    const first = errors[0];
    const err = new ValidationError(first.field, first.message);
    err.allErrors = errors;
    throw err;
  }

  return true;
}
