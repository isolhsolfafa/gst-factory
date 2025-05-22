import React from 'react';

const KpiMetrics = () => {
  const kpiData = [
    { emoji: "🥇", label: "BAT", tooltip: "KPI 지수: 3.6" },
    { emoji: "🥈", label: "FNI", tooltip: "KPI 지수: 3.6" },
    { emoji: "🥉", label: "TMS(m)", tooltip: "KPI 지수: 6.9" },
    { emoji: "🥇", label: "C&A", tooltip: "KPI 지수: 0.0" },
    { emoji: "🥈", label: "TMS(e)", tooltip: "KPI 지수: 0.7" },
    { emoji: "🥉", label: "P&S", tooltip: "KPI 지수: 3.5" }
  ];

  return (
    <div className="chart-section">
      <h2 style={{ textAlign: 'center' }}>🏆 협력사 KPI 지수 [ 불량 ➕ NaN ]</h2>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {kpiData.map(item => (
          <div className="kpi-card" key={item.label}>
            <div className="emoji">{item.emoji}</div>
            <div className="label">{item.label}</div>
            <div className="tooltip">{item.tooltip}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpiMetrics;
