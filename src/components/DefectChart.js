import React from 'react';

const DefectChart = () => (
  <div className="chart-section defect-chart">
    <iframe
      src="/pie_defect.html"
      style={{ width: '100%', height: '330px', border: 'none' }}
      onError={(e) => e.target.parentNode.innerHTML = '<p>데이터 없음</p>'}
    />
  </div>
);

export default DefectChart;
