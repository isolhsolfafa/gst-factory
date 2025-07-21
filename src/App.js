import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import WeeklyChart from './components/WeeklyChart';
import MonthlyChart from './components/MonthlyChart';
import SummaryTable from './components/SummaryTable';
import DefectChart from './components/DefectChart';
import DefectMetrics from './components/DefectMetrics';
import KpiMetrics from './components/KpiMetrics';
import CycleTimeAnalysis from './components/CycleTimeAnalysis';
import './App.css';

// CT 분석 비밀번호 보호 컴포넌트
const CTAnalysisProtected = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // 실제 비밀번호 (실제 운영 시에는 환경변수나 보안 설정으로 관리)
  const CT_ANALYSIS_PASSWORD = '7979';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CT_ANALYSIS_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="ct-password-container">
        <div className="ct-password-card">
          <h2>🔒 CT 분석 - 사내 직원 전용</h2>
          <p>CT 분석 페이지는 사내 직원만 접근 가능합니다.</p>
          <form onSubmit={handleSubmit}>
            <div className="password-input-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="password-input"
                autoFocus
              />
              <button type="submit" className="password-submit-btn">
                접속하기
              </button>
            </div>
            {error && <p className="password-error">{error}</p>}
          </form>
          <div className="password-help">
            <small>💡 사내 직원이시라면 관리자에게 비밀번호를 문의하세요.</small>
          </div>
        </div>
      </div>
    );
  }
  
  return <CycleTimeAnalysis />;
};

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

  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    // 개발 환경에서는 Auth0 인증 건너뛰기
    if (process.env.NODE_ENV === 'development') {
      return; // 개발 환경에서는 자동 로그인 리다이렉트 비활성화
    }
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();  // Automatically redirect to login
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    // 개발 환경에서는 인증 확인 건너뛰기
    if (process.env.NODE_ENV === 'development') {
      // 개발 환경에서는 바로 데이터 fetch 실행
    } else if (!isAuthenticated) {
      return;  // If not authenticated, stop the function
    }

    const fetchData = async () => {
      try {
        const currentMonth = getCurrentMonth();

        // 1. Fetch weekly production data
        const weeklyResponse = await axios.get('/weekly_production.json');
        
        // 2. Fetch monthly production data and other info
        let headers = {};
        if (process.env.NODE_ENV !== 'development') {
          const token = await getAccessTokenSilently();
          headers = { Authorization: `Bearer ${token}` };
        }

        const response = await axios.get(`https://pda-api-extract.up.railway.app/api/factory`, { headers });
        const infoResponse = await axios.get(`https://pda-api-extract.up.railway.app/api/info?mode=monthly&month=${currentMonth}`, { headers });

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
  }, [isAuthenticated, getAccessTokenSilently]); // 개발 환경에서도 데이터 로드

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

const AuthButtons = () => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  // 개발 환경에서는 Auth 버튼 숨기기
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ textAlign: 'right', padding: '10px', position: 'relative', zIndex: 1 }}>
        <span style={{ color: '#666', fontSize: '14px' }}>🔧 개발 모드</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{ textAlign: 'right', padding: '10px' }}>
        👤 {user.name} &nbsp;
        <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
          로그아웃
        </button>
      </div>
    );
  } else {
    return (
      <div style={{ textAlign: 'right', padding: '10px' }}>
        <button onClick={() => loginWithRedirect()}>🔑 로그인</button>
      </div>
    );
  }
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
    <div className="App">
      <AuthButtons />
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
        <Link to="/cycle-time" style={{ textDecoration: 'none', flex: 1 }}>
          <button style={getButtonStyle('/cycle-time')}>📊 CT 분석</button>
        </Link>
      </div>
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<FactoryDashboard />} />
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/internal" element={<InternalDashboard />} />
          <Route path="/cycle-time" element={<CTAnalysisProtected />} />
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

const AuthWrapper = () => (
  <Auth0Provider
    domain={process.env.REACT_APP_AUTH0_DOMAIN}
    clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: process.env.REACT_APP_AUTH0_AUDIENCE
    }}
  >
    <AppWithRouter />
  </Auth0Provider>
);

export default AuthWrapper;
