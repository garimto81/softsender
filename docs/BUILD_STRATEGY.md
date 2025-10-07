# BUILD STRATEGY - Soft Content Sender

## 📋 문서 정보
- **작성일**: 2025-10-07
- **최종 갱신일**: 2025-10-07
- **버전**: v10.3.0 (빌드 시스템 v1.0)
- **대상**: 개발자, DevOps

---

## 🎯 빌드 전략 목표

### Phase 1 (현재 - v10.2)
- [x] 단일 빌드 스크립트 (build.js)
- [x] 프론트엔드만 빌드 (src/*.js → page.html)
- [x] 루트 폴더 출력 (page.html, softsender_code.gs)
- [x] 수동 배포 (Google Apps Script 업로드)
- [x] Watch 모드 지원 (npm run dev)

### Phase 2 (v11.0 - 향후)
- [ ] 프론트/백엔드 분리 빌드
- [ ] 환경별 설정 관리 (dev/staging/prod)
- [ ] 배포 자동화 (clasp 도입)
- [ ] 빌드 검증 (lint, test)

### Phase 3 (v12.0 - 향후)
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] 자동 테스트 실행
- [ ] 버전 태깅 자동화

---

## 📁 프로젝트 구조

### 현재 구조 (v10.2.1 - Phase 1)

```
softsender/
├── src/                       # 소스 코드 (루트 레벨)
│   ├── template.html          # HTML 템플릿
│   ├── styles.css             # 스타일시트
│   ├── constants.js           # 상수 정의
│   ├── utils.js               # 유틸리티 (JSDoc 포함, 375줄)
│   ├── preview.js             # 미리보기 기능
│   ├── batch.js               # 배치 전송 (최신)
│   ├── events.js              # 이벤트 핸들러
│   ├── init.js                # 초기화
│   ├── error-handler.js       # 에러 핸들러 (향후 사용)
│   └── backend/               # 백엔드 소스 (GAS)
│
├── build.js                   # 빌드 스크립트 (유일)
├── page.html                  # 빌드 결과물 (배포용)
├── softsender_code.gs         # 백엔드 (배포용)
│
├── config/                    # 환경 설정 (향후)
├── tests/                     # 테스트
├── docs/                      # 문서
│   ├── PLAN.md
│   ├── PRD.md
│   ├── LLD.md
│   ├── STATUS.md
│   ├── CHANGELOG.md
│   └── BUILD_STRATEGY.md      # 이 문서
│
└── package.json
```

**특징**:
- 단일 빌드 스크립트 (build.js)
- 빌드 결과물 → 루트 출력 (page.html, softsender_code.gs)
- src/ 폴더에 모든 소스 코드 통합
- 간단하고 명확한 구조

### 향후 구조 (v11.0+ - Phase 2)

```
softsender/
├── src/
│   ├── frontend/              # 프론트엔드 소스
│   │   ├── template.html
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   ├── components.css
│   │   │   └── mobile.css
│   │   ├── scripts/
│   │   │   ├── core/
│   │   │   ├── utils/
│   │   │   └── features/
│   │   └── main.js
│   │
│   └── backend/               # 백엔드 소스 (분리)
│       ├── api/
│       ├── services/
│       └── utils/
│
├── build/                     # 빌드 스크립트 (분리)
│   ├── frontend.js
│   ├── backend.js
│   └── utils/
│
├── dist/                      # 빌드 결과물 (분리)
│   ├── page.html
│   └── Code.gs
│
└── config/                    # 환경별 설정
    ├── dev.json
    ├── staging.json
    └── prod.json
```

---

## 🔧 빌드 파이프라인

### 현재 빌드 방식 (v10.2 - build.js)

```javascript
/**
 * 프론트엔드 빌드 파이프라인
 * 입력: src/*.{html,css,js}
 * 출력: page.html (루트)
 */

const pipeline = [
  '1. 소스 읽기',
  '   - template.html',
  '   - styles.css',
  '   - constants.js, utils.js, preview.js, batch.js, events.js, init.js',
  '2. CSS 처리',
  '   - 압축 모드: 최소화',
  '   - 일반 모드: 포맷 유지',
  '3. JS 번들링',
  '   - 모듈 순서대로 결합',
  '   - 압축 모드: 최소화 (terser)',
  '4. HTML 템플릿 치환',
  '   - {{CSS}} → CSS 코드 삽입',
  '   - {{JS}} → JS 코드 삽입',
  '5. 빌드 정보 주석',
  '   - 버전, 날짜, 시간',
  '   - 파일 크기',
  '6. 출력: page.html (루트)'
];
```

**명령어**:
```bash
npm run build           # 일반 빌드 → page.html (루트)
npm run build:min       # 압축 빌드 → page.html (루트)
npm run dev             # Watch 모드 (파일 변경 시 자동 빌드)
```

**Watch 모드**:
- src/ 폴더 파일 변경 감지
- 자동으로 빌드 재실행
- 개발 중 실시간 확인 가능

### 백엔드 파일 (softsender_code.gs)

**현재 방식**:
- 수동 관리 (빌드 없음)
- Google Apps Script 웹 에디터에서 직접 수정
- 버전 관리: Git으로만

**향후 계획 (Phase 2)**:
- build/backend.js 도입
- 모듈 분리 (api, services, utils)
- 환경별 설정 (dev/prod)
- 자동 배포 (clasp)

---

## 🚀 배포 자동화 (clasp)

### clasp 설정

**설치**:
```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "Soft Content Sender"
```

**설정 파일 (.clasp.json)**:
```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./dist",
  "fileExtension": "html"
}
```

**appsscript.json**:
```json
{
  "timeZone": "Asia/Seoul",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "webapp": {
    "access": "ANYONE",
    "executeAs": "USER_DEPLOYING"
  }
}
```

---

### 배포 스크립트 (build/deploy.js)

```javascript
/**
 * 배포 파이프라인
 */

const deployPipeline = {
  dev: [
    '1. 빌드 (dev 환경)',
    '2. 로컬 테스트',
    '3. clasp push',
    '4. 개발 배포 URL 출력'
  ],
  staging: [
    '1. 빌드 (staging 환경)',
    '2. 통합 테스트 실행',
    '3. clasp push',
    '4. 스테이징 배포',
    '5. QA 알림 (Slack)'
  ],
  prod: [
    '1. 빌드 (prod 환경)',
    '2. 전체 테스트 실행',
    '3. 버전 태깅',
    '4. clasp push',
    '5. 프로덕션 배포',
    '6. 배포 완료 알림',
    '7. 롤백 스크립트 준비'
  ]
};
```

**명령어**:
```bash
npm run deploy:dev            # 개발 환경 배포
npm run deploy:staging        # 스테이징 배포
npm run deploy:prod           # 프로덕션 배포
npm run rollback              # 이전 버전으로 롤백
```

---

## 🔍 빌드 검증

### Pre-build 검증

```bash
# 1. 문법 체크
npx eslint src/

# 2. 타입 체크 (TypeScript 도입 시)
npx tsc --noEmit

# 3. 보안 스캔
npm audit

# 4. 의존성 체크
npx depcheck
```

### Post-build 검증

```bash
# 1. 파일 크기 체크
ls -lh dist/page.html
# 목표: < 50KB

# 2. 문법 검증
node -c dist/Code.gs

# 3. 보안 스캔
npx snyk test
```

---

## 📊 환경별 설정 관리

### config/dev.json
```json
{
  "env": "development",
  "debug": true,
  "cueSheetId": "DEV_CUE_SHEET_ID",
  "typeSheetId": "DEV_TYPE_SHEET_ID",
  "logging": "verbose",
  "sourceMap": true
}
```

### config/prod.json
```json
{
  "env": "production",
  "debug": false,
  "cueSheetId": "PROD_CUE_SHEET_ID",
  "typeSheetId": "PROD_TYPE_SHEET_ID",
  "logging": "error",
  "sourceMap": false,
  "minify": true
}
```

---

## 🎯 빌드 최적화 전략

### 프론트엔드 최적화

1. **코드 분할 (Code Splitting)**
   - core.js (20KB) - 필수 기능
   - features.js (15KB) - 선택 기능 (lazy load)

2. **CSS 최적화**
   - Critical CSS 인라인
   - Unused CSS 제거 (PurgeCSS)

3. **이미지 최적화**
   - SVG 압축
   - WebP 변환

4. **캐싱 전략**
   - 버전 해시 추가 (page.v10.2.html)

### 백엔드 최적화

1. **코드 최적화**
   - Dead code 제거
   - 함수 인라인 (자주 호출되는 함수)

2. **로깅 최적화**
   - 프로덕션: 에러만 로깅
   - 개발: 전체 로깅

3. **에러 처리**
   - 프로덕션: 간결한 메시지
   - 개발: 상세 스택 트레이스

---

## 🔄 CI/CD 파이프라인 (v12.0 목표)

### GitHub Actions Workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-dev:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3

      - name: Deploy to Dev
        run: npm run deploy:dev
        env:
          CLASP_TOKEN: ${{ secrets.CLASP_TOKEN }}

  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3

      - name: Deploy to Production
        run: npm run deploy:prod
        env:
          CLASP_TOKEN: ${{ secrets.CLASP_TOKEN }}

      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: v${{ github.run_number }}
```

---

## 📝 개발 워크플로우

### 일반 개발

```bash
# 1. 소스 수정
vim src/frontend/scripts/features/batch.js

# 2. 개발 빌드 (Watch 모드)
npm run dev

# 3. 로컬 테스트
npm run test:watch

# 4. 빌드 확인
npm run build

# 5. 커밋
git add .
git commit -m "feat: 배치 기능 개선"
```

### 배포

```bash
# 개발 환경 배포
npm run deploy:dev

# 스테이징 배포
npm run deploy:staging

# 프로덕션 배포 (승인 필요)
npm run deploy:prod
```

---

## 🛡️ 보안 체크리스트

### 빌드 시 자동 검사

- [ ] 하드코딩된 API 키 검출
- [ ] 민감 정보 로그 출력 검사
- [ ] XSS 취약점 스캔
- [ ] 의존성 취약점 스캔 (npm audit)
- [ ] Script Properties 사용 확인

---

## 📈 성능 목표

| 항목 | 현재 (v10.2.1) | 목표 (v11.0) |
|------|-------------|-------------|
| 프론트 빌드 시간 | 1초 | 1초 |
| 백엔드 빌드 시간 | N/A (수동) | 1초 |
| 전체 빌드 시간 | 1초 | 2초 |
| 배포 시간 | 5분 (수동) | 30초 (자동) |
| page.html 크기 | 41.63KB | <40KB |
| Code.gs 크기 | 7.7KB | <8KB |

---

## 🔗 참고 문서

- [Google Apps Script - clasp](https://github.com/google/clasp)
- [Terser (JS 압축)](https://terser.org/)
- [cssnano (CSS 압축)](https://cssnano.co/)
- [ESLint](https://eslint.org/)

---

## 📞 문의

빌드 시스템 관련 문의: 개발팀
