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

const getCurrentWeek = () => {
  const now = new Date();
  const [year, week] = [now.getFullYear(), getWeekNumber(now)];
  return `${year}년 ${week}주차`;
};

const getWeekNumber = (date) => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  return weekNumber;
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

        // 1. 주간 생산 정적 파일
        const weeklyResponse = await axios.get('/weekly_production.json');
        // 2. 월간 생산(및 기타) API
        const response = await axios.get(`https://pda-api-extract.up.railway.app/api/factory`);
        const infoResponse = await axios.get(`https://pda-api-extract.up.railway.app/api/info?mode=monthly&month=${currentMonth}`);

        setDashboardData({
          weekly_production: weeklyResponse.data || [],
          monthly_production: response.data.monthly_production || [],
          summary_table: infoResponse.data.summary_table || [],
          weekly_production_message: response.data.weekly_production_message || ''
        });
        setLoading(false);
      } catch (err) {
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
        <h1>제조기술1팀 공장 대시보드 - {getCurrentWeek()}</h1>
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

// 협력사 대시보드 컴포넌트 (iframe으로 partner.html 연동)
const PartnerDashboard = () => (
  <iframe
    src="/partner.html"
    title="Partner Dashboard"
    style={{ width: '100%', height: '95vh', border: 'none' }}
  />
);

// 내부 대시보드 컴포넌트 (비밀번호 보호 포함, iframe으로 internal.html 연동)
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

  if (!isAuthenticated) return null;

  return (
    <iframe
      src="/internal.html"
      title="Internal Dashboard"
      style={{ width: '100%', height: '95vh', border: 'none' }}
    />
  );
};

// 메뉴탭과 라우팅을 포함한 메인 App 컴포넌트
const App = () => {
  const location = useLocation();

  useEffect(() => {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-F7HTZVLPLF';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-F7HTZVLPLF');
    `;
    document.head.appendChild(script2);
  }, []);

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
