import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Recharts 대신 순수 HTML/CSS 바 차트 사용

// API 기본 URL 설정 (기존 App.js 방식과 일관성 유지)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pda-api-extract.up.railway.app'
  : 'http://localhost:5003';

// 동적 월 옵션 생성 함수
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  const startDate = new Date(2025, 5, 1); // 2025년 6월 (월은 0부터 시작하므로 5)
  
  // 현재 월부터 역순으로 생성하되, 2025년 6월 이후만 포함
  for (let i = 0; i < 24; i++) { // 최대 24개월 범위로 확장
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // 2025년 6월 이전 데이터는 제외
    if (date < startDate) {
      break;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    const label = `${year}년 ${month}월`;
    
    options.push({ value, label });
  }
  
  return options;
};

// S/N 드롭다운 메뉴 컴포넌트
const SerialNumberDropdown = ({ modelName, productCode, selectedMonth, isOpen, onToggle, position }) => {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && modelName && productCode && selectedMonth) {
      fetchSerials();
    }
  }, [isOpen, modelName, productCode, selectedMonth]);

  const fetchSerials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/product_code/serials`, {
        params: {
          month: selectedMonth,
          model_name: modelName,
          product_code: productCode
        }
      });
      setSerials(response.data.serials || []);
    } catch (err) {
      setError('S/N 정보를 불러오는데 실패했습니다.');
      console.error('Failed to fetch serials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSerialClick = (serial) => {
    if (serial.spreadsheet_link) {
      window.open(serial.spreadsheet_link, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="serial-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 1000,
        marginTop: '4px'
      }}
    >
      <div className="dropdown-header">
        <span className="dropdown-title">📋 {productCode} S/N 목록</span>
        <span className="dropdown-count">총 {serials.length}개</span>
      </div>
      <div className="dropdown-content">
        {loading && <div className="dropdown-loading">S/N 정보 로딩 중...</div>}
        {error && <div className="dropdown-error">{error}</div>}
        {!loading && !error && serials.length === 0 && (
          <div className="dropdown-empty">S/N 정보가 없습니다.</div>
        )}
        {!loading && !error && serials.length > 0 && (
          <div className="dropdown-list">
            {serials.map((serial, index) => (
              <div
                key={index}
                className={`dropdown-item ${serial.spreadsheet_link ? 'clickable' : 'no-link'}`}
                onClick={() => handleSerialClick(serial)}
                title={serial.spreadsheet_link ? '클릭하여 스프레드시트 열기' : '스프레드시트 링크 없음'}
              >
                <span className="serial-number">{serial.serial_number}</span>
                {serial.spreadsheet_link && <span className="link-icon">🔗</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 카테고리별 합계 시간 카드 컴포넌트
const CategorySummaryCards = ({ selectedProductCode }) => {
  // 카테고리별 총 시간 계산
  const calculateCategoryTotals = () => {
    const categoryTotals = {
      '기구': 0,
      '전장': 0,
      'TMS_반제품': 0,
      '검사': 0,
      '마무리': 0,
      '기타': 0
    };

    if (!selectedProductCode || !selectedProductCode.categories) {
      return categoryTotals;
    }

    selectedProductCode.categories.forEach(category => {
      if (!category || !category.tasks || !Array.isArray(category.tasks)) return;
      
      const categoryName = category.category;
      
      // 해당 카테고리가 6개 카테고리 중 하나인지 확인
      if (categoryTotals.hasOwnProperty(categoryName)) {
        category.tasks.forEach(task => {
          if (!task || typeof task !== 'object') return;
          
          let safeHours = 0;
          const avgHours = task.avg_hours;
          
          if (typeof avgHours === 'number' && Number.isFinite(avgHours) && avgHours > 0) {
            safeHours = avgHours;
          } else if (typeof avgHours === 'string' && avgHours.trim() !== '') {
            const parsed = parseFloat(avgHours);
            if (Number.isFinite(parsed) && parsed > 0) {
              safeHours = parsed;
            }
          }
          
          categoryTotals[categoryName] += safeHours;
        });
      } else {
        // 6개 카테고리에 없는 것들은 '기타'로 분류
        category.tasks.forEach(task => {
          if (!task || typeof task !== 'object') return;
          
          let safeHours = 0;
          const avgHours = task.avg_hours;
          
          if (typeof avgHours === 'number' && Number.isFinite(avgHours) && avgHours > 0) {
            safeHours = avgHours;
          } else if (typeof avgHours === 'string' && avgHours.trim() !== '') {
            const parsed = parseFloat(avgHours);
            if (Number.isFinite(parsed) && parsed > 0) {
              safeHours = parsed;
            }
          }
          
          categoryTotals['기타'] += safeHours;
        });
      }
    });

    return categoryTotals;
  };

  // 시간을 "X시간 Y분" 형태로 변환
  const formatTime = (hours) => {
    if (hours === 0) return "0분";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    if (h === 0) return `${m}분`;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  };

  // 카테고리별 색상과 아이콘
  const getCategoryStyle = (category) => {
    const styles = {
      '기구': { color: '#8884d8', icon: '🔧' },
      '전장': { color: '#82ca9d', icon: '⚡' },
      'TMS_반제품': { color: '#ffc658', icon: '🏭' },
      '검사': { color: '#ff7c7c', icon: '🔍' },
      '마무리': { color: '#d084d0', icon: '✅' },
      '기타': { color: '#8dd1e1', icon: '📋' }
    };
    return styles[category] || { color: '#8884d8', icon: '📊' };
  };

  // 카테고리 클릭 시 해당 섹션으로 스크롤 이동
  const scrollToCategory = (categoryName) => {
    const element = document.getElementById(`category-section-${categoryName}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const categoryTotals = calculateCategoryTotals();

  return (
    <div className="category-summary-cards">
      <h3>📊 공정별 누적 작업 시간</h3>
      <div className="summary-cards-grid">
        {Object.entries(categoryTotals).map(([category, totalHours]) => {
          const style = getCategoryStyle(category);
          return (
            <div 
              key={category} 
              className="summary-card clickable-card" 
              style={{ borderColor: style.color }}
              onClick={() => scrollToCategory(category)}
              title={`${category} 섹션으로 이동`}
            >
              <div className="card-header">
                <span className="category-icon">{style.icon}</span>
                <span className="category-name">{category}</span>
              </div>
              <div className="card-content">
                <div className="total-hours" style={{ color: style.color }}>
                  {totalHours.toFixed(1)}h
                </div>
                <div className="formatted-time">
                  {formatTime(totalHours)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CycleTimeAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 동적 월 옵션 생성 및 현재 월을 기본값으로 설정
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '2025-06');
  
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedProductCode, setSelectedProductCode] = useState(null);
  
  // S/N 드롭다운 상태 관리
  const [dropdownState, setDropdownState] = useState({
    isOpen: false,
    modelName: null,
    productCode: null,
    position: { x: 0, y: 0 }
  });

  // Product Code 클릭 핸들러
  const handleProductCodeClick = (event, modelName, productCode) => {
    event.stopPropagation(); // 이벤트 버블링 방지
    
    setDropdownState(prev => ({
      isOpen: !prev.isOpen || prev.productCode !== productCode,
      modelName: modelName,
      productCode: productCode,
      position: { x: 0, y: 0 }
    }));
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownState(prev => ({ ...prev, isOpen: false }));
    };

    if (dropdownState.isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownState.isOpen]);

  // API 호출
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/cycle_time/monthly?month=${selectedMonth}`);
        setData(response.data);
        
        // 첫 번째 모델을 기본 선택
        if (response.data.models && response.data.models.length > 0) {
          setSelectedModel(response.data.models[0]);
          if (response.data.models[0].product_codes.length > 0) {
            setSelectedProductCode(response.data.models[0].product_codes[0]);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // 총 생산 대수 계산 함수
  const calculateTotalProduction = () => {
    if (!data || !data.models) return 0;
    
    return data.models.reduce((total, model) => {
      return total + (model.total_production_count || 0);
    }, 0);
  };

  // 카테고리별 바 차트 데이터 변환 (초안전 모드)
  const getCategoryData = (categoryName) => {
    try {
      if (!selectedProductCode || !selectedProductCode.categories) return [];

      const category = selectedProductCode.categories.find(cat => cat && cat.category === categoryName);
      if (!category || !category.tasks || !Array.isArray(category.tasks)) return [];

      const validTasks = [];
      
      for (const task of category.tasks) {
        if (!task || typeof task !== 'object') continue;
        
        // 초안전 숫자 변환
        let safeHours = 0;
        const avgHours = task.avg_hours;
        
        if (typeof avgHours === 'number' && Number.isFinite(avgHours) && avgHours > 0) {
          safeHours = avgHours;
        } else if (typeof avgHours === 'string' && avgHours.trim() !== '') {
          const parsed = parseFloat(avgHours);
          if (Number.isFinite(parsed) && parsed > 0) {
            safeHours = parsed;
          }
        }
        
        // 유효한 데이터만 추가
        if (safeHours > 0) {
          validTasks.push({
            name: String(task.task_name || 'Unknown Task'),
            hours: Number(safeHours.toFixed(2)), // 정확한 소수점 처리
            time_str: String(task.avg_time_str || '0분'),
            sample_count: Math.max(0, parseInt(task.sample_count) || 0),
            category: String(categoryName)
          });
        }
      }
      
      return validTasks.sort((a, b) => b.hours - a.hours);
    } catch (error) {
      console.error('getCategoryData 에러:', error, categoryName);
      return [];
    }
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category) => {
    const colors = {
      '기구': '#8884d8',
      '전장': '#82ca9d', 
      'TMS_반제품': '#ffc658',
      '검사': '#ff7c7c',
      '기타': '#8dd1e1',
      '마무리': '#d084d0'
    };
    return colors[category] || '#8884d8';
  };

  // CustomTooltip 제거 - 이제 HTML 바 차트에 직접 정보 표시

  // 카테고리별 최대값 계산 (Y축 스케일 통일용)
  const getMaxHours = () => {
    try {
      if (!selectedProductCode || !selectedProductCode.categories) return 12;
      
      let maxHours = 0;
      selectedProductCode.categories.forEach(category => {
        if (category && category.tasks && Array.isArray(category.tasks)) {
          category.tasks.forEach(task => {
            if (task && typeof task === 'object') {
              const avgHours = task.avg_hours;
              let hours = 0;
              
              if (typeof avgHours === 'number' && Number.isFinite(avgHours)) {
                hours = avgHours;
              } else if (typeof avgHours === 'string') {
                const parsed = parseFloat(avgHours);
                if (Number.isFinite(parsed)) {
                  hours = parsed;
                }
              }
              
              if (hours > maxHours && hours > 0) {
                maxHours = hours;
              }
            }
          });
        }
      });
      return Math.ceil(Math.max(maxHours * 1.1, 1)); // 최소 1시간, 10% 여유 공간
    } catch (error) {
      console.error('getMaxHours 에러:', error);
      return 12; // 기본값 반환
    }
  };

  // Product Code 버튼 호버 이벤트 핸들러
  const handleProductCodeMouseEnter = (event, modelName, productCode) => {
    // 호버 기능 제거 - 클릭만 사용
  };

  const handleProductCodeMouseLeave = () => {
    // 호버 기능 제거 - 클릭만 사용
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">오류: {error}</div>;
  if (!data) return <div className="no-data">데이터가 없습니다.</div>;

  return (
    <div className="cycle-time-analysis">
      <div className="header">
        <h1>📊 CT 분석 - {selectedMonth}</h1>
        <div className="month-selector">
          <label>월 선택: </label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Model 탭 메뉴 */}
      <div className="model-tabs">
        <h3>📦 Model 선택 (생산량 순)</h3>
        <div className="tab-buttons">
          {data.models.map((model, index) => (
            <button
              key={index}
              className={`tab-button ${selectedModel?.model_name === model.model_name ? 'active' : ''}`}
              onClick={() => {
                setSelectedModel(model);
                setSelectedProductCode(model.product_codes[0]);
              }}
            >
              {model.model_name}
              <span className="production-count">★{model.total_production_count}대</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Code 선택 */}
      <div className="product-code-section">
        <h3>📦 Product Code 선택 (생산량 순)</h3>
        <div className="product-code-list">
          {selectedModel.product_codes.map((pc, index) => (
            <div key={pc.product_code} className="product-code-item" style={{ position: 'relative' }}>
              <button
                className={`product-code-btn ${selectedProductCode?.product_code === pc.product_code ? 'active' : ''}`}
                onClick={(e) => {
                  setSelectedProductCode(pc);
                  handleProductCodeClick(e, selectedModel.model_name, pc.product_code);
                }}
                onMouseEnter={(e) => handleProductCodeMouseEnter(e, selectedModel.model_name, pc.product_code)}
                onMouseLeave={handleProductCodeMouseLeave}
              >
                {pc.product_code}
                <span className="star-rating">★{pc.production_count}대</span>
              </button>
              
              {/* 드롭다운이 이 Product Code에 해당할 때만 표시 */}
              {dropdownState.isOpen && dropdownState.productCode === pc.product_code && (
                <SerialNumberDropdown
                  modelName={dropdownState.modelName}
                  productCode={dropdownState.productCode}
                  selectedMonth={selectedMonth}
                  isOpen={dropdownState.isOpen}
                  onToggle={handleProductCodeClick}
                  position={dropdownState.position}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리별 합계 시간 카드 */}
      {selectedProductCode && (
        <CategorySummaryCards selectedProductCode={selectedProductCode} />
      )}

      {/* 순수 HTML/CSS 바 차트 시각화 */}
      {selectedProductCode && selectedProductCode.categories && (
        <div className="charts-container">
          <h4>
             🎯 {selectedModel?.model_name} &gt; {selectedProductCode.product_code} 
             <span className="subtitle">Task별 평균 작업시간</span>
          </h4>
          
          {/* 카테고리별 HTML 바 차트 */}
          <div className="category-charts">
            {selectedProductCode.categories.map((category, index) => {
              if (!category || !category.tasks) return null;
              
              const chartData = getCategoryData(category.category);
              if (chartData.length === 0) return null;
              
              const maxHours = getMaxHours();
              
              return (
                <div key={index} className="category-chart-section" id={`category-section-${category.category}`}>
                  <div className="category-header">
                    <div 
                      className="category-indicator" 
                      style={{ backgroundColor: getCategoryColor(category.category) }}
                    ></div>
                    <h5>{category.category}</h5>
                    <span className="task-count">({chartData.length}개 작업)</span>
                  </div>
                  
                  {/* HTML/CSS 바 차트 */}
                  <div className="html-bar-chart">
                    {chartData.map((task, taskIndex) => {
                      const barWidth = (task.hours / maxHours) * 100;
                      return (
                        <div key={taskIndex} className="bar-row">
                          <div className="task-label">{task.name}</div>
                          <div className="bar-container">
                            <div 
                              className="bar"
                              style={{ 
                                width: `${barWidth}%`,
                                backgroundColor: getCategoryColor(category.category)
                              }}
                            >
                              <span className="bar-value">{task.hours.toFixed(1)}h</span>
                            </div>
                          </div>
                          <div className="task-info">
                            <span className="time-str">{task.time_str}</span>
                            <span className="sample-count">({task.sample_count}개)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="legend">
            <h5>카테고리 범례:</h5>
            <div className="legend-items">
              {selectedProductCode.categories.map(category => (
                <div key={category.category} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: getCategoryColor(category.category) }}
                  ></div>
                  <span>{category.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 요약 정보 */}
      <div className="summary-info">
        <div className="summary-card">
          <h5>📈 분석 요약</h5>
          <p>총 모델 수: {data.summary.total_models}개</p>
          <p>총 생산 대수: {calculateTotalProduction()}대</p>
          <p>총 레코드 수: {data.summary.total_records}개</p>
          <p>분석 기간: {data.date_range.start} ~ {data.date_range.end}</p>
        </div>
      </div>
    </div>
  );
};

export default CycleTimeAnalysis; 
