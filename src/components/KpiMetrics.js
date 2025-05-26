import React from 'react';

const KpiMetrics = () => {
  return (
    <div className="kpi-metrics-wrapper">
      <div className="kpi-metrics-section">
        <iframe
          src="https://isolhsolfafa.github.io/GST_Factory_Dashboard/partner_kpi.html"
          style={{ width: '100%', height: '670px', border: 'none' }}
          onError={(e) =>
            (e.target.parentNode.innerHTML =
              '<p>KPI 데이터를 불러올 수 없습니다.</p>')
          }
        />
      </div>
    </div>
  );
};

export default KpiMetrics;
