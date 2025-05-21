import React from 'react';

const DefectMetrics = () => {
  const defectData = [
    { model: "DRAGON AB", total: 1, category: "기구작업불량" },
    { model: "DRAGON AB DUAL", total: 11, category: "기구작업불량, 전장작업불량, 부품불량" },
    { model: "GAIA-I", total: 1, category: "기구작업불량" },
    { model: "GAIA-I DUAL", total: 5, category: "기구작업불량, 부품불량" },
    { model: "GAIA-P", total: 1, category: "작업불량" }
  ];

  return (
    <div>
      <h2>🚨 Defect 지표 🚨</h2>
      <div className="card-container">
        {defectData.map(item => (
          <div className="summary-card" key={item.model}>
            <h3>{item.model}</h3>
            <p>총 불량: <strong>{item.total}건</strong></p>
            <p>주요 중분류: {item.category}</p>
            <a href="https://rainbow-haupia-cd8290.netlify.app/">→ 상세 보기</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefectMetrics;