# Soft Content Sender v14.0

모듈화된 개발 환경과 Google Apps Script 단일 파일 배포를 지원하는 빌드 시스템

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 모드 (자동 빌드)

```bash
npm run dev
```

파일 변경 시 자동으로 빌드됩니다.

### 3. 프로덕션 빌드 (최적화)

```bash
npm run build:prod
```

CSS/JS 압축 및 최적화된 빌드 생성

### 4. 배포

1. `dist/page.html` 파일을 복사
2. Google Apps Script 편집기에서 `page.html` 에 붙여넣기
3. 배포

## 📁 프로젝트 구조

```
softSender/
├── package.json          # npm 설정 및 스크립트
├── build.js              # 빌드 시스템
├── watch.js              # 파일 감시자 (개발 모드)
├── .gitignore            # Git 제외 목록
│
├── gs/                   # Google Apps Script 백엔드
│   └── code.gs           # 서버 사이드 코드
│
├── src/                  # 개발 소스 (모듈화)
│   ├── page.html         # 템플릿 (injection markers)
│   │
│   ├── styles/           # CSS 모듈
│   │   ├── tokens.css    # 디자인 토큰
│   │   ├── reset.css     # CSS 리셋
│   │   ├── global.css    # 전역 스타일
│   │   ├── table-selection.css
│   │   ├── work-screen.css
│   │   ├── components.css
│   │   └── responsive.css
│   │
│   ├── scripts/          # JavaScript 모듈
│   │   ├── core/         # 핵심 시스템
│   │   │   ├── state.js      # 전역 상태 관리
│   │   │   └── router.js     # 라우팅
│   │   │
│   │   ├── services/     # 서비스 레이어
│   │   │   ├── api.js        # Apps Script API
│   │   │   └── storage.js    # LocalStorage
│   │   │
│   │   ├── utils/        # 유틸리티
│   │   │   ├── format.js     # 포맷팅
│   │   │   └── validation.js # 검증
│   │   │
│   │   ├── modules/      # UI 모듈
│   │   │   ├── table-data.js
│   │   │   ├── table-ui.js
│   │   │   ├── player-ui.js
│   │   │   ├── mode-ui.js
│   │   │   └── send-ui.js
│   │   │
│   │   └── main.js       # 앱 초기화 (마지막)
│   │
│   └── views/            # HTML 템플릿
│       ├── table-selection.html
│       └── work-screen.html
│
├── dist/                 # 빌드 출력 (배포용)
│   └── page.html         # 단일 HTML 파일
│
└── docs/                 # 문서
    ├── PRD-Two-Panel-UI.md
    ├── LLD-Two-Panel-UI.md
    └── LLD-Build-System.md
```

## 🔧 빌드 시스템

### 작동 방식

1. **CSS 번들링**: `src/styles/*.css` → 하나로 합침
2. **JS 번들링**: `src/scripts/**/*.js` → 의존성 순서대로 합침
3. **Views 번들링**: `src/views/*.html` → 하나로 합침
4. **템플릿 주입**: `src/page.html` 의 마커에 주입
   - `<!-- INJECT:CSS -->` → 번들된 CSS
   - `<!-- INJECT:JS -->` → 번들된 JS
   - `<!-- INJECT:VIEWS -->` → 번들된 Views
5. **최적화** (프로덕션): 압축 및 최적화

### 의존성 순서 (중요!)

JavaScript 파일은 다음 순서로 번들됩니다:

```javascript
1. scripts/core/state.js          // 먼저 로드 (의존성 없음)
2. scripts/services/api.js
3. scripts/services/storage.js
4. scripts/utils/format.js
5. scripts/utils/validation.js
6. scripts/modules/table-data.js  // state, api, storage 의존
7. scripts/modules/table-ui.js    // table-data, format 의존
8. scripts/modules/player-ui.js
9. scripts/modules/mode-ui.js
10. scripts/modules/send-ui.js
11. scripts/core/router.js        // 모든 UI 모듈 의존
12. scripts/main.js               // 마지막 (앱 초기화)
```

## 🛠️ 개발 가이드

### 새로운 CSS 모듈 추가

1. `src/styles/` 에 파일 생성 (예: `my-feature.css`)
2. `build.js` 의 `cssFiles` 배열에 추가
3. 자동으로 번들에 포함됨

### 새로운 JS 모듈 추가

1. `src/scripts/` 적절한 위치에 파일 생성
2. `build.js` 의 `jsFiles` 배열에 **의존성 순서에 맞게** 추가
3. 자동으로 번들에 포함됨

### IIFE 패턴 사용 (모듈 캡슐화)

```javascript
// src/scripts/modules/my-module.js
const MyModule = (() => {
  // Private
  const _privateVar = 'secret';

  function _privateMethod() {
    // ...
  }

  // Public API
  return {
    publicMethod() {
      // ...
    }
  };
})();
```

### 상태 관리

```javascript
// 상태 읽기
const value = AppState.get('key');

// 상태 쓰기
AppState.set('key', value);

// 여러 값 한번에 업데이트
AppState.update({ key1: value1, key2: value2 });

// 변경 구독
AppState.subscribe('key', (newValue) => {
  console.log('Changed:', newValue);
});
```

## 📦 배포 체크리스트

- [ ] `npm run build:prod` 실행
- [ ] `dist/page.html` 파일 크기 확인 (적정 크기인지)
- [ ] 브라우저에서 직접 열어서 테스트
- [ ] Google Apps Script에 복사
- [ ] Apps Script 배포 및 테스트

## 🐛 문제 해결

### 빌드 실패

```bash
# 의존성 재설치
rm -rf node_modules
npm install

# 빌드 재시도
npm run build
```

### 모듈 로딩 에러

- `build.js` 의 `jsFiles` 순서 확인
- 의존성이 먼저 로드되는지 확인

### 압축 오류

```bash
# 압축 없이 빌드
npm run build
```

## 📝 라이선스

Internal Use Only
