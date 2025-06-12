// 파일 경로: src/components/SummaryTable.js

import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar'; // ProgressBar 컴포넌트 가져오기

// --- Helper Functions (컴포넌트 외부에 위치시켜 재사용성 증대) ---

// 한국 공휴일 리스트 (2025년 기준 예시)
const holidays = [
  new Date('2025-01-01'), new Date('2025-01-28'), new Date('2025-01-29'),
  new Date('2025-01-30'), new Date('2025-03-01'), new Date('2025-05-05'),
  new Date('2025-05-06'), new Date('2025-05-29'), new Date('2025-06-06'),
  new Date('2025-08-15'), new Date('2025-10-03'), new Date('2025-10-06'),
  new Date('2025-10-07'), new Date('2025-10-08'), new Date('2025-12-25'),
];

// 공휴일 체크 함수
const isHoliday = (date) => {
  return holidays.some(holiday =>
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
};

// 워킹데이 계산 함수
const countWorkingDays = (start, end) => {
  let count = 0;
  const curDate = new Date(start);
  while (curDate <= end) {
    const day = curDate.getDay();
    if (day !== 0 && day !== 6 && !isHoliday(curDate)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

// 진행률 계산 함수
const calculateProgress = (manufacturingStartStr, testStartStr) => {
  if (!manufacturingStartStr || !testStartStr) return 0;

  const manufacturingStart = new Date(manufacturingStartStr);
  const testStart = new Date(testStartStr);
  const today = new Date();

  if (isNaN(manufacturingStart.getTime()) || isNaN(testStart.getTime()) || manufacturingStart > testStart) {
    return 0;
  }

  const todayClamped = today > testStart ? testStart : today;
  const totalDays = countWorkingDays(manufacturingStart, testStart);
  const elapsedDays = countWorkingDays(manufacturingStart, todayClamped);

  if (totalDays === 0) return 100;

  const progress = (elapsedDays / totalDays) * 100;
  return Math.min(progress, 100);
};

// --- SummaryTable Component ---

const SummaryTable = ({ data = { summary_table: [], weekly_production: [], weekly_production_message: '' } }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const summaryTableData = data?.summary_table
    ? [...data.summary_table].sort((a, b) => (a.title_number || '').localeCompare(b.title_number || ''))
    : [];

  const weeklyProductionData = data?.weekly_production || [];
  const weeklyProductionMessage = data?.weekly_production_message || "최근 1주일 동안 생산 데이터가 없습니다.";

  useEffect(() => {
    if (summaryTableData.length <= 7) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(summaryTableData.length / 7));
    }, 7000);
    return () => clearInterval(interval);
  }, [summaryTableData]);

  const slides = [];
  for (let i = 0; i < summaryTableData.length; i += 7) {
    slides.push(summaryTableData.slice(i, i + 7));
  }

  return (
    <div>
      <h2>📋 생산 요약 테이블 [Planned Mech]</h2>
      {weeklyProductionData.length === 0 && (
        <div style={{ marginBottom: '10px', color: '#888' }}>
          {weeklyProductionMessage}
        </div>
      )}
      <div id="summary-table-slide">
        {slides.length > 0 ? (
          slides.map((slide, index) => (
            <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={index}>
              {/* ▼▼▼ 핵심 수정: 테이블 전체를 가로 스크롤이 가능한 div로 감쌉니다. ▼▼▼ */}
              <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                {/* table-layout:fixed를 제거하여 auto(유동적) 레이아웃으로 되돌립니다. */}
                {/* 대신 min-width를 주어 테이블이 너무 작아지는 것을 방지합니다. */}
                <table border="1" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                      <th style={{padding: '8px'}}>Title Number</th>
                      <th style={{padding: '8px'}}>모델명</th>
                      <th style={{padding: '8px'}}>기구협력사</th>
                      <th style={{padding: '8px'}}>전장협력사</th>
                      <th style={{padding: '8px'}}>기구 진행률</th>
                      <th style={{padding: '8px'}}>전장 진행률</th>
                      <th style={{padding: '8px'}}>반제품 진행률</th>
                      <th style={{padding: '8px'}}>⏱️일정 기준 진행률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slide.map((item, itemIndex) => {
                      const expectedProgress = calculateProgress(item.manufacturing_start, item.test_start);
                      return (
                        <tr key={`${item.title_number}-${itemIndex}`}>
                          <td style={{padding: '8px'}}>{item.title_number}</td>
                          <td style={{padding: '8px'}}>{item.model_name}</td>
                          <td style={{padding: '8px'}}>{item.mech_partner}</td>
                          <td style={{padding: '8px'}}>{item.elec_partner}</td>
                          {/* 진행률 바가 너무 좁아지지 않도록 min-width를 설정합니다. */}
                          <td style={{padding: '8px', minWidth: '120px'}}><ProgressBar progress={item.mech_progress} color="orange" /></td>
                          <td style={{padding: '8px', minWidth: '120px'}}><ProgressBar progress={item.elec_progress} color="orange" /></td>
                          <td style={{padding: '8px', minWidth: '120px'}}><ProgressBar progress={item.tms_progress} color="orange" /></td>
                          <td style={{padding: '8px', minWidth: '120px'}}>
                            <ProgressBar
                              progress={expectedProgress}
                              color="#005bbb"
                              showCheckmark={false}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
               {/* ▲▲▲ 핵심 수정: div 끝 ▲▲▲ */}
            </div>
          ))
        ) : (
          <div>데이터가 없습니다.</div>
        )}
      </div>
      {slides.length > 1 && (
        <>
          <div className="slide-controls">
            <button onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}>이전</button>
            <button onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}>다음</button>
          </div>
          <div className="slide-indicators">
            {slides.map((_, index) => (
              <span
                key={index}
                className={index === currentSlide ? 'active' : ''}
                onClick={() => setCurrentSlide(index)}
              ></span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SummaryTable;
