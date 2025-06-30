# 🏭 GST Factory Dashboard

**GST 제조기술1팀 공장 대시보드 - React Frontend**

실시간 생산 데이터 모니터링 및 분석을 위한 현대적인 웹 대시보드입니다.

[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=flat-square&logo=netlify)](https://rainbow-haupia-cd8290.netlify.app/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.3-FF6384?style=flat-square&logo=chartdotjs)](https://www.chartjs.org/)

## 📋 목차

- [🎯 프로젝트 개요](#-프로젝트-개요)
- [✨ 주요 기능](#-주요-기능)
- [🛠️ 기술 스택](#️-기술-스택)
- [🚀 시작하기](#-시작하기)
- [📱 대시보드 구성](#-대시보드-구성)
- [🔐 인증 시스템](#-인증-시스템)
- [📊 API 연동](#-api-연동)
- [🌐 배포](#-배포)
- [🤝 기여하기](#-기여하기)

## 🎯 프로젝트 개요

GST Factory Dashboard는 제조업 현장의 실시간 생산 데이터를 시각화하고 모니터링하는 웹 애플리케이션입니다. React 기반으로 구축되어 있으며, 직관적인 차트와 지표를 통해 생산 현황을 한눈에 파악할 수 있습니다.

### 🎮 실제 서비스
- **공장 대시보드**: [https://rainbow-haupia-cd8290.netlify.app/](https://rainbow-haupia-cd8290.netlify.app/)
- **백엔드 API**: [https://pda-api-extract.up.railway.app/](https://pda-api-extract.up.railway.app/)

## ✨ 주요 기능

### 📈 실시간 데이터 시각화
- **주간 생산량 차트**: 주별 생산 현황 및 목표 대비 달성률
- **월간 생산량 차트**: 월별 생산 트렌드 분석
- **불량률 모니터링**: 실시간 품질 지표 추적
- **KPI 지표**: 핵심 성과 지표 대시보드

### 🏢 다중 대시보드 시스템
- **공장 대시보드**: 일반 생산 현황 (Auth0 인증 필요)
- **협력사 대시보드**: 파트너사용 별도 화면
- **내부 대시보드**: 비밀번호 보호된 관리자용 화면

### 🔒 보안 기능
- **Auth0 인증**: 안전한 OAuth 기반 사용자 인증
- **자동 로그인 리다이렉트**: 미인증 사용자 자동 처리
- **비밀번호 보호**: 내부 대시보드 추가 보안

## 🛠️ 기술 스택

### Frontend
- **React** 18.2.0 - UI 라이브러리
- **React Router** - SPA 라우팅
- **Chart.js** 4.4.3 - 차트 라이브러리
- **Recharts** 2.12.7 - React 차트 컴포넌트
- **Axios** 1.7.2 - HTTP 클라이언트

### 인증 & 보안
- **Auth0** - OAuth 2.0 인증 서비스
- **@auth0/auth0-react** - React Auth0 SDK

### 개발 도구
- **React Scripts** 5.0.1 - 개발 환경 구성
- **Create React App** - 프로젝트 보일러플레이트

## 🚀 시작하기

### 사전 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **리포지토리 클론**
```bash
git clone https://github.com/isolhsolfafa/gst-factory.git
cd gst-factory
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
# .env 파일 생성
REACT_APP_AUTH0_DOMAIN=your-auth0-domain
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
REACT_APP_AUTH0_AUDIENCE=your-auth0-audience
REACT_APP_API_BASE_URL=https://pda-api-extract.up.railway.app
```

4. **개발 서버 실행**
```bash
npm start
```

5. **브라우저에서 확인**
```
http://localhost:3000
```

### 빌드

```bash
npm run build
```

## 📱 대시보드 구성

### 🏭 공장 대시보드 (`/`)
```
┌─────────────────────────────────────────┐
│           GST 배너 & 헤더                │
├─────────────────────────────────────────┤
│  주간차트  │  월간차트  │  불량률차트   │
├─────────────────────────────────────────┤
│            요약 테이블                   │
├─────────────────────────────────────────┤
│  불량률지표  │      KPI 지표            │
└─────────────────────────────────────────┘
```

**포함 컴포넌트:**
- `WeeklyChart.js` - 주간 생산량 차트
- `MonthlyChart.js` - 월간 생산량 차트
- `DefectChart.js` - 불량률 차트
- `SummaryTable.js` - 상세 데이터 테이블
- `DefectMetrics.js` - 불량률 지표
- `KpiMetrics.js` - KPI 지표

### 🤝 협력사 대시보드 (`/partner`)
- iframe으로 `partner.html` 로드
- 별도 인증 불필요

### 🔒 내부 대시보드 (`/internal`)
- 비밀번호 "0979" 필요
- iframe으로 `internal.html` 로드
- 틀린 비밀번호 시 자동 메인으로 리다이렉트

## 🔐 인증 시스템

### Auth0 설정
```javascript
// Auth0 Provider 설정
<Auth0Provider
  domain={process.env.REACT_APP_AUTH0_DOMAIN}
  clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE
  }}
>
```

### 자동 인증 흐름
1. 사용자가 대시보드 접근
2. 인증 상태 확인
3. 미인증 시 자동으로 Auth0 로그인 페이지로 리다이렉트
4. 인증 완료 후 대시보드 표시

## 📊 API 연동

### 데이터 소스
- **백엔드 API**: `https://pda-api-extract.up.railway.app`
- **정적 데이터**: `/weekly_production.json`

### API 엔드포인트
```javascript
// 월간 생산 데이터
GET /api/factory

// 상세 정보 데이터
GET /api/info?mode=monthly&month=${currentMonth}

// 주간 생산 데이터 (정적)
GET /weekly_production.json
```

### 인증 헤더
```javascript
const token = await getAccessTokenSilently();
const headers = { Authorization: `Bearer ${token}` };
```

## 🌐 배포

### Netlify 배포
1. **자동 배포**: GitHub 푸시 시 자동 배포
2. **환경 변수**: Netlify 대시보드에서 설정
3. **빌드 명령어**: `npm run build`
4. **배포 디렉토리**: `build/`

### 배포 URL
- **Production**: https://rainbow-haupia-cd8290.netlify.app/

### 환경 변수 (Netlify)
```
REACT_APP_AUTH0_DOMAIN=dev-abcd1234.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_client_id
REACT_APP_AUTH0_AUDIENCE=your_audience
```

## 📈 성능 최적화

### 현재 구현된 최적화
- **코드 분할**: React.lazy()를 통한 동적 임포트
- **데이터 캐싱**: axios 기본 캐싱 활용
- **조건부 렌더링**: 인증 상태에 따른 조건부 로딩

### 권장 개선사항
- React.memo() 적용
- useMemo, useCallback 훅 활용
- 차트 데이터 가상화
- 이미지 최적화

## 🔧 개발 가이드

### 폴더 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── WeeklyChart.js
│   ├── MonthlyChart.js
│   ├── DefectChart.js
│   ├── DefectMetrics.js
│   ├── KpiMetrics.js
│   └── SummaryTable.js
├── App.js              # 메인 앱 컴포넌트
├── App.css             # 스타일시트
└── index.js            # 엔트리 포인트
```

### 코딩 규칙
- **컴포넌트**: PascalCase
- **함수**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **파일명**: PascalCase.js

### Git 워크플로우
```bash
# 기능 개발
git checkout -b feature/new-feature
git commit -m "feat: add new dashboard component"
git push origin feature/new-feature

# Pull Request 생성 후 메인 브랜치 병합
```

## 🤝 기여하기

### 기여 방법
1. 이슈 확인 또는 새 이슈 생성
2. Fork & 브랜치 생성
3. 기능 개발 또는 버그 수정
4. 테스트 실행
5. Pull Request 생성

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 설정 등
```

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🆘 문제 해결

### 자주 발생하는 문제

**Q: 로그인이 안 돼요**
- Auth0 환경 변수 확인
- 도메인 설정 확인
- 브라우저 캐시 삭제

**Q: 차트가 안 보여요**
- API 연결 상태 확인
- 네트워크 탭에서 요청 확인
- 인증 토큰 만료 확인

**Q: 빌드가 실패해요**
- Node.js 버전 확인 (16.0.0+)
- 의존성 재설치: `rm -rf node_modules && npm install`

## 📞 연락처

- **프로젝트 관리자**: isolhsolfafa
- **GitHub**: [https://github.com/isolhsolfafa/gst-factory](https://github.com/isolhsolfafa/gst-factory)
- **이슈**: [GitHub Issues](https://github.com/isolhsolfafa/gst-factory/issues)

---

**Built with ❤️ by GST Manufacturing Team**
