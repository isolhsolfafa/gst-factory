// 파일 경로: src/components/ProgressBar.js

import React from 'react';

/**
 * 재사용 가능한 프로그레스바 컴포넌트
 * @param {object} props
 * @param {number} props.progress - 진행률 숫자 (0-100)
 * @param {string} [props.color='#005bbb'] - 막대 그래프 기본 색상
 * @param {boolean} [props.showCheckmark=true] - 100%일 때 체크마크 표시 여부
 */
const ProgressBar = ({ progress, color = '#005bbb', showCheckmark = true }) => {
  const numericProgress = parseFloat(progress);

  if (isNaN(numericProgress)) {
    return null; // progress 값이 숫자가 아니면 아무것도 표시 안 함
  }

  // showCheckmark가 true이고 진행률이 100% 이상일 때 체크마크 표시
  if (showCheckmark && numericProgress >= 100) {
    return <span style={{ fontSize: '16px' }}>✅</span>;
  }

  // 100%여도 showCheckmark가 false이면 아래의 막대 그래프를 렌더링
  const barColor = numericProgress < 50 && color !== '#005bbb' ? 'red' : color;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '75%', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
        <div style={{ width: `${numericProgress}%`, backgroundColor: barColor, height: '12px', borderRadius: '3px' }}></div>
      </div>
      <span style={{ fontSize: '12px', width: '25%', textAlign: 'right' }}>{numericProgress.toFixed(1)}%</span>
    </div>
  );
};

export default ProgressBar;
