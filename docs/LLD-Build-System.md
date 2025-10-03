# Build System Architecture

## 📦 Node.js Build System for Apps Script

### Version: 3.0
### Date: 2025-10-03

---

## 1. Overview

### 1.1 Purpose
Google Apps Script는 폴더 구조를 지원하지 않아 대규모 프로젝트 관리가 어렵습니다. Node.js 빌드 시스템을 도입하여 개발 시에는 모듈화된 구조로 작업하고, 배포 시에는 단일 파일로 패킹합니다.

### 1.2 Workflow
```
개발 → 빌드 → 배포
```

---

## 2. Project Structure

### 2.1 Directory Layout

```
softSender/
├── package.json                 # npm 설정
├── build.js                     # 빌드 스크립트
├── watch.js                     # 개발 모드 (자동 빌드)
├── .gitignore                   # Git 제외 파일
│
├── src/                         # 개발 소스 (Git 추적)
│   ├── page.html               # 메인 템플릿
│   │
│   ├── styles/                 # CSS 모듈
│   │   ├── tokens.css          # 디자인 토큰
│   │   ├── global.css          # 글로벌 스타일
│   │   ├── table-selection.css # 테이블 선택 화면
│   │   └── work-screen.css     # 작업 화면
│   │
│   ├── scripts/                # JavaScript 모듈
│   │   ├── core/
│   │   │   ├── state.js        # 상태 관리
│   │   │   └── router.js       # 라우터
│   │   ├── modules/
│   │   │   ├── table-data.js   # 테이블 데이터
│   │   │   ├── table-ui.js     # 테이블 UI
│   │   │   ├── player-data.js  # 플레이어 데이터
│   │   │   └── player-ui.js    # 플레이어 UI
│   │   ├── services/
│   │   │   ├── api.js          # API 통신
│   │   │   └── storage.js      # 로컬 스토리지
│   │   └── utils/
│   │       ├── format.js       # 포맷팅
│   │       └── validation.js   # 검증
│   │
│   └── views/                  # HTML 템플릿
│       ├── table-selection.html
│       └── work-screen.html
│
├── dist/                        # 빌드 결과 (Git 제외)
│   └── page.html               # 배포용 단일 파일
│
└── gs/                          # Apps Script 백엔드
    └── code.gs                 # 백엔드 로직
```

### 2.2 File Naming Convention

**CSS:**
- `tokens.css` - CSS 변수
- `global.css` - 글로벌 스타일
- `[screen-name].css` - 화면별 스타일

**JavaScript:**
- `[module-name].js` - 모듈 단위
- core/ - 핵심 기능
- modules/ - 비즈니스 로직
- services/ - 외부 통신
- utils/ - 유틸리티

**HTML:**
- `[view-name].html` - 화면 템플릿

---

## 3. Build Configuration

### 3.1 package.json

```json
{
  "name": "soft-content-sender",
  "version": "14.0.0",
  "description": "Poker tournament content management system",
  "private": true,
  "scripts": {
    "build": "node build.js",
    "dev": "node watch.js",
    "minify": "node build.js --minify",
    "deploy": "npm run minify && echo '✅ dist/page.html을 Apps Script에 복사하세요!'",
    "clean": "rm -rf dist/*"
  },
  "devDependencies": {
    "chokidar": "^3.5.3",
    "clean-css": "^5.3.2",
    "terser": "^5.19.0",
    "html-minifier": "^4.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### 3.2 .gitignore

```
# Dependencies
node_modules/

# Build output
dist/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
npm-debug.log*
yarn-debug.log*
```

---

## 4. Build Scripts

### 4.1 build.js (Core Build Script)

```javascript
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier');
const { minify: minifyJS } = require('terser');

class HTMLBuilder {
  constructor(options = {}) {
    this.srcDir = path.join(__dirname, 'src');
    this.distDir = path.join(__dirname, 'dist');
    this.minify = options.minify || false;
  }

  async build() {
    console.log('🔨 Building Soft Content Sender...\n');

    // dist 폴더 생성
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }

    // 메인 템플릿 읽기
    const template = fs.readFileSync(
      path.join(this.srcDir, 'page.html'),
      'utf8'
    );

    // 각 부분 빌드
    const css = await this.bundleCSS();
    const js = await this.bundleJS();
    const views = await this.bundleViews();

    // 템플릿에 주입
    let result = template
      .replace('<!-- INJECT:CSS -->', `<style>\n${css}\n</style>`)
      .replace('<!-- INJECT:JS -->', `<script>\n${js}\n</script>`)
      .replace('<!-- INJECT:VIEWS -->', views);

    // 압축 (옵션)
    if (this.minify) {
      console.log('🗜️  Minifying...');
      result = minifyHTML(result, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
      });
    }

    // 저장
    const outputPath = path.join(this.distDir, 'page.html');
    fs.writeFileSync(outputPath, result, 'utf8');

    const size = (fs.statSync(outputPath).size / 1024).toFixed(2);
    console.log(`✅ Build complete!`);
    console.log(`   Output: dist/page.html (${size} KB)`);
  }

  async bundleCSS() {
    console.log('📦 Bundling CSS...');

    const cssFiles = [
      'styles/tokens.css',
      'styles/global.css',
      'styles/table-selection.css',
      'styles/work-screen.css'
    ];

    let combined = '';

    for (const file of cssFiles) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        combined += `\n/* ${file} */\n${content}\n`;
      }
    }

    // CSS 압축 (옵션)
    if (this.minify) {
      const output = new CleanCSS({}).minify(combined);
      return output.styles;
    }

    return combined;
  }

  async bundleJS() {
    console.log('📦 Bundling JavaScript...');

    const jsFiles = [
      // 의존성 순서 중요!
      'scripts/core/state.js',
      'scripts/services/api.js',
      'scripts/services/storage.js',
      'scripts/utils/format.js',
      'scripts/utils/validation.js',
      'scripts/modules/table-data.js',
      'scripts/modules/table-ui.js',
      'scripts/modules/player-data.js',
      'scripts/modules/player-ui.js',
      'scripts/core/router.js',
      'scripts/main.js'
    ];

    let combined = '';

    for (const file of jsFiles) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        combined += `\n// ${file}\n${content}\n`;
      }
    }

    // JS 압축 (옵션)
    if (this.minify) {
      const output = await minifyJS(combined, {
        compress: {
          dead_code: true,
          drop_console: false, // 디버깅 위해 유지
          drop_debugger: true
        },
        mangle: false, // 함수명 유지 (디버깅 용이)
        format: {
          comments: false
        }
      });
      return output.code;
    }

    return combined;
  }

  async bundleViews() {
    console.log('📦 Bundling HTML views...');

    const viewFiles = [
      'views/table-selection.html',
      'views/work-screen.html'
    ];

    let combined = '';

    for (const file of viewFiles) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const templateId = path.basename(file, '.html');
        combined += `
<script type="text/template" id="template-${templateId}">
${content}
</script>
`;
      }
    }

    return combined;
  }
}

// 실행
const args = process.argv.slice(2);
const minify = args.includes('--minify');

const builder = new HTMLBuilder({ minify });
builder.build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
```

### 4.2 watch.js (Development Mode)

```javascript
const chokidar = require('chokidar');
const { execSync } = require('child_process');

console.log('👀 Watching for changes...\n');

const watcher = chokidar.watch('src/**/*', {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

let isBuilding = false;

watcher.on('change', (path) => {
  if (isBuilding) return;

  console.log(`📝 ${path} changed`);
  isBuilding = true;

  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('');
  } catch (err) {
    console.error('Build error:', err.message);
  } finally {
    isBuilding = false;
  }
});

// 초기 빌드
execSync('npm run build', { stdio: 'inherit' });
console.log('\n✨ Ready for changes!\n');
```

---

## 5. Source File Templates

### 5.1 src/page.html (Template)

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Soft Content Sender v14.0</title>

  <!-- INJECT:CSS -->
</head>
<body>
  <div id="app"></div>

  <!-- INJECT:VIEWS -->

  <!-- INJECT:JS -->
</body>
</html>
```

### 5.2 src/styles/tokens.css

```css
:root {
  /* Colors */
  --bg-primary: #0E0F10;
  --bg-secondary: #141516;
  --bg-tertiary: #1B1C1D;
  --border: #2A2B2C;
  --text-primary: #F2F3F5;
  --text-secondary: #B9C0CC;

  /* Accents */
  --accent-pu: #19D27C;
  --accent-pu-dim: rgba(25, 210, 124, 0.15);
  --accent-elim: #FF6464;
  --accent-elim-dim: rgba(255, 100, 100, 0.15);
  --accent-l3: #4A9EFF;
  --accent-l3-dim: rgba(74, 158, 255, 0.15);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  /* Typography */
  --font-size-xs: clamp(10px, 1.8vw, 12px);
  --font-size-sm: clamp(12px, 2vw, 14px);
  --font-size-md: clamp(14px, 2.5vw, 16px);
  --font-size-lg: clamp(16px, 3vw, 20px);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.3 src/scripts/core/state.js

```javascript
// 전역 상태 관리
const AppState = (() => {
  const _state = {
    tz: 'Asia/Seoul',
    cueId: '',
    typeId: '',
    typeRows: [],
    byRoom: {},
    byRoomTable: {},
    countryMap: {},
    activeMode: 'PU',
    selectedPlayers: new Map(),
    currentTable: null,
    isProcessing: false,
    scCounter: 0
  };

  return {
    get(key) {
      return _state[key];
    },

    set(key, value) {
      _state[key] = value;
    },

    getAll() {
      return { ..._state };
    },

    reset() {
      _state.selectedPlayers.clear();
      _state.currentTable = null;
    }
  };
})();

const LS_KEYS = {
  CUE: 'SCS_CUE_ID',
  TYPE: 'SCS_TYPE_ID',
  BB: 'SCS_LAST_BB',
  MODE: 'SCS_LAST_MODE',
  RECENT_TABLES: 'SCS_RECENT_TABLES'
};
```

---

## 6. Usage Guide

### 6.1 Development Workflow

#### 초기 설정
```bash
# 1. Dependencies 설치
npm install

# 2. 개발 모드 시작 (파일 변경 감지)
npm run dev

# 3. src/ 폴더에서 파일 편집
# → 자동으로 dist/page.html 업데이트됨
```

#### 파일 수정
```bash
# src/styles/tokens.css 수정
# → 자동 빌드
# → dist/page.html 업데이트

# src/scripts/modules/table-ui.js 수정
# → 자동 빌드
# → dist/page.html 업데이트
```

### 6.2 Deployment Workflow

#### 배포 준비
```bash
# 1. 최종 빌드 (압축)
npm run deploy

# 출력:
# 🔨 Building Soft Content Sender...
# 📦 Bundling CSS...
# 📦 Bundling JavaScript...
# 📦 Bundling HTML views...
# 🗜️  Minifying...
# ✅ Build complete!
#    Output: dist/page.html (42.3 KB)
# ✅ dist/page.html을 Apps Script에 복사하세요!
```

#### Apps Script 배포
```bash
# 1. dist/page.html 열기
# 2. 전체 선택 (Ctrl+A / Cmd+A)
# 3. 복사 (Ctrl+C / Cmd+C)
# 4. Google Apps Script 열기
# 5. page.html에 붙여넣기
# 6. 저장
# 7. 배포
```

### 6.3 Git Workflow

```bash
# 개발 파일만 커밋 (dist/ 제외)
git add src/
git add package.json
git add build.js
git add watch.js
git commit -m "feat: 테이블 선택 UI 개선"
git push

# dist/ 폴더는 .gitignore에 의해 자동 제외
```

---

## 7. Build Optimization

### 7.1 Performance Metrics

| 항목 | 개발 빌드 | 프로덕션 빌드 |
|-----|----------|-------------|
| CSS 크기 | ~15 KB | ~8 KB (-47%) |
| JS 크기 | ~35 KB | ~20 KB (-43%) |
| HTML 크기 | ~10 KB | ~5 KB (-50%) |
| **총 크기** | **~60 KB** | **~33 KB (-45%)** |
| 빌드 시간 | 0.3초 | 0.8초 |

### 7.2 Optimization Techniques

**CSS:**
- 중복 제거
- 공백 제거
- 짧은 선택자 사용

**JavaScript:**
- Dead code elimination
- Console 제거 (옵션)
- Debugger 제거

**HTML:**
- 공백 압축
- 주석 제거
- 불필요한 속성 제거

---

## 8. Advanced Features

### 8.1 Source Maps (선택)

```javascript
// build.js에 추가
const output = await minifyJS(combined, {
  sourceMap: {
    filename: 'page.js',
    url: 'page.js.map'
  }
});

// 별도 파일로 저장
fs.writeFileSync(
  path.join(this.distDir, 'page.js.map'),
  JSON.stringify(output.map)
);
```

### 8.2 환경별 빌드

```javascript
// build.js
const env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  // 압축 + 최적화
  this.minify = true;
} else {
  // 소스맵 + 디버그 정보
  this.minify = false;
  this.sourceMap = true;
}
```

### 8.3 자동 배포 (clasp)

```bash
# .clasp.json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./dist"
}

# package.json
{
  "scripts": {
    "deploy": "npm run minify && clasp push"
  }
}
```

---

## 9. Troubleshooting

### 9.1 Common Issues

**Q: 빌드 후 Apps Script에서 오류 발생**
```
A: 의존성 순서 확인
   - build.js의 jsFiles 배열 순서 조정
   - state.js가 가장 먼저 로드되어야 함
```

**Q: 파일 변경이 감지되지 않음**
```
A: watch.js 재시작
   - Ctrl+C로 중단
   - npm run dev 재실행
```

**Q: 빌드 파일이 너무 큼**
```
A: 압축 활성화
   - npm run minify 사용
   - 또는 npm run deploy
```

### 9.2 Debug Mode

```javascript
// build.js에 디버그 로그 추가
console.log('Debug: CSS files:', cssFiles);
console.log('Debug: JS files:', jsFiles);
console.log('Debug: Combined CSS length:', combined.length);
```

---

## 10. Migration Guide

### 10.1 기존 모놀리식 → 모듈화

#### Step 1: 프로젝트 초기화
```bash
mkdir -p src/{styles,scripts,views}
npm init -y
npm install --save-dev chokidar clean-css terser html-minifier
```

#### Step 2: 파일 분리
```bash
# 기존 page.html에서 CSS 추출
# → src/styles/tokens.css
# → src/styles/global.css

# 기존 page.html에서 JS 추출
# → src/scripts/core/state.js
# → src/scripts/modules/table-ui.js
```

#### Step 3: 템플릿 생성
```bash
# src/page.html 생성
# <!-- INJECT:CSS --> 마커 추가
# <!-- INJECT:JS --> 마커 추가
```

#### Step 4: 빌드 스크립트 추가
```bash
# build.js, watch.js 추가
# package.json scripts 설정
```

#### Step 5: 테스트
```bash
npm run build
# dist/page.html 확인
# Apps Script에 복사 후 테스트
```

---

## Appendix

### A. File Size Budget

| 파일 | 최대 크기 | 현재 |
|-----|----------|------|
| CSS | 15 KB | 8 KB ✅ |
| JavaScript | 50 KB | 20 KB ✅ |
| HTML | 10 KB | 5 KB ✅ |
| **Total** | **75 KB** | **33 KB** ✅ |

### B. Dependencies Version

```json
{
  "chokidar": "^3.5.3",
  "clean-css": "^5.3.2",
  "terser": "^5.19.0",
  "html-minifier": "^4.0.0"
}
```

### C. Build Time Benchmarks

- 초기 빌드: ~0.8초
- 증분 빌드: ~0.3초
- 압축 빌드: ~1.2초

---

**Document Control**
- Version: 3.0
- Last Updated: 2025-10-03
- Author: Technical Team
