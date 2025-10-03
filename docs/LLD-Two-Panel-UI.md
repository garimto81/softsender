# LLD: Two-Panel Split UI Implementation

## 🏗️ Low-Level Design Document

### Version: 2.0
### Date: 2025-10-03
### Status: Planning

---

## 1. Architecture Overview

### 1.1 Development vs Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│              DEVELOPMENT ENVIRONMENT                     │
│                                                          │
│  src/ (모듈화된 소스)                                    │
│  ├── page.html (템플릿)                                 │
│  ├── styles/                                            │
│  │   ├── tokens.css                                     │
│  │   ├── global.css                                     │
│  │   ├── table-selection.css                           │
│  │   └── work-screen.css                               │
│  ├── scripts/                                           │
│  │   ├── core/ (state, router)                         │
│  │   ├── modules/ (table-data, player-ui)              │
│  │   ├── services/ (api, storage)                      │
│  │   └── utils/                                         │
│  └── views/                                             │
│      ├── table-selection.html                          │
│      └── work-screen.html                              │
│                                                          │
│                      ↓ [npm run build]                  │
│                                                          │
│  dist/                                                   │
│  └── page.html (단일 파일, 압축됨)                      │
└─────────────────────────────────────────────────────────┘
                           ↓ [복사 & 붙여넣기]
┌─────────────────────────────────────────────────────────┐
│           PRODUCTION ENVIRONMENT                         │
│                                                          │
│  Google Apps Script                                      │
│  ├── page.html (빌드된 단일 파일)                       │
│  └── code.gs (백엔드)                                    │
│                      ↓                                   │
│              google.script.run (RPC)                     │
│                      ↓                                   │
│           Google Sheets (Data Layer)                     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 System Architecture (Production)

```
┌─────────────────────────────────────────┐
│         Browser (Client)                │
│  ┌───────────────────────────────────┐ │
│  │      page.html (빌드됨)           │ │
│  │                                     │ │
│  │  [테이블 선택 화면]                │ │
│  │  - 최근 테이블 (카드형)            │ │
│  │  - 전체 테이블 (리스트)            │ │
│  │           ↓ (선택)                  │ │
│  │  [작업 화면]                        │ │
│  │  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │ Left Panel  │  │ Right Panel │ │ │
│  │  │  (Grid)     │  │  (Input)    │ │ │
│  │  └─────────────┘  └─────────────┘ │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↕
        google.script.run (RPC)
                    ↕
┌─────────────────────────────────────────┐
│   Google Apps Script (Backend)          │
│  - getTypeRows()                         │
│  - getCountryMap()                       │
│  - getTimeOptions()                      │
│  - updateVirtualBatch()                  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│       Google Sheets (Data Layer)        │
│  - Type Sheet (플레이어 정보)           │
│  - Cue Sheet (전송 데이터)              │
└─────────────────────────────────────────┘
```

### 1.3 Technology Stack

**Frontend:**
- HTML5
- CSS3 (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6+)
- No frameworks/libraries

**Backend:**
- Google Apps Script (JavaScript Runtime)
- Google Sheets API

**Build Tools:**
- Node.js 16+
- npm
- Custom build scripts (build.js, watch.js)
- clean-css (CSS 압축)
- terser (JS 압축)
- html-minifier (HTML 압축)

**Deployment:**
- Google Apps Script Web App
- HTTPS (Google 제공)

---

## 2. HTML Structure

### 2.1 Overall Layout

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Soft Content Sender v14.0 - Two-Panel</title>
  <style>/* CSS */</style>
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <header class="header-compact"></header>

    <!-- Main Split Panel -->
    <main class="main-split">
      <!-- Left: Player Grid -->
      <section class="player-grid-panel"></section>

      <!-- Right: Input Panel -->
      <section class="input-panel"></section>
    </main>

    <!-- Footer -->
    <footer class="footer-actions"></footer>
  </div>

  <!-- Modals -->
  <div class="modal" id="settingsModal"></div>
  <div class="loading" id="loadingOverlay"></div>
  <div class="toast" id="toast"></div>

  <script>/* JavaScript */</script>
</body>
</html>
```

### 2.2 Component Breakdown

#### 2.2.1 Header Component
```html
<header class="header-compact">
  <div class="header-row">
    <!-- Selectors -->
    <select id="selRoom" class="select-sm">
      <option value="">Room</option>
    </select>

    <select id="selTableNo" class="select-sm">
      <option value="">Table</option>
    </select>

    <!-- BB Input -->
    <div class="input-group-sm">
      <label>BB</label>
      <input id="commonBB" type="text" inputmode="numeric" placeholder="50K" />
    </div>

    <!-- Settings -->
    <button class="btn-icon" onclick="openSettings()">⚙️</button>
  </div>

  <div class="header-row">
    <!-- Mode Tabs -->
    <div class="mode-tabs">
      <button class="mode-tab active" id="modeBtn_PU" onclick="setActiveMode('PU')">
        칩업
      </button>
      <button class="mode-tab" id="modeBtn_ELIM" onclick="setActiveMode('ELIM')">
        탈락
      </button>
      <button class="mode-tab" id="modeBtn_L3" onclick="setActiveMode('L3')">
        프로필
      </button>
    </div>
  </div>
</header>
```

#### 2.2.2 Main Split Panel
```html
<main class="main-split">
  <!-- Left Panel: Player Grid -->
  <section class="player-grid-panel">
    <div class="player-grid" id="playerGrid">
      <!-- Dynamically rendered -->
      <!-- Example cell: -->
      <button class="player-cell" data-pid="1" onclick="togglePlayer('1')">
        <span class="indicator">○</span>
        <div class="seat">#1</div>
        <div class="name">김철수</div>
      </button>
    </div>
  </section>

  <!-- Right Panel: Input Cards -->
  <section class="input-panel" id="inputPanel">
    <div class="empty-panel">
      <p>선택된 플레이어가 없습니다</p>
      <small>좌측에서 플레이어를 선택하세요</small>
    </div>
  </section>
</main>
```

#### 2.2.3 Input Card Template
```html
<!-- PU 모드 카드 -->
<div class="input-card mode-pu" data-pid="1">
  <div class="card-header">
    <div class="player-info">
      <strong>김철수</strong>
      <span class="flag">🇰🇷</span>
    </div>
    <button class="btn-remove" onclick="removePlayer('1')">×</button>
  </div>

  <div class="card-body">
    <div class="input-row">
      <label>스택</label>
      <input type="tel"
             id="stack_1"
             placeholder="0"
             inputmode="numeric"
             oninput="updateStack('1', this.value)" />
    </div>
    <div class="bb-display" id="bb_1">→ 0 BB</div>
  </div>
</div>

<!-- ELIM 모드 카드 -->
<div class="input-card mode-elim" data-pid="2">
  <div class="card-header">
    <div class="player-info">
      <strong>이영희</strong>
      <span class="flag">🇰🇷</span>
    </div>
    <button class="btn-remove" onclick="removePlayer('2')">×</button>
  </div>

  <div class="card-body">
    <div class="input-row">
      <label>상금</label>
      <select id="prizeYN_2" onchange="updatePrizeYN('2', this.value)">
        <option value="">선택</option>
        <option value="유">유</option>
        <option value="무">무</option>
      </select>
    </div>
    <div class="input-row" id="prizeAmtRow_2" style="display:none;">
      <label>금액</label>
      <input type="tel"
             id="prizeAmt_2"
             placeholder="0"
             inputmode="numeric"
             oninput="updatePrizeAmt('2', this.value)" />
    </div>
  </div>
</div>

<!-- L3 모드 카드 -->
<div class="input-card mode-l3" data-pid="3">
  <div class="card-header">
    <div class="player-info">
      <strong>박민수</strong>
      <span class="flag">🇰🇷</span>
    </div>
    <button class="btn-remove" onclick="removePlayer('3')">×</button>
  </div>

  <div class="card-body">
    <div class="hint">프로필 자막: 이름만 사용</div>
  </div>
</div>
```

#### 2.2.4 Footer Component
```html
<footer class="footer-actions">
  <button class="btn-send" id="btnSend" onclick="send()">
    <span class="icon">📤</span>
    <span id="sendText">전송 (0명)</span>
  </button>
</footer>
```

---

## 3. CSS Architecture

### 3.1 Design Tokens (CSS Custom Properties)

```css
:root {
  /* Colors */
  --bg-primary: #0E0F10;
  --bg-secondary: #141516;
  --bg-tertiary: #1B1C1D;
  --border-default: #2A2B2C;
  --text-primary: #F2F3F5;
  --text-secondary: #B9C0CC;

  /* Accent Colors */
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

  /* Border Radius */
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

### 3.2 Layout System

```css
/* Main Container */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Header */
.header-compact {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-secondary);
}

.header-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Main Split Panel */
.main-split {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 35% 65%; /* Mobile default */
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  overflow: hidden;
}

/* Footer */
.footer-actions {
  flex: 0 0 auto;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-bottom: calc(var(--spacing-sm) + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-default);
  background: var(--bg-secondary);
}
```

### 3.3 Player Grid Styles

```css
/* Grid Panel */
.player-grid-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile */
  grid-auto-rows: minmax(44px, auto);
  gap: var(--spacing-xs);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--spacing-xs);
}

/* Player Cell */
.player-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 44px; /* Minimum touch target */
  padding: var(--spacing-sm) var(--spacing-xs);
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: clamp(11px, 2vw, 13px);
}

.player-cell:active {
  transform: scale(0.96);
}

/* Selection States */
.player-cell.selected-pu {
  background: var(--accent-pu-dim);
  border-color: var(--accent-pu);
  border-width: 2px;
}

.player-cell.selected-elim {
  background: var(--accent-elim-dim);
  border-color: var(--accent-elim);
  border-width: 2px;
}

.player-cell.selected-l3 {
  background: var(--accent-l3-dim);
  border-color: var(--accent-l3);
  border-width: 2px;
}

/* Indicator */
.indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.selected-pu .indicator { color: var(--accent-pu); content: '●'; }
.selected-elim .indicator { color: var(--accent-elim); content: '●'; }
.selected-l3 .indicator { color: var(--accent-l3); content: '●'; }

/* Cell Content */
.seat {
  font-size: clamp(10px, 1.8vw, 12px);
  color: var(--text-secondary);
  font-weight: 600;
}

.name {
  font-size: clamp(12px, 2.2vw, 14px);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
```

### 3.4 Input Panel Styles

```css
/* Input Panel */
.input-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--spacing-xs);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* Empty State */
.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  height: 100%;
  color: var(--text-secondary);
  text-align: center;
  padding: var(--spacing-xl);
}

.empty-panel p {
  font-size: clamp(14px, 2.5vw, 16px);
  font-weight: 600;
}

.empty-panel small {
  font-size: clamp(12px, 2vw, 14px);
  opacity: 0.7;
}

/* Input Card */
.input-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border-left: 3px solid var(--border-default);
}

.input-card.mode-pu { border-left-color: var(--accent-pu); }
.input-card.mode-elim { border-left-color: var(--accent-elim); }
.input-card.mode-l3 { border-left-color: var(--accent-l3); }

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.player-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.player-info strong {
  font-size: clamp(13px, 2.2vw, 15px);
  font-weight: 700;
}

.flag {
  font-size: clamp(16px, 3vw, 20px);
}

/* Card Body */
.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-row label {
  font-size: clamp(11px, 1.8vw, 13px);
  color: var(--text-secondary);
  font-weight: 600;
}

.input-row input,
.input-row select {
  width: 100%;
  height: clamp(36px, 5vh, 44px);
  padding: 0 var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: clamp(13px, 2.2vw, 15px);
  transition: border-color var(--transition-base);
}

.input-row input:focus,
.input-row select:focus {
  outline: none;
  border-color: var(--accent-pu);
}

/* BB Display */
.bb-display {
  font-size: clamp(13px, 2.2vw, 15px);
  color: var(--accent-pu);
  font-weight: 700;
  margin-top: 4px;
}

/* Hint */
.hint {
  font-size: clamp(11px, 1.8vw, 13px);
  color: var(--text-secondary);
  font-style: italic;
}
```

### 3.5 Responsive Breakpoints

```css
/* Mobile Portrait (Default) */
@media (max-width: 767px) and (orientation: portrait) {
  .main-split {
    grid-template-columns: 35% 65%;
  }

  .player-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile Landscape */
@media (max-width: 767px) and (orientation: landscape) {
  .main-split {
    grid-template-columns: 30% 70%;
  }

  .player-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .header-compact {
    flex-direction: row;
    justify-content: space-between;
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .main-split {
    grid-template-columns: 40% 60%;
  }

  .player-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .player-cell {
    min-height: 56px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .main-split {
    grid-template-columns: 50% 50%;
  }

  .player-grid {
    grid-template-columns: repeat(3, 1fr);
    /* or 1 row: repeat(9, 1fr); */
  }

  .player-cell {
    min-height: 64px;
  }

  .player-cell:hover {
    background: var(--bg-secondary);
    border-color: var(--accent-pu);
  }
}
```

---

## 4. JavaScript Implementation

### 4.1 State Management

```javascript
// Global State Object
const state = {
  // Configuration
  tz: 'Asia/Seoul',
  cueId: '',
  typeId: '',

  // Data
  typeRows: [],
  byRoom: {},
  byRoomTable: {},
  countryMap: {},
  timeOptions: [],
  timeCenter: '',

  // UI State
  activeMode: 'PU',
  selectedPlayers: new Map(), // key: pid, value: {player, mode, data}

  // Flags
  isProcessing: false,
  scCounter: 0
};

// Local Storage Keys
const LS_KEYS = {
  CUE: 'SCS_CUE_ID',
  TYPE: 'SCS_TYPE_ID',
  BB: 'SCS_LAST_BB',
  MODE: 'SCS_LAST_MODE'
};
```

### 4.2 Core Functions

#### 4.2.1 Player Selection
```javascript
/**
 * 플레이어 선택/해제 토글
 * @param {string} pid - Player ID (format: "room_table_seat")
 */
function togglePlayer(pid) {
  const room = document.getElementById('selRoom').value;
  const tno = document.getElementById('selTableNo').value;
  const player = (state.byRoomTable[room + '|' + tno] || [])
    .find(p => `${room}_${tno}_${p.seat}` === pid);

  if (!player) return;

  if (state.selectedPlayers.has(pid)) {
    // 선택 해제
    state.selectedPlayers.delete(pid);
    vibrate([10]);
  } else {
    // 선택 추가 (현재 모드로)
    state.selectedPlayers.set(pid, {
      player,
      mode: state.activeMode,
      data: getDefaultData(state.activeMode)
    });
    vibrate([10, 50, 10]);
  }

  // UI 업데이트
  updateGridCell(pid);
  renderInputPanel();
  updateSendButton();
}

/**
 * 모드별 기본 데이터 객체 반환
 */
function getDefaultData(mode) {
  switch (mode) {
    case 'PU':
      return { stack: '' };
    case 'ELIM':
      return { prizeYN: '', prizeAmt: '' };
    case 'L3':
      return {};
    default:
      return {};
  }
}
```

#### 4.2.2 Grid Rendering
```javascript
/**
 * 플레이어 그리드 렌더링
 */
function renderPlayerGrid() {
  const room = document.getElementById('selRoom').value;
  const tno = document.getElementById('selTableNo').value;
  const grid = document.getElementById('playerGrid');

  if (!room || !tno) {
    grid.innerHTML = '';
    renderInputPanel(); // Empty state
    return;
  }

  const players = state.byRoomTable[room + '|' + tno] || [];

  if (players.length === 0) {
    grid.innerHTML = '<div class="empty-grid">플레이어가 없습니다</div>';
    renderInputPanel();
    return;
  }

  // Seat 번호 순 정렬
  const sorted = players.slice().sort((a, b) =>
    Number(a.seat.replace('#', '')) - Number(b.seat.replace('#', ''))
  );

  // 최대 9명만 표시
  const displayPlayers = sorted.slice(0, 9);

  grid.innerHTML = displayPlayers.map(p => {
    const pid = `${room}_${tno}_${p.seat}`;
    const sel = state.selectedPlayers.get(pid);

    let cellClass = 'player-cell';
    if (sel) {
      if (sel.mode === 'PU') cellClass += ' selected-pu';
      else if (sel.mode === 'ELIM') cellClass += ' selected-elim';
      else if (sel.mode === 'L3') cellClass += ' selected-l3';
    }

    const indicator = sel ? '●' : '○';
    const shortName = p.player.split(' ')[0] || p.player;

    return `
      <button class="${cellClass}" data-pid="${pid}" onclick="togglePlayer('${pid}')">
        <span class="indicator">${indicator}</span>
        <div class="seat">${p.seat}</div>
        <div class="name" title="${p.player}">${shortName}</div>
      </button>
    `;
  }).join('');
}

/**
 * 개별 셀 업데이트 (선택 상태만)
 */
function updateGridCell(pid) {
  const cell = document.querySelector(`[data-pid="${pid}"]`);
  if (!cell) return;

  const sel = state.selectedPlayers.get(pid);

  // 클래스 초기화
  cell.className = 'player-cell';

  if (sel) {
    if (sel.mode === 'PU') cell.classList.add('selected-pu');
    else if (sel.mode === 'ELIM') cell.classList.add('selected-elim');
    else if (sel.mode === 'L3') cell.classList.add('selected-l3');

    cell.querySelector('.indicator').textContent = '●';
  } else {
    cell.querySelector('.indicator').textContent = '○';
  }
}
```

#### 4.2.3 Input Panel Rendering
```javascript
/**
 * 입력 패널 렌더링
 */
function renderInputPanel() {
  const panel = document.getElementById('inputPanel');

  if (state.selectedPlayers.size === 0) {
    panel.innerHTML = `
      <div class="empty-panel">
        <p>선택된 플레이어가 없습니다</p>
        <small>좌측에서 플레이어를 선택하세요</small>
      </div>
    `;
    return;
  }

  const cards = Array.from(state.selectedPlayers.entries())
    .map(([pid, sel]) => renderInputCard(pid, sel))
    .join('');

  panel.innerHTML = cards;

  // 첫 번째 입력창 자동 포커스 (optional)
  // const firstInput = panel.querySelector('input');
  // if (firstInput) firstInput.focus();
}

/**
 * 개별 입력 카드 렌더링
 */
function renderInputCard(pid, sel) {
  const p = sel.player;
  const mode = sel.mode;

  let modeClass = 'input-card';
  if (mode === 'PU') modeClass += ' mode-pu';
  else if (mode === 'ELIM') modeClass += ' mode-elim';
  else if (mode === 'L3') modeClass += ' mode-l3';

  const header = `
    <div class="card-header">
      <div class="player-info">
        <strong>${p.player}</strong>
        <span class="flag">${getFlagEmoji(p.nat)}</span>
      </div>
      <button class="btn-remove" onclick="removePlayer('${pid}')">×</button>
    </div>
  `;

  let body = '';

  if (mode === 'PU') {
    const bb = parseIntClean(document.getElementById('commonBB').value);
    const stackVal = sel.data.stack || '';
    const stackNum = parseIntClean(stackVal);
    const bbCalc = (stackNum > 0 && bb > 0) ? Math.round(stackNum / bb) : 0;

    body = `
      <div class="card-body">
        <div class="input-row">
          <label>스택</label>
          <input type="tel"
                 id="stack_${pid}"
                 placeholder="0"
                 inputmode="numeric"
                 value="${stackVal}"
                 oninput="updateStack('${pid}', this.value)" />
        </div>
        <div class="bb-display" id="bb_${pid}">
          → ${bbCalc} BB
        </div>
      </div>
    `;
  } else if (mode === 'ELIM') {
    const prizeYN = sel.data.prizeYN || '';
    const prizeAmt = sel.data.prizeAmt || '';
    const showAmtRow = prizeYN === '유' ? '' : 'style="display:none;"';

    body = `
      <div class="card-body">
        <div class="input-row">
          <label>상금</label>
          <select id="prizeYN_${pid}" onchange="updatePrizeYN('${pid}', this.value)">
            <option value="">선택</option>
            <option value="유" ${prizeYN === '유' ? 'selected' : ''}>유</option>
            <option value="무" ${prizeYN === '무' ? 'selected' : ''}>무</option>
          </select>
        </div>
        <div class="input-row" id="prizeAmtRow_${pid}" ${showAmtRow}>
          <label>금액</label>
          <input type="tel"
                 id="prizeAmt_${pid}"
                 placeholder="0"
                 inputmode="numeric"
                 value="${prizeAmt}"
                 oninput="updatePrizeAmt('${pid}', this.value)" />
        </div>
      </div>
    `;
  } else if (mode === 'L3') {
    body = `
      <div class="card-body">
        <div class="hint">프로필 자막: 이름만 사용</div>
      </div>
    `;
  }

  return `<div class="${modeClass}" data-pid="${pid}">${header}${body}</div>`;
}
```

#### 4.2.4 Input Handlers
```javascript
/**
 * 스택 입력 업데이트 (PU 모드)
 */
function updateStack(pid, value) {
  const sel = state.selectedPlayers.get(pid);
  if (!sel || sel.mode !== 'PU') return;

  // 콤마 포맷팅
  const input = document.getElementById(`stack_${pid}`);
  const formatted = formatComma(value);
  input.value = formatted;

  // 데이터 저장
  sel.data.stack = formatted;

  // BB 계산
  const bb = parseIntClean(document.getElementById('commonBB').value);
  const stackNum = parseIntClean(formatted);
  const bbCalc = (stackNum > 0 && bb > 0) ? Math.round(stackNum / bb) : 0;

  // BB 표시 업데이트
  const bbDisplay = document.getElementById(`bb_${pid}`);
  if (bbDisplay) {
    bbDisplay.textContent = `→ ${bbCalc} BB`;
  }
}

/**
 * 상금 유/무 선택 (ELIM 모드)
 */
function updatePrizeYN(pid, value) {
  const sel = state.selectedPlayers.get(pid);
  if (!sel || sel.mode !== 'ELIM') return;

  sel.data.prizeYN = value;

  // 금액 입력 행 표시/숨김
  const amtRow = document.getElementById(`prizeAmtRow_${pid}`);
  if (amtRow) {
    amtRow.style.display = (value === '유') ? '' : 'none';
  }

  // "유" 선택 시 금액 입력창 포커스
  if (value === '유') {
    setTimeout(() => {
      const amtInput = document.getElementById(`prizeAmt_${pid}`);
      if (amtInput) amtInput.focus();
    }, 100);
  }
}

/**
 * 상금 금액 입력 (ELIM 모드)
 */
function updatePrizeAmt(pid, value) {
  const sel = state.selectedPlayers.get(pid);
  if (!sel || sel.mode !== 'ELIM') return;

  // 콤마 포맷팅
  const input = document.getElementById(`prizeAmt_${pid}`);
  const formatted = formatComma(value);
  input.value = formatted;

  // 데이터 저장
  sel.data.prizeAmt = formatted;
}

/**
 * 플레이어 제거
 */
function removePlayer(pid) {
  state.selectedPlayers.delete(pid);
  updateGridCell(pid);
  renderInputPanel();
  updateSendButton();
  vibrate([10]);
}
```

#### 4.2.5 Mode Switching
```javascript
/**
 * 활성 모드 변경
 */
function setActiveMode(mode) {
  state.activeMode = mode;
  localStorage.setItem(LS_KEYS.MODE, mode);

  // 모드 탭 UI 업데이트
  ['PU', 'ELIM', 'L3'].forEach(m => {
    const btn = document.getElementById(`modeBtn_${m}`);
    if (m === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  vibrate([5]);

  // 기존 선택은 유지!
  // 새로운 선택만 새 모드로 추가됨
}
```

#### 4.2.6 Send Function
```javascript
/**
 * 전송 처리
 */
async function send() {
  if (state.isProcessing) {
    toast('이미 전송 중입니다', 'error');
    return;
  }

  if (state.selectedPlayers.size === 0) {
    toast('플레이어를 선택하세요', 'error');
    return;
  }

  // 입력 검증
  const bbValue = parseIntClean(document.getElementById('commonBB').value);

  for (const [pid, sel] of state.selectedPlayers.entries()) {
    if (sel.mode === 'PU') {
      if (!sel.data.stack) {
        toast(`${sel.player.player}의 스택을 입력하세요`, 'error');
        return;
      }
      if (!bbValue) {
        toast('Big Blind를 입력하세요', 'error');
        return;
      }
    }

    if (sel.mode === 'ELIM') {
      if (!sel.data.prizeYN) {
        toast(`${sel.player.player}의 상금 유/무를 선택하세요`, 'error');
        return;
      }
      if (sel.data.prizeYN === '유' && !sel.data.prizeAmt) {
        toast(`${sel.player.player}의 상금 금액을 입력하세요`, 'error');
        return;
      }
    }
  }

  // BB 값 저장
  const bbRaw = document.getElementById('commonBB').value;
  if (bbRaw) localStorage.setItem(LS_KEYS.BB, bbRaw);

  state.isProcessing = true;

  // 시간 선택
  const autoNow = document.getElementById('chkAuto').checked;
  const picked = document.getElementById('selTime').value;
  const hhmm = picked ? picked.replace(':', '') : (state.timeCenter || '').slice(0, 5).replace(':', '');

  // 파일명 생성
  const filename = buildFilename(hhmm);

  // 페이로드 구성
  const items = [];
  for (const [pid, sel] of state.selectedPlayers.entries()) {
    const p = sel.player;
    let block = `${p.player.toUpperCase()} / ${getNat2(p.nat)}`;

    if (sel.mode === 'PU') {
      const stackRaw = parseIntClean(sel.data.stack);
      const bbCalc = (stackRaw > 0 && bbValue > 0) ? Math.round(stackRaw / bbValue) : '';
      block += `\nCURRENT STACK - ${sel.data.stack.toUpperCase()} (${bbCalc}BB)`;
    } else if (sel.mode === 'ELIM') {
      block += '\nELIMINATED';
      if (sel.data.prizeYN === '유' && sel.data.prizeAmt) {
        block += `\n${sel.data.prizeAmt.toUpperCase()}`;
      }
    } else if (sel.mode === 'L3') {
      block = `프로필 자막\n${p.player.toUpperCase()}`;
    }

    items.push({
      kind: sel.mode,
      playerName: p.player,
      nat: getNat2(p.nat),
      cueId: state.cueId || undefined,
      pickedTime: picked,
      autoNow,
      tz: state.tz,
      eFix: '미완료',
      gFix: 'SOFT',
      filename: filename,
      jBlock: block
    });
  }

  loading.show('전송 중...', `${items.length}명 일괄 전송`);

  try {
    const res = await sendBatchAsync(items);
    loading.hide();
    state.isProcessing = false;

    if (res?.ok) {
      const successCount = res.successCount || items.length;
      const failCount = res.failCount || 0;

      if (failCount === 0) {
        toast(`✅ ${successCount}개 전송 완료 (${filename})`, 'success');
        // 선택 초기화
        state.selectedPlayers.clear();
        renderPlayerGrid();
        updateSendButton();
      } else {
        toast(`⚠️ ${successCount}개 성공, ${failCount}개 실패`, 'error');
      }
    } else {
      toast(`전송 실패: ${res?.error || '알 수 없는 오류'}`, 'error');
    }
  } catch (err) {
    loading.hide();
    state.isProcessing = false;
    console.error('전송 오류:', err);
    toast(`전송 오류: ${err.message || '알 수 없는 오류'}`, 'error');
  }
}

/**
 * 배치 전송 (Promise 래핑)
 */
function sendBatchAsync(items) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .updateVirtualBatch(items);
  });
}
```

### 4.3 Utility Functions

```javascript
/**
 * 콤마 포맷팅
 */
function formatComma(value) {
  const num = parseIntClean(value);
  return num ? num.toLocaleString('en-US') : '';
}

/**
 * 숫자 추출 (콤마 제거)
 */
function parseIntClean(str) {
  const num = Number(String(str || '').replace(/[^0-9]/g, ''));
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * 국가 코드 2자리 추출
 */
function getNat2(code) {
  const v = String(code || '').trim().toUpperCase();
  if (!v) return '';
  return v.substring(0, 2);
}

/**
 * 국기 이모지 반환
 */
function getFlagEmoji(countryCode) {
  const code = getNat2(countryCode);
  if (!code) return '';

  // 간단한 매핑 (확장 가능)
  const flags = {
    'KR': '🇰🇷',
    'US': '🇺🇸',
    'JP': '🇯🇵',
    'CN': '🇨🇳',
    'GB': '🇬🇧'
    // ... 추가
  };

  return flags[code] || code;
}

/**
 * 파일명 생성
 */
function buildFilename(hhmm) {
  state.scCounter++;
  const scNum = String(state.scCounter).padStart(3, '0');
  const time = String(hhmm || '').padStart(4, '0');

  const names = Array.from(state.selectedPlayers.values())
    .map(sel => {
      const name = sel.player.player
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      return name.substring(0, 4);
    })
    .join('_');

  const filename = `${time}_SC${scNum}_${names}`;

  if (filename.length > 25) {
    const prefix = `${time}_SC${scNum}_`;
    const maxNames = 25 - prefix.length;
    return prefix + names.substring(0, maxNames);
  }

  return filename;
}

/**
 * 햅틱 피드백
 */
function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/**
 * Toast 메시지
 */
function toast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show';

  if (type === 'error') t.classList.add('error');
  if (type === 'success') t.classList.add('success');

  setTimeout(() => {
    t.className = 'toast';
  }, 2500);

  vibrate(type === 'error' ? [10, 50, 10] : [10]);
}

/**
 * 전송 버튼 텍스트 업데이트
 */
function updateSendButton() {
  const count = state.selectedPlayers.size;
  const text = count > 0 ? `전송 (${count}명)` : '전송 (0명)';
  document.getElementById('sendText').textContent = text;

  const btn = document.getElementById('btnSend');
  btn.disabled = count === 0;
}
```

---

## 5. Performance Optimization

### 5.1 Rendering Optimization
```javascript
// Debounce 함수 (필요시)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 예: BB 입력 시 디바운스 적용
const updateBBDebounced = debounce((value) => {
  // BB 값 저장 및 재계산
  localStorage.setItem(LS_KEYS.BB, value);
  renderInputPanel(); // 모든 BB 재계산
}, 300);
```

### 5.2 Event Delegation
```javascript
// 그리드 클릭 이벤트 위임 (선택적)
document.getElementById('playerGrid').addEventListener('click', (e) => {
  const cell = e.target.closest('.player-cell');
  if (cell) {
    const pid = cell.dataset.pid;
    togglePlayer(pid);
  }
});
```

### 5.3 CSS Optimization
```css
/* GPU 가속 애니메이션 */
.player-cell {
  will-change: transform;
}

/* 리플로우 최소화 */
.input-panel {
  contain: layout style paint;
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests (Manual)
- [ ] Player selection/deselection
- [ ] Mode switching with selections preserved
- [ ] Input validation (PU, ELIM, L3)
- [ ] BB auto-calculation
- [ ] Prize amount show/hide logic

### 6.2 Integration Tests
- [ ] Grid rendering with API data
- [ ] Input panel sync with selections
- [ ] Send batch to backend
- [ ] Error handling (network, validation)

### 6.3 E2E Tests (Manual)
- [ ] Full workflow: Select → Input → Send
- [ ] Mixed mode workflow
- [ ] Quick deselection and reselection
- [ ] Multiple table switching

### 6.4 Device Testing
- [ ] iPhone SE (375×667)
- [ ] iPhone 14 Pro (393×852)
- [ ] iPad (768×1024)
- [ ] Android (360×800)
- [ ] Desktop (1920×1080)

---

## 7. Deployment Checklist

### 7.1 Pre-Deployment
- [ ] Code review completed
- [ ] All tests passed
- [ ] Performance benchmarks met
- [ ] Browser compatibility verified
- [ ] Safe Area tested on iOS

### 7.2 Deployment Steps
1. Backup current `page.html`
2. Deploy new HTML to Apps Script
3. Test with staging Sheets
4. Deploy to production
5. Monitor error logs

### 7.3 Rollback Plan
- Keep previous version as `page_v13_backup.html`
- Quick switch via Apps Script version control

---

## 8. Maintenance

### 8.1 Known Limitations
- Maximum 9 players per table (design constraint)
- Input panel scrollable (if > 5 selections on mobile)
- Haptic feedback (device support varies)

### 8.2 Future Optimizations
- Virtual scrolling for large player lists
- Service Worker for offline support
- IndexedDB for local caching

---

## Appendix A: File Structure

```
softSender/
├── gs/
│   └── code.gs              # Backend logic (unchanged)
├── html/
│   ├── page.html            # Main UI (to be updated)
│   └── page_v13_backup.html # Backup
├── docs/
│   ├── PRD-Two-Panel-UI.md  # This PRD
│   └── LLD-Two-Panel-UI.md  # This LLD
└── README.md
```

---

## Appendix B: Data Flow Diagram

```
User Action (Player Click)
    ↓
togglePlayer(pid)
    ↓
state.selectedPlayers.set(pid, {player, mode, data})
    ↓
updateGridCell(pid) → Visual feedback
    ↓
renderInputPanel() → Add input card
    ↓
updateSendButton() → Update count
    ↓
User Input (Stack/Prize)
    ↓
updateStack() / updatePrizeYN() / updatePrizeAmt()
    ↓
state.selectedPlayers.get(pid).data = {updated values}
    ↓
BB auto-calculation → DOM update only
    ↓
User Send
    ↓
send() → Validation
    ↓
buildFilename() + Build payload
    ↓
google.script.run.updateVirtualBatch(items)
    ↓
Backend Processing (code.gs)
    ↓
Google Sheets Update
    ↓
Success/Error Response
    ↓
Toast + Reset selections
```

---

**Document Control**
- Version: 2.0
- Last Updated: 2025-10-03
- Author: Technical Team
- Next Review: After Implementation
