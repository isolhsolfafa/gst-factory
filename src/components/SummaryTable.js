import React, { useState, useEffect } from 'react';

// 한국 공휴일 리스트 (2025년 기준 예시)
const holidays = [
  new Date('2025-01-01'),
  new Date('2025-03-01'),
  new Date('2025-05-05'),
  new Date('2025-05-06'),
  new Date('2025-05-15'),
  new Date('2025-06-06'),
  new Date('2025-08-15'),
  new Date('2025-10-03'),
  new Date('2025-10-05'),
  new Date('2025-10-06'),
  new Date('2025-10-07'),
  new Date('2025-10-08'),
  new Date('2025-10-09'),
  new Date('2025-12-25'),
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
    // 일요일(0), 토요일(6) 제외 + 공휴일 제외
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

  if (isNaN(manufacturingStart) || isNaN(testStart) || manufacturingStart > testStart) {
    console.warn("Invalid dates detected:", { manufacturingStartStr, testStartStr });
    return 0;
  }

  const totalDays = countWorkingDays(manufacturingStart, testStart);
  const elapsedDays = countWorkingDays(manufacturingStart, today > testStart ? testStart : today);

  if (totalDays === 0) return 0;

  const progress = (elapsedDays / totalDays) * 100;
  return progress > 100 ? 100 : progress;
};

const SummaryTable = ({ data = { summary_table: [], weekly_production: [], weekly_production_message: '' } }) => {
  console.log("SummaryTable data:", data); // 디버깅용 로그 추가
  const [currentSlide, setCurrentSlide] = useState(0);

  // data가 undefined이거나 summary_table이 없는 경우를 처리
  const summaryTableData = data && data.summary_table
    ? [...data.summary_table].sort((a, b) => {
        // title_number 앞 6자리 YYMMDD 추출
        const dateStrA = a.title_number ? a.title_number.split('/')[0] : '';
        const dateStrB = b.title_number ? b.title_number.split('/')[0] : '';

        // YYMMDD -> Date 객체 생성 (2000년대 기준으로 가정)
        const dateA = new Date(`20${dateStrA.slice(0,2)}-${dateStrA.slice(2,4)}-${dateStrA.slice(4,6)}`);
        const dateB = new Date(`20${dateStrB.slice(0,2)}-${dateStrB.slice(2,4)}-${dateStrB.slice(4,6)}`);

        return dateA - dateB;
      })
    : [];
  const weeklyProductionData = data && data.weekly_production ? data.weekly_production : [];
  const weeklyProductionMessage = data && data.weekly_production_message ? data.weekly_production_message : "최근 1주일 동안 생산 데이터가 없습니다.";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(summaryTableData.length / 7));
    }, 5000);
    return () => clearInterval(interval);
  }, [summaryTableData]);

  const slides = [];
  for (let i = 0; i < summaryTableData.length; i += 7) {
    slides.push(summaryTableData.slice(i, i + 7));
  }

  const renderProgressBar = (progress) => {
    if (progress === 100) {
      return <span style={{ fontSize: '16px' }}>✅</span>;
    } else if (progress >= 50) {
      return (
        <>
          <div style={{ width: `${progress}%`, backgroundColor: 'orange', height: '12px', borderRadius: '3px' }}></div>
          <span style={{ fontSize: '12px' }}>{progress.toFixed(1)}%</span>
        </>
      );
    } else {
      return (
        <>
          <div style={{ width: `${progress}%`, backgroundColor: 'red', height: '12px', borderRadius: '3px' }}></div>
          <span style={{ fontSize: '12px' }}>{progress.toFixed(1)}%</span>
        </>
      );
    }
  };

  return (
    <div>
      <h2>📋 생산 요약 테이블 [Planned Mech]</h2>
      {/* Weekly Production Message 표시 */}
      {weeklyProductionData.length === 0 && (
        <div style={{ marginBottom: '10px', color: '#888' }}>
          {weeklyProductionMessage}
        </div>
      )}
      <div id="summary-table-slide">
        {slides.length > 0 ? (
          slides.map((slide, index) => (
            <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={index}>
              <table border="1" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th>Title Number</th>
                    <th>모델명</th>
                    <th>기구협력사</th>
                    <th>전장협력사</th>
                    <th>기구 진행률</th>
                    <th>전장 진행률</th>
                    <th>반제품 진행률</th>
                    <th>예상 진행률</th>
                  </tr>
                </thead>
                <tbody>
                  {slide.map(item => {
                    const expectedProgress = calculateProgress(item.manufacturing_start, item.test_start);
                    return (
                      <tr key={item.title_number}>
                        <td>{item.title_number}</td>
                        <td>{item.model_name}</td>
                        <td>{item.mech_partner}</td>
                        <td>{item.elec_partner}</td>
                        <td>{renderProgressBar(item.mech_progress)}</td>
                        <td>{renderProgressBar(item.elec_progress)}</td>
                        <td>{renderProgressBar(item.tms_progress)}</td>
                        <td>{renderProgressBar(expectedProgress)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
