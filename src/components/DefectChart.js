import React from 'react';

const DefectChart = () => (
  <div className="chart-section">
    <iframe
      src="/pie_defect.html"
      style={{ width: '100%', height: '250px', border: 'none' }}
      onError={(e) => e.target.parentNode.innerHTML = '<p>데이터 없음</p>'}
    />
  </div>
);

export default DefectChart;


