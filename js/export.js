function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(result) {
  const { cfg, x, P, Qn, Qs } = result;
  let csv = '\uFEFF№ форсунки;Отметка трубопровода_м;Давление на форсунке_бар;Расход через форсунку_мл_мин;Расход сегмента_мл_мин\n';
  for (let i = 0; i < cfg.N; i++) {
    csv += `${i + 1};${x[i].toFixed(1)};${paToBar(P[i]).toFixed(6)};${mlMin(Qn[i]).toFixed(4)};${mlMin(Qs[i]).toFixed(4)}\n`;
  }
  downloadBlob(csv, 'text/csv;charset=utf-8', 'pressure-calculator.csv');
}

function exportMD(result) {
  const { cfg, P_after, P_in, Q_total, x, P, Qn, qAt70 } = result;
  let md = '# Расчёт давления и расхода на форсунках\n\n';
  md += '## Параметры\n\n';
  md += `- Источник: ${paToBar(cfg.Psource).toFixed(1)} бар\n`;
  md += `- Линия: ${cfg.L_total} м\n`;
  md += `- До форсунок: ${cfg.L0} м\n`;
  md += `- Шаг: ${cfg.step} м\n`;
  md += `- D внутр: ${(cfg.D * 1e3).toFixed(1)} мм\n`;
  md += `- Площадь: ${(cfg.A * 1e6).toFixed(4)} мм²\n`;
  md += `- Общее количество форсунок: ${cfg.N}\n`;
  md += `- Q форсунки при 70 бар: ${qAt70} мл/мин\n`;
  md += `- k = ${cfg.k_bar.toString()} м³/(с·барⁿ)\n`;
  md += `- n = ${cfg.n}\n\n`;
  md += '## Сводка\n\n';
  md += `| Параметр | Значение |\n|---|---:|\n`;
  md += `| P входа | ${paToBar(P_in).toFixed(6)} бар |\n`;
  md += `| Давление в конце линии | ${paToBar(P_after).toFixed(6)} бар |\n`;
  md += `| P₁ | ${paToBar(P[0]).toFixed(6)} бар |\n`;
  md += `| Суммарный расход через форсунки | ${mlMin(Q_total).toFixed(4)} мл/мин |\n`;
  md += `| Q₁ | ${mlMin(Qn[0]).toFixed(4)} мл/мин |\n`;
  md += `| Q_last | ${mlMin(Qn[cfg.N - 1]).toFixed(4)} мл/мин |\n\n`;
  md += '## Таблица\n\n';
  md += '| № форсунки | Отметка трубопровода, м | Давление на форсунке, бар | Расход через форсунку, мл/мин |\n';
  md += '|:--:|---:|-----:|-------:|\n';
  for (let i = 0; i < cfg.N; i++) {
    md += `|${i + 1}|${x[i].toFixed(1)}|${paToBar(P[i]).toFixed(6)}|${mlMin(Qn[i]).toFixed(6)}|\n`;
  }
  downloadBlob(md, 'text/markdown;charset=utf-8', 'pressure-calculator.md');
}
