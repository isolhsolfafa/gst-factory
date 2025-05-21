import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import WeeklyChart from './components/WeeklyChart';
import MonthlyChart from './components/MonthlyChart';
import SummaryTable from './components/SummaryTable';
import DefectChart from './components/DefectChart';
import DefectMetrics from './components/DefectMetrics';
import KpiMetrics from './components/KpiMetrics';
import './App.css';

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (KST)`;
};

const getCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// 공장 대시보드 컴포넌트
const FactoryDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    weekly_production: [],
    monthly_production: [],
    summary_table: [],
    weekly_production_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentMonth = getCurrentMonth();
        const response = await axios.get(`https://pda-api-extract.up.railway.app/api/factory`);
        console.log("API Response (/api/factory):", response.data);

        const infoResponse = await axios.get(`https://pda-api-extract.up.railway.app/api/info?mode=monthly&month=${currentMonth}`);
        console.log("API Response (/api/info):", infoResponse.data);

        setDashboardData({
          weekly_production: response.data.weekly_production || [],
          monthly_production: response.data.monthly_production || [],
          summary_table: infoResponse.data.summary_table || [],
          weekly_production_message: response.data.weekly_production_message || ''
        });
        setLoading(false);
      } catch (err) {
        console.error("API Error:", err);
        setError('데이터를 불러오는 데 실패했습니다.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentTime = formatDateTime(new Date());

  return (
    <div>
      <div className="header">
        <img src="https://rainbow-haupia-cd8290.netlify.app/GST_banner.jpg" alt="Build up GST Banner" />
        <h1>제조기술1팀 공장 대시보드 - 2025년 20주차</h1>
        <p>실행 시간: {currentTime}</p>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="top-grid">
            <WeeklyChart data={dashboardData.weekly_production} />
            <MonthlyChart data={dashboardData.monthly_production} />
            <DefectChart />
          </div>
          <div className="chart-section summary-section">
            <SummaryTable data={dashboardData} />
          </div>
          <div className="bottom-grid">
            <DefectMetrics />
            <KpiMetrics />
          </div>
        </>
      )}
    </div>
  );
};

// 협력사 대시보드 컴포넌트 (정적 HTML 대체)
const PartnerDashboard = () => {
  return (
    <div>
      <h2>🤝 협력사 대시보드</h2>
      <p>여기에 협력사 대시보드 콘텐츠를 추가하세요.</p>
      {/* partner.html 내용을 React 컴포넌트로 변환 */}
    </div>
  );
};

// 내부 대시보드 컴포넌트 (비밀번호 보호 포함)
const InternalDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const password = prompt("🔐 내부 대시보드 접근을 위한 비밀번호를 입력하세요:");
    if (password === "0979") {
      setIsAuthenticated(true);
    } else {
      alert("❌ 비밀번호가 틀렸습니다. 접근이 제한됩니다.");
      navigate('/');
    }
  }, [navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h2>🔒 내부 대시보드</h2>
      <p>여기에 내부 대시보드 콘텐츠를 추가하세요.</p>
      {/* internal.html 내용을 React 컴포넌트로 변환 */}
    </div>
  );
};

// 메뉴탭과 라우팅을 포함한 메인 App 컴포넌트
const App = () => {
  const location = useLocation();

  const getButtonStyle = (path) => ({
    width: '100%',
    padding: '14px 16px',
    background: location.pathname === path ? '#007acc' : '#1a1a1a',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer'
  });

  return (
    <div>
      <div className="tab" style={{ display: 'flex', background: '#1a1a1a', color: 'white' }}>
        <Link to="/" style={{ textDecoration: 'none', flex: 1 }}>
          <button style={getButtonStyle('/')}>🏭 공장 대시보드</button>
        </Link>
        <Link to="/partner" style={{ textDecoration: 'none', flex: 1 }}>
          <button style={getButtonStyle('/partner')}>🤝 협력사 대시보드</button>
        </Link>
        <Link to="/internal" style={{ textDecoration: 'none', flex: 1 }}>
          <button style={getButtonStyle('/internal')}>🔒 내부 대시보드</button>
        </Link>
      </div>
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<FactoryDashboard />} />
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/internal" element={<InternalDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

// App must be wrapped in Router for useLocation to work, so we export a wrapper
const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;
