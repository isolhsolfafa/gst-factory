import React from 'react';

const DefectMetrics = () => {
  return (
    <div className="defect-metrics-wrapper">
      <div className="defect-metrics-section">
        <iframe
          src="https://isolhsolfafa.github.io/GST_Factory_Dashboard/defect_cards.html"
          style={{ width: '100%', height: '600px', border: 'none' }}
          onError={(e) =>
            (e.target.parentNode.innerHTML =
              '<p>불량 카드 데이터를 불러올 수 없습니다.</p>')
          }
        />
      </div>
    </div>
  );
};

export default DefectMetrics;
