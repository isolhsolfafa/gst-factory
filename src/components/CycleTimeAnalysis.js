import React, { useState, useEffect } from 'react';
import axios from 'axios';

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



// 개별 Task 막대그래프 컴포넌트
const TaskBarChart = ({ task, maxValue, isSwapped, onToggle, categoryColor }) => {
  const { 
    task_name, 
    total_samples, 
    original_avg_time, 
    clustered_avg_time, 
    difference_percent, 
    reliability,
    iqr_samples
  } = task;

  // 시간을 "X시간 Y분" 형태로 변환
  const formatTime = (hours) => {
    if (hours === 0) return "0분";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    if (h === 0) return `${m}분`;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  };

  // 신뢰도에 따른 스타일
  const getReliabilityColor = (reliability) => {
    const colors = {
      'high': '#4CAF50',
      'medium': '#FF9800', 
      'low': '#F44336'
    };
    return colors[reliability] || '#9E9E9E';
  };

  // 막대 너비 계산 (최대값 대비 퍼센트)
  const originalWidth = (original_avg_time / maxValue) * 100;
  const clusteredWidth = (clustered_avg_time / maxValue) * 100;
  
  // 표시할 값 결정 (스왑 상태에 따라)
  const primaryValue = isSwapped ? original_avg_time : clustered_avg_time;
  const secondaryValue = isSwapped ? clustered_avg_time : original_avg_time;
  const primaryWidth = isSwapped ? originalWidth : clusteredWidth;
  const secondaryWidth = isSwapped ? clusteredWidth : originalWidth;
  
  const primaryColor = isSwapped ? categoryColor : getReliabilityColor(reliability);
  const secondaryColor = isSwapped ? getReliabilityColor(reliability) : categoryColor;

  return (
    <div className="task-bar-chart" onClick={onToggle}>
      <div className="task-header">
        <div className="task-info">
          <span className="task-name">{task_name}</span>
          <span className="task-samples">({total_samples}개 샘플)</span>
        </div>
        <div className="task-values">
          <span className="primary-value" style={{ color: primaryColor }}>
            {primaryValue.toFixed(1)}h
          </span>
          <span className="value-separator">|</span>
          <span className="secondary-value" style={{ color: secondaryColor }}>
            {secondaryValue.toFixed(1)}h
          </span>
        </div>
      </div>
      
      <div className="bar-container">
        {/* 보조 막대 (배경, 반투명) */}
        <div 
          className="bar secondary-bar"
          style={{ 
            width: `${secondaryWidth}%`,
            backgroundColor: secondaryColor,
            opacity: 0.3
          }}
        />
        
        {/* 주요 막대 (전경, 선명) */}
        <div 
          className="bar primary-bar"
          style={{ 
            width: `${primaryWidth}%`,
            backgroundColor: primaryColor,
            opacity: 0.9
          }}
        />
        
        {/* 값 표시 */}
        <span className="bar-label" style={{ color: primaryColor }}>
          {formatTime(primaryValue)}
        </span>
      </div>
      
      <div className="task-footer">
        <span className="reliability-badge" style={{ backgroundColor: getReliabilityColor(reliability) }}>
          신뢰도: {reliability === 'high' ? '높음' : reliability === 'medium' ? '보통' : '낮음'}
        </span>
        <span className="difference-percent">
          차이: {difference_percent}%
        </span>
        <span className="iqr-info">
          IQR 샘플: {iqr_samples}개
        </span>
      </div>
    </div>
  );
};

// 작업분류별 총합 카드 컴포넌트
const CategorySummaryCard = ({ category, tasks, isSwapped, onToggle, categoryColor }) => {
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

  const style = getCategoryStyle(category);

  // 합계 계산
  const originalSum = tasks.reduce((sum, task) => sum + task.original_avg_time, 0);
  const clusteredSum = tasks.reduce((sum, task) => sum + task.clustered_avg_time, 0);
  const totalTasks = tasks.length;
  const totalSamples = tasks.reduce((sum, task) => sum + task.total_samples, 0);
  
  // 차이율 계산
  const differencePercent = originalSum > 0 ? 
    Math.abs(originalSum - clusteredSum) / originalSum * 100 : 0;

  // 표시할 값 결정 (스왑 상태에 따라)
  const primarySum = isSwapped ? originalSum : clusteredSum;
  const secondarySum = isSwapped ? clusteredSum : originalSum;
  const primaryLabel = isSwapped ? "평균시간 합계" : "IQR 군집도 합계";
  const secondaryLabel = isSwapped ? "IQR 군집도 합계" : "평균시간 합계";

  return (
    <div className="category-summary-card" onClick={onToggle}>
      <div className="summary-card-header">
        <div className="category-info">
          <span className="category-icon">{style.icon}</span>
          <h4 style={{ color: style.color }}>{category} 총합</h4>
          <span className="category-badge" style={{ backgroundColor: style.color }}>
            {totalTasks}개 작업
          </span>
        </div>
        <div className="swap-indicator">
          🔄
        </div>
      </div>
      
      <div className="summary-values">
        <div className="primary-sum" style={{ color: style.color }}>
          <span className="sum-label">{primaryLabel}:</span>
          <span className="sum-value">{primarySum.toFixed(1)}h</span>
          <span className="sum-formatted">({formatTime(primarySum)})</span>
        </div>
        <div className="secondary-sum" style={{ opacity: 0.7 }}>
          <span className="sum-label">{secondaryLabel}:</span>
          <span className="sum-value">{secondarySum.toFixed(1)}h</span>
          <span className="sum-formatted">({formatTime(secondarySum)})</span>
        </div>
      </div>
      
      <div className="summary-stats">
        <span className="total-samples">📊 총 {totalSamples}개 샘플</span>
        <span className="difference-badge" style={{ 
          backgroundColor: differencePercent < 10 ? '#4CAF50' : 
                          differencePercent < 30 ? '#FF9800' : '#F44336',
          color: 'white'
        }}>
          차이: {differencePercent.toFixed(1)}%
        </span>
      </div>
      
      <div className="click-hint">
        💡 클릭하여 평균 합계 ↔ IQR 합계 전환
      </div>
    </div>
  );
};

// 작업분류별 섹션 컴포넌트
const CategorySection = ({ category, tasks, swappedTasks, onTaskToggle, onCategoryToggle }) => {
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

  const style = getCategoryStyle(category);
  
  // 최대값 계산 (Y축 스케일 통일)
  const maxValue = Math.max(
    ...tasks.map(task => Math.max(task.original_avg_time, task.clustered_avg_time))
  ) * 1.1; // 10% 여유 공간

  // 카테고리 스왑 상태 확인
  const isCategorySwapped = swappedTasks.has(`category-${category}`);

  return (
    <div className="category-section" id={`category-${category}`}>
      {/* 카테고리 총합 카드 */}
      <CategorySummaryCard
        category={category}
        tasks={tasks}
        isSwapped={isCategorySwapped}
        onToggle={() => onCategoryToggle(`category-${category}`)}
        categoryColor={style.color}
      />
      
      <div className="category-header">
        <div className="category-title">
          <span className="category-icon">{style.icon}</span>
          <h3 style={{ color: style.color }}>{category} 상세</h3>
          <span className="task-count">({tasks.length}개 작업)</span>
        </div>
        <div className="category-description">
          <span className="legend-item">
            <span className="legend-dot primary" style={{ backgroundColor: style.color }}></span>
            기존 평균시간
          </span>
          <span className="legend-item">
            <span className="legend-dot secondary"></span>
            IQR 군집도 시간
          </span>
          <span className="toggle-hint">📌 개별 Task 클릭하여 주/보조 전환</span>
        </div>
      </div>
      
      <div className="tasks-container">
        {tasks.map((task, index) => (
          <TaskBarChart
            key={`${category}-${task.task_name}-${index}`}
            task={task}
            maxValue={maxValue}
            isSwapped={swappedTasks.has(`${category}-${task.task_name}`)}
            onToggle={() => onTaskToggle(`${category}-${task.task_name}`)}
            categoryColor={style.color}
          />
        ))}
      </div>
    </div>
  );
};

// S/N 드롭다운 메뉴 컴포넌트 (기존 유지)
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
                className="dropdown-item"
                onClick={() => handleSerialClick(serial)}
                title={serial.spreadsheet_link ? '스프레드시트로 이동' : '링크 없음'}
              >
                <span className="serial-number">{serial.serial_number}</span>
                <span className="serial-date">
                  {serial.manufacturing_start ? 
                    new Date(serial.manufacturing_start).toLocaleDateString('ko-KR') : 
                    'N/A'
                  }
                </span>
                {serial.spreadsheet_link && <span className="serial-link-icon">🔗</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 설명 팝업 컴포넌트
const ExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 평균시간 vs IQR 군집도 평균시간 설명</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="explanation-section">
            <h4>🟦 평균시간 (일반 평균)</h4>
            <div className="explanation-content">
              <div><strong>정의:</strong> 모든 샘플의 단순 산술 평균</div>
              <div><strong>계산:</strong> (모든 작업시간의 합) ÷ (총 샘플 수)</div>
              <div><strong>특징:</strong> 이상치(outlier)에 민감함</div>
              <div><strong>예시:</strong> [1h, 2h, 3h, 100h] → 평균 26.5시간</div>
            </div>
          </div>
          
          <div className="explanation-section">
            <h4>🟨 IQR 군집도 평균시간 (사분위 평균)</h4>
            <div className="explanation-content">
              <div><strong>정의:</strong> 1사분위(Q1)~3사분위(Q3) 범위 내 데이터만의 평균</div>
              <div><strong>계산:</strong> Q1 ≤ 작업시간 ≤ Q3 범위의 데이터만 사용</div>
              <div><strong>특징:</strong> 이상치 제거로 더 신뢰성 있는 평균</div>
              <div><strong>예시:</strong> [1h, 2h, 3h, 100h] → IQR 평균 2시간 (100h 제외)</div>
            </div>
          </div>
          
          <div className="explanation-section comparison">
            <h4>🔍 왜 IQR 군집도 평균을 사용하나요?</h4>
            <div className="comparison-grid">
              <div className="comparison-item">
                <h5>📈 일반 평균의 문제점</h5>
                <p>작업자가 실수하거나 특별한 상황으로 인해 매우 오래 걸린 작업이 있으면, 전체 평균이 크게 왜곡됩니다.</p>
              </div>
              <div className="comparison-item">
                <h5>🎯 IQR 평균의 장점</h5>
                <p>상위 25%와 하위 25%를 제외한 중간 50% 데이터만 사용하여, 실제 작업 패턴을 더 정확히 반영합니다.</p>
              </div>
            </div>
          </div>
          
          <div className="explanation-section">
            <h4>🚦 신뢰도 등급</h4>
            <div className="reliability-guide">
              <div className="reliability-item high">
                <span className="reliability-badge high">🟢 높음</span>
                <span>차이 10% 미만 - 매우 안정적인 작업시간</span>
              </div>
              <div className="reliability-item medium">
                <span className="reliability-badge medium">🟡 보통</span>
                <span>차이 10-30% - 보통 수준의 변동성</span>
                </div>
              <div className="reliability-item low">
                <span className="reliability-badge low">🔴 낮음</span>
                <span>차이 30% 이상 - 높은 변동성, 주의 필요</span>
              </div>
            </div>
          </div>
          
          <div className="explanation-section">
            <h4>💡 사용 팁</h4>
            <div className="explanation-content">
              <div><strong>계획 수립:</strong> IQR 군집도 평균을 기준으로 작업 계획 수립</div>
              <div><strong>성과 평가:</strong> 일반 평균과 비교하여 작업 안정성 평가</div>
              <div><strong>개선 포인트:</strong> 차이가 큰 작업은 표준화 필요</div>
              <div><strong>클릭 기능:</strong> 카드를 클릭하여 두 평균을 비교해보세요</div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>이해했습니다</button>
        </div>
      </div>
    </div>
  );
};

const CycleTimeAnalysis = () => {
  const [data, setData] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('task'); // 'task' 또는 'product'
  const [swappedTasks, setSwappedTasks] = useState(new Set()); // 스왑된 Task들 추적
  const [isModalOpen, setIsModalOpen] = useState(false); // 설명 팝업 상태
  
  // 기간 분석 모드 상태 추가
  const [periodMode, setPeriodMode] = useState('single'); // 'single' 또는 'range'
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  
  // 선택된 Product Code 상태 (첫 번째를 기본값으로)
  const [selectedProductCode, setSelectedProductCode] = useState(null);
  
  // 동적 월 옵션 생성 및 현재 월을 기본값으로 설정
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '2025-06');
  
  // 동적 모델 목록
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(''); // 초기값 빈 문자열로 설정
  
  // S/N 드롭다운 상태 관리
  const [dropdownState, setDropdownState] = useState({
    isOpen: false,
    modelName: null,
    productCode: null,
    position: { x: 0, y: 0 }
  });

  // 사용 가능한 모델 목록 가져오기
  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/models`);
      if (response.data && response.data.models) {
        setAvailableModels(response.data.models);
        // 첫 번째 모델을 기본값으로 설정
        if (response.data.models.length > 0 && !selectedModel) {
          setSelectedModel(response.data.models[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      // 오류 시 기본 모델 목록 사용
      const defaultModels = ['GAIA-I DUAL', 'GAIA-I', 'DRAGON', 'GAIA-II DUAL', 'SWS-I', 'GAIA-II', 'GAIA-P DUAL', 'DRAGON DUAL', 'GALLANT-A'];
      setAvailableModels(defaultModels);
      if (!selectedModel) {
        setSelectedModel(defaultModels[0]);
      }
    }
  };

  // 기간합산 모드 초기화
  useEffect(() => {
    if (monthOptions.length >= 2) {
      // 가장 최근 2개월을 기본값으로 설정 (예: 2025-07, 2025-06)
      setStartMonth(monthOptions[1]?.value || '2025-06'); // 두 번째가 6월
      setEndMonth(monthOptions[0]?.value || '2025-07');   // 첫 번째가 7월
    }
  }, [monthOptions]);

  // periodMode 변경 시 처리
  const handlePeriodModeChange = (mode) => {
    setPeriodMode(mode);
    if (mode === 'range' && startMonth && endMonth) {
      // 기간합산 모드로 전환 시 데이터 다시 로드
      if (viewMode === 'task') {
        fetchTaskData();
      } else {
        fetchProductCodeData();
      }
    } else if (mode === 'single') {
      // 단일월 모드로 전환 시 데이터 다시 로드
      if (viewMode === 'task') {
        fetchTaskData();
      } else {
        fetchProductCodeData();
      }
    }
  };

  // Task별 분석 데이터 가져오기 (새로운 API)
  const fetchTaskData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let apiParams = {
        model_name: selectedModel
      };
      
      // 기간 모드에 따라 파라미터 설정
      if (periodMode === 'single') {
        apiParams.month = selectedMonth;
      } else if (periodMode === 'range') {
        // 기간합산 모드: start_month, end_month 사용
        if (!startMonth || !endMonth) {
          setError('기간합산 분석을 위해 시작월과 종료월을 모두 선택해주세요.');
          setLoading(false);
          return;
        }
        apiParams.start_month = startMonth;
        apiParams.end_month = endMonth;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/task_analysis`, {
        params: apiParams
      });
      
      if (response.data && response.data.categories) {
        setTaskData(response.data);
      } else {
        setError('데이터 구조가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('Task analysis data fetch failed:', err);
      setError(`Task별 분석 데이터를 불러오는데 실패했습니다: ${err.message}`);
      setTaskData(null);
    }
    
    setLoading(false);
  };

  // 기존 Product Code별 데이터 가져오기 (기간합산 지원)
  const fetchProductCodeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let apiParams = {};
        
        // 기간 모드에 따라 파라미터 설정
        if (periodMode === 'single') {
          apiParams.month = selectedMonth;
        } else if (periodMode === 'range') {
          // 기간합산 모드: start_month, end_month 사용
          if (!startMonth || !endMonth) {
            setError('기간합산 분석을 위해 시작월과 종료월을 모두 선택해주세요.');
            setLoading(false);
            return;
          }
          apiParams.start_month = startMonth;
          apiParams.end_month = endMonth;
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/cycle_time/monthly`, {
          params: apiParams
        });
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

  // 컴포넌트 마운트 시 모델 목록 불러오기
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  // 데이터 로드 (selectedModel이 설정된 후에만 실행)


  // 데이터가 로드되면 첫 번째 Product Code를 자동 선택
  useEffect(() => {
    if (data && data.models && data.models.length > 0 && viewMode === 'product') {
      const currentModel = data.models.find(model => model.model_name === selectedModel);
      if (currentModel && currentModel.product_codes && currentModel.product_codes.length > 0) {
        // 첫 번째 Product Code를 기본 선택
        if (!selectedProductCode) {
          setSelectedProductCode(currentModel.product_codes[0].product_code);
        }
      }
    }
  }, [data, selectedModel, viewMode, selectedProductCode]);

  // 기간합산 모드에서 startMonth, endMonth 변경 시 자동 로드
  useEffect(() => {
    if (periodMode === 'range' && startMonth && endMonth && selectedModel) {
      // 시작월이 종료월보다 늦지 않은지 검증
      const start = new Date(startMonth + '-01');
      const end = new Date(endMonth + '-01');
      
      if (start <= end) {
        if (viewMode === 'task') {
          fetchTaskData();
        } else {
          fetchProductCodeData();
        }
      }
    }
  }, [startMonth, endMonth, selectedModel, periodMode, viewMode]);

  // 단일월 모드에서 selectedMonth 변경 시 자동 로드 (기존 useEffect 수정)
  useEffect(() => {
    if (periodMode === 'single' && selectedMonth && selectedModel) {
      if (viewMode === 'task') {
        fetchTaskData();
      } else {
        fetchProductCodeData();
      }
    }
  }, [selectedMonth, selectedModel, periodMode, viewMode]);

  // 뷰 모드 토글
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'task' ? 'product' : 'task');
  };

  // 클릭 네비게이션 핸들러
  const handleModelClick = (modelName) => {
    setSelectedModel(modelName);
    setSelectedProductCode(null); // Product Code 선택 초기화
    setViewMode('product'); // 상세분석 모드로 전환
  };

  const handleProductCodeClick = (productCode) => {
    setSelectedProductCode(productCode);
  };

  const handleBackToOverview = () => {
    setSelectedProductCode(null);
    setViewMode('task'); // Task 분석 모드로 돌아가기
  };

  // Product Code 버튼 클릭 핸들러 (드롭다운 토글)
  const handleProductCodeButtonClick = (event, modelName, productCode) => {
    event.stopPropagation();
    
    // 차트 전환
    setSelectedProductCode(productCode);
    
    // 드롭다운 토글
    if (dropdownState.isOpen && dropdownState.productCode === productCode) {
      setDropdownState({ isOpen: false, modelName: null, productCode: null });
    } else {
      setDropdownState({ isOpen: true, modelName, productCode });
    }
  };

  // 드롭다운 외부 클릭시 닫기
  const handleOutsideClick = () => {
    setDropdownState({ isOpen: false, modelName: null, productCode: null });
  };

  useEffect(() => {
    if (dropdownState.isOpen) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [dropdownState.isOpen]);

  // Task 스왑 토글
  const handleTaskToggle = (taskKey) => {
    setSwappedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskKey)) {
        newSet.delete(taskKey);
      } else {
        newSet.add(taskKey);
      }
      return newSet;
    });
  };

  // 카테고리 스왑 토글
  const handleCategoryToggle = (categoryKey) => {
    setSwappedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  // 카테고리로 스크롤하는 함수
  const scrollToCategory = (categoryName) => {
    const categoryElement = document.getElementById(`category-${categoryName}`);
    if (categoryElement) {
      categoryElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  if (loading) {
    return (
      <div className="cycle-time-analysis loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cycle-time-analysis error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cycle-time-analysis">
      {/* 헤더 컨트롤 */}
      <div className="analysis-header">
        <div className="header-controls">
          {/* 기간 모드 선택 */}
          <div className="control-group period-mode-group">
            <label>📅 분석 기간:</label>
            <div className="period-mode-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="periodMode"
                  value="single"
                  checked={periodMode === 'single'}
                  onChange={(e) => handlePeriodModeChange(e.target.value)}
                />
                <span>단일월 분석</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="periodMode"
                  value="range"
                  checked={periodMode === 'range'}
                  onChange={(e) => handlePeriodModeChange(e.target.value)}
                />
                <span>기간합산 분석</span>
              </label>
            </div>
          </div>

          {/* 월 선택 (조건부 렌더링) */}
          {periodMode === 'single' ? (
            <div className="control-group">
              <label htmlFor="month-select">📆 분석 월:</label>
              <select 
                id="month-select"
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-selector"
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="control-group range-selector">
              <label>📅 분석 기간:</label>
              <div className="range-inputs">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="month-selector"
                >
                  <option value="">시작월 선택</option>
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="range-separator">~</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="month-selector"
                >
                  <option value="">종료월 선택</option>
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="control-group">
            <label htmlFor="model-select">🏭 모델:</label>
            <select 
              id="model-select"
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-selector"
            >
              {availableModels.length === 0 ? (
                <option value="">모델 불러오는 중...</option>
              ) : (
                availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))
              )}
          </select>
        </div>

          <div className="control-group">
            <button 
              className={`view-toggle-btn ${viewMode}`}
              onClick={toggleViewMode}
              title={viewMode === 'task' ? 'Product Code별 상세보기로 전환' : 'Task별 분석보기로 전환'}
            >
              {viewMode === 'task' ? '📊 Task 분석' : '📋 상세 분석'}
            </button>
      </div>

          <div className="control-group">
            <button
              className="help-btn"
              onClick={() => setIsModalOpen(true)}
              title="평균시간 vs IQR 군집도 평균시간 설명"
            >
              ❓ 설명
            </button>
          </div>
        </div>

        <div className="analysis-info">
          <h2>
            {viewMode === 'task' ? '🎯 Task별 IQR 군집도 분석' : '📋 Product Code별 상세 분석'}
          </h2>
          <p className="analysis-description">
            {viewMode === 'task' 
              ? `${selectedModel} 모델의 개별 Task별 기존 평균시간과 IQR 군집도 평균시간을 비교합니다. 클릭하여 주/보조 막대를 전환할 수 있습니다.`
              : `${selectedModel} 모델의 Product Code별 세부 작업시간을 확인할 수 있습니다.`
            }
          </p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {viewMode === 'task' ? (
        // 새로운 Task별 분석 뷰
        <div className="task-analysis-view">
          


          {taskData ? (
            <>
              <div className="analysis-summary">
                <h3>📊 {selectedModel} - {selectedMonth} Task별 분석</h3>
                <p className="summary-note">{taskData.analysis_note}</p>
                <div className="summary-stats">
                  <span>총 {taskData.total_tasks}개 작업</span>
                  <span className="swap-info">
                    💡 막대를 클릭하여 기존 평균 ↔ IQR 군집도 시간 전환
                  </span>
                </div>
              </div>

              {/* Task 분석용 카테고리 요약 카드 */}
              <div className="task-category-summary-cards">
                <h3>📊 공정별 작업시간 합계</h3>
                <div className="summary-cards-grid">
                  {(() => {
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

                    return taskData.categories.map(categoryData => {
                      const style = getCategoryStyle(categoryData.category);
                      // 카테고리별 합계 계산
                      const originalSum = categoryData.tasks.reduce((sum, task) => sum + task.original_avg_time, 0);
                      const clusteredSum = categoryData.tasks.reduce((sum, task) => sum + task.clustered_avg_time, 0);
                      const totalSamples = categoryData.tasks.reduce((sum, task) => sum + task.total_samples, 0);
                      
                      const difference = Math.abs(originalSum - clusteredSum);
                      const diffPercent = originalSum > 0 ? (difference / originalSum) * 100 : 0;
                      
                                              return (
                          <div 
                            key={categoryData.category} 
                            className="summary-card clickable"
                            style={{borderColor: style.color}}
                            onClick={() => scrollToCategory(categoryData.category)}
                          >
                            <div className="card-header">
                              <span className="category-icon">{style.icon}</span>
                              <span className="category-name">{categoryData.category}</span>
                            </div>
                            <div className="card-content">
                              <div className="main-value" style={{color: style.color}}>
                                {clusteredSum.toFixed(1)}h
                              </div>
                              <div className="value-labels">
                                <span className="main-label">IQR 합계</span>
                                <span className="sub-value">평균 합계 {originalSum.toFixed(1)}h</span>
                              </div>
                              <div className="summary-stats">
                                <div className="total-samples">{categoryData.tasks.length}개 작업</div>
                                <div className="difference-badge" style={{
                                  backgroundColor: diffPercent >= 30 ? '#ffebee' : diffPercent >= 10 ? '#fff3e0' : '#e8f5e8',
                                  color: diffPercent >= 30 ? '#c62828' : diffPercent >= 10 ? '#ef6c00' : '#2e7d32'
                                }}>
                                  {diffPercent.toFixed(1)}% 차이
                                </div>
                              </div>
                              <div className="click-hint">클릭으로 스크롤</div>
                            </div>
                          </div>
                        );
                    });
                  })()}
                </div>
              </div>

              <div className="categories-container">

                {taskData.categories.map((categoryData, index) => (
                  <CategorySection
                    key={index}
                    category={categoryData.category}
                    tasks={categoryData.tasks}
                    swappedTasks={swappedTasks}
                    onTaskToggle={handleTaskToggle}
                    onCategoryToggle={handleCategoryToggle}
                  />
                ))}
              </div>
            </>
                      ) : loading ? (
            <div className="loading">📊 데이터를 불러오는 중...</div>
          ) : (
            <div className="no-data">
              ⚠️ 데이터 로딩 문제 발생
              <br/>
              <small>
                loading: {loading.toString()}<br/>
                taskData: {taskData ? 'exists' : 'null'}<br/>
                categories: {taskData?.categories ? taskData.categories.length : 'none'}
              </small>
            </div>
          )}
        </div>
      ) : (
        // 기존 스타일 Product Code별 상세 뷰 (클릭 네비게이션 포함)
        <div className="product-code-view">
          {data && data.models && data.models.length > 0 ? (
            data.models
              .filter(model => model.model_name === selectedModel)
              .map((modelData, index) => (
              <div key={index} className="model-analysis">
                {/* 상단 카테고리 요약 카드들 */}
                <div className="category-summary-cards">
                  <h3>📊 공정별 {selectedProductCode ? '작업 시간 합계' : '작업별 평균시간 합계'}</h3>
                  <div className="summary-cards-grid">
                                          {(() => {
                        // 선택된 Product Code 또는 전체 모델의 카테고리별 평균시간 계산
                        const categoryTotals = {};
                        const categoryTaskCounts = {};
                        
                        const targetProductCodes = selectedProductCode 
                          ? modelData.product_codes?.filter(pc => pc.product_code === selectedProductCode)
                          : modelData.product_codes;
                        
                        if (selectedProductCode) {
                          // Product Code 선택시: 해당 Product Code의 Task들의 합계
                          targetProductCodes?.forEach(pc => {
                            pc.categories?.forEach(cat => {
                              if (!categoryTotals[cat.category]) {
                                categoryTotals[cat.category] = 0;
                                categoryTaskCounts[cat.category] = 0;
                              }
                              const categoryTime = cat.tasks ? 
                                cat.tasks.reduce((sum, task) => sum + (task.avg_hours || task.avg_time || 0), 0) : 0;
                              categoryTotals[cat.category] += categoryTime;
                              categoryTaskCounts[cat.category] += (cat.tasks?.length || 0);
                            });
                          });
                        } else {
                          // 모델 전체시: 같은 작업명끼리 평균을 구한 후 합계
                          const taskAverages = {}; // {category: {taskName: [시간들...]}}
                          
                          targetProductCodes?.forEach(pc => {
                            pc.categories?.forEach(cat => {
                              if (!taskAverages[cat.category]) {
                                taskAverages[cat.category] = {};
                              }
                              cat.tasks?.forEach(task => {
                                const taskName = task.task_name;
                                const taskTime = task.avg_hours || task.avg_time || 0;
                                
                                if (!taskAverages[cat.category][taskName]) {
                                  taskAverages[cat.category][taskName] = [];
                                }
                                taskAverages[cat.category][taskName].push(taskTime);
                              });
                            });
                          });
                          
                          // 각 카테고리별로 작업명별 평균을 구하고 합계
                          Object.keys(taskAverages).forEach(category => {
                            let categoryTotal = 0;
                            let taskCount = 0;
                            
                            Object.keys(taskAverages[category]).forEach(taskName => {
                              const times = taskAverages[category][taskName];
                              if (times.length > 0) {
                                // 같은 작업명의 평균시간 계산
                                const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
                                categoryTotal += avgTime;
                                taskCount++;
                              }
                            });
                            
                            categoryTotals[category] = categoryTotal;
                            categoryTaskCounts[category] = taskCount;
                          });
                        }

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

                      return ['기구', '전장', 'TMS_반제품', '검사', '마무리', '기타'].map(category => {
                        const style = getCategoryStyle(category);
                        const totalTime = categoryTotals[category] || 0;
                        const taskCount = categoryTaskCounts[category] || 0;
                        
                        return (
                          <div 
                            key={category} 
                            className="summary-card clickable" 
                            style={{borderColor: style.color}}
                            onClick={() => scrollToCategory(category)}
                          >
                            <div className="card-header">
                              <span className="category-icon">{style.icon}</span>
                              <span className="category-name">{category}</span>
                            </div>
                            <div className="card-content">
                              <div className="total-hours" style={{color: style.color}}>
                                {totalTime.toFixed(1)}h
                              </div>
                              <div className="formatted-time">{taskCount}개 작업</div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Product Code 선택 버튼들 */}
      <div className="product-code-section">
                  <h3>🎯 {modelData.model_name} Product Code 선택</h3>
        <div className="product-code-list">
                      {modelData.product_codes && modelData.product_codes.length > 0 ? (
                        modelData.product_codes.map((productCode, pcIndex) => (
                          <div key={pcIndex} className="product-code-item" style={{ position: 'relative' }}>
              <button
                              className={`product-code-btn ${selectedProductCode === productCode.product_code ? 'active' : ''}`}
                              onClick={(e) => handleProductCodeButtonClick(e, selectedModel, productCode.product_code)}
                            >
                              {productCode.product_code}
                              <span className="star-rating">★{productCode.production_count}대</span>
              </button>
              
              {/* 드롭다운이 이 Product Code에 해당할 때만 표시 */}
                            {dropdownState.isOpen && 
                             dropdownState.productCode === productCode.product_code && 
                             dropdownState.modelName === selectedModel && (
                <SerialNumberDropdown
                                modelName={selectedModel}
                                productCode={productCode.product_code}
                  selectedMonth={selectedMonth}
                                isOpen={true}
                                onToggle={() => setDropdownState({ isOpen: false, modelName: null, productCode: null })}
                />
              )}
            </div>
                        ))
                      ) : (
                        <div className="no-product-data">Product Code 데이터가 없습니다.</div>
                      )}
        </div>
      </div>

                {/* 선택된 Product Code의 상세 차트 */}
                {selectedProductCode && modelData.product_codes
                  .filter(pc => pc.product_code === selectedProductCode)
                  .map((productCode, pcIndex) => (
                  <div key={pcIndex} className="charts-container">
                    <h4>
                      📊 {productCode.product_code} 작업시간 분석
                      <span className="subtitle">({productCode.production_count}대 생산)</span>
          </h4>
          
          <div className="category-charts">
                      {productCode.categories && productCode.categories.map((category, catIndex) => {
                        if (!category.tasks || category.tasks.length === 0) return null;
                        
                        const getCategoryStyle = (cat) => {
                          const styles = {
                            '기구': { color: '#8884d8', icon: '🔧' },
                            '전장': { color: '#82ca9d', icon: '⚡' },
                            'TMS_반제품': { color: '#ffc658', icon: '🏭' },
                            '검사': { color: '#ff7c7c', icon: '🔍' },
                            '마무리': { color: '#d084d0', icon: '✅' },
                            '기타': { color: '#8dd1e1', icon: '📋' }
                          };
                          return styles[cat] || { color: '#8884d8', icon: '📊' };
                        };
                        
                        const style = getCategoryStyle(category.category);
                        const maxTime = Math.max(...category.tasks.map(task => task.avg_hours || task.avg_time || 0));
              
              return (
                          <div key={catIndex} className="category-chart-section" id={`category-${category.category}`}>
                  <div className="category-header">
                              <div className="category-indicator" style={{backgroundColor: style.color}}></div>
                              <h5>{style.icon} {category.category}</h5>
                              <span className="task-count">({category.tasks.length}개 작업)</span>
                  </div>
                  
                  <div className="html-bar-chart">
                              {category.tasks
                                .sort((a, b) => {
                                  const timeA = a.avg_hours || a.avg_time || 0;
                                  const timeB = b.avg_hours || b.avg_time || 0;
                                  return timeB - timeA; // 내림차순 정렬 (큰 시간부터)
                                })
                                .map((task, taskIndex) => {
                                const taskTime = task.avg_hours || task.avg_time || 0;
                                const barWidth = maxTime > 0 ? (taskTime / maxTime) * 100 : 0;
                                
                      return (
                        <div key={taskIndex} className="bar-row">
                                    <div className="task-label">{task.task_name}</div>
                          <div className="bar-container">
                            <div 
                              className="bar"
                              style={{ 
                                width: `${barWidth}%`,
                                          backgroundColor: style.color
                              }}
                            >
                                        <span className="bar-value">{taskTime.toFixed(1)}h</span>
                            </div>
                          </div>
                          <div className="task-info">
                                      <div className="time-str">{taskTime.toFixed(1)}h</div>
                                      <div className="sample-count">({task.sample_count || 0}회)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
                  </div>
                ))}

                {/* 하단 요약 정보 */}
                <div className="summary-info">
                  <div className="summary-card">
                    <h5>📋 분석 요약</h5>
                    <p>모델: {modelData.model_name}</p>
                    <p>총 생산 대수: {modelData.product_codes?.reduce((sum, pc) => sum + (pc.production_count || 0), 0) || 0}대</p>
                    <p>Product Code 수: {modelData.product_codes?.length || 0}개</p>
                    <p>분석 기간: {data.date_range?.start?.split('T')[0]} ~ {data.date_range?.end?.split('T')[0]}</p>
                    {selectedProductCode && (
                      <p>선택된 Product Code: {selectedProductCode}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : data && data.models && data.models.length > 0 ? (
            <div className="no-model-data">
              <p>⚠️ 선택한 모델 "{selectedModel}"에 대한 데이터가 없습니다.</p>
              <p>다른 모델을 선택해주세요.</p>
            </div>
          ) : (
            <div className="loading-state">
              <p>📊 데이터를 불러오는 중...</p>
          </div>
          )}
        </div>
      )}

      {/* 설명 팝업 */}
      <ExplanationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default CycleTimeAnalysis; 
