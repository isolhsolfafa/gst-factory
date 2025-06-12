import React, { useState, useEffect } from 'react';

const SummaryTable = ({ data = { summary_table: [], weekly_production: [], weekly_production_message: '' } }) => {
    console.log("SummaryTable data:", data);
    const [currentSlide, setCurrentSlide] = useState(0);

    // 1. (추가) 진행률 계산 함수
    const calculateProgress = (manufacturing_start, test_start) => {
        if (!manufacturing_start || !test_start) {
            return 0;
        }
        const startDate = new Date(manufacturing_start);
        const endDate = new Date(test_start);
        const today = new Date();
        const holidays = [
            new Date('2025-01-01'), // 신정
            new Date('2025-03-01'), // 삼일절
            new Date('2025-05-05'), // 어린이날
            new Date('2025-05-06'), // 어린이날 대체공휴일
            new Date('2025-05-15'), // 석가탄신일
            new Date('2025-06-06'), // 현충일
            new Date('2025-08-15'), // 광복절
            // 추석 연휴 (10월 5~9일)
            new Date('2025-10-05'),
            new Date('2025-10-06'),
            new Date('2025-10-07'),
            new Date('2025-10-08'), // 대체공휴일 가능성 있음
            new Date('2025-10-09'), // 한글날
            new Date('2025-10-03'), // 개천절
            new Date('2025-12-25')  // 성탄절
          ];

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
            return 0;
        }

        let totalWorkingDays = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            const isWeekend = (day === 0 || day === 6);
            const isHoliday = (d.toDateString() === holiday.toDateString());
            if (!isWeekend && !isHoliday) {
                totalWorkingDays++;
            }
        }

        if (totalWorkingDays === 0) return 100;

        let elapsedWorkingDays = 0;
        const limitDate = today < endDate ? today : endDate;
        for (let d = new Date(startDate); d <= limitDate; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            const isWeekend = (day === 0 || day === 6);
            const isHoliday = (d.toDateString() === holiday.toDateString());
            if (!isWeekend && !isHoliday) {
                elapsedWorkingDays++;
            }
        }

        const progress = (elapsedWorkingDays / totalWorkingDays) * 100;
        return Math.min(progress, 100);
    };

    const summaryTableData = data && data.summary_table ? data.summary_table : [];
    const weeklyProductionData = data && data.weekly_production ? data.weekly_production : [];
    const weeklyProductionMessage = data && data.weekly_production_message ? data.weekly_production_message : "최근 1주일 동안 생산 데이터가 없습니다.";

    useEffect(() => {
        const interval = setInterval(() => {
            if (summaryTableData.length > 7) {
                setCurrentSlide((prev) => (prev + 1) % Math.ceil(summaryTableData.length / 7));
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [summaryTableData]);

    const slides = [];
    for (let i = 0; i < summaryTableData.length; i += 7) {
        slides.push(summaryTableData.slice(i, i + 7));
    }

    const renderProgressBar = (progress) => {
        const numericProgress = parseFloat(progress);
        if (isNaN(numericProgress)) return null;

        if (numericProgress >= 100) {
            return <span style={{ fontSize: '16px' }}>✅</span>;
        }

        const color = numericProgress >= 50 ? 'orange' : 'red';
        
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '75%', backgroundColor: '#e0e0e0', borderRadius: '3px' }}>
                  <div style={{ width: `${numericProgress}%`, backgroundColor: color, height: '12px', borderRadius: '3px' }}></div>
              </div>
              <span style={{ fontSize: '12px', width: '25%', textAlign: 'right' }}>{numericProgress.toFixed(1)}%</span>
            </div>
        );
    };

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
                                        {/* 2. (추가) 테이블 헤더 */}
                                        <th>진행률(기준일)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slide.map((item, itemIndex) => {
                                        // 2. (추가) 진행률 계산 로직 호출
                                        const progressPercent = calculateProgress(item.manufacturing_start, item.test_start);
                                        return (
                                            <tr key={`${item.title_number}-${itemIndex}`}>
                                                <td>{item.title_number}</td>
                                                <td>{item.model_name}</td>
                                                <td>{item.mech_partner}</td>
                                                <td>{item.elec_partner}</td>
                                                <td>{renderProgressBar(item.mech_progress)}</td>
                                                <td>{renderProgressBar(item.elec_progress)}</td>
                                                <td>{renderProgressBar(item.tms_progress)}</td>
                                                {/* 2. (추가) 계산된 진행률 표시 */}
                                                <td>{renderProgressBar(progressPercent)}</td>
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
