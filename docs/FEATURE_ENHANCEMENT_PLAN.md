# 기능 개선 설계서
# Soft Content Sender - Enhanced Features v9

## 📋 문서 정보
- **작성일**: 2025-10-04
- **목표 버전**: v9
- **설계 원칙**: 최소 수정, 최대 효율

---

## 🎯 요구사항 분석

### 요구사항 1: Poker Room + Table No. 통합
**현재 상태**
- Room 선택 → Table 선택 (2단계)
- 사용자가 2번 클릭 필요

**개선 목표**
- **"PokerStars - Table 7"** 형식으로 통합 드롭다운 1개로 선택
- 클릭 1번으로 테이블 선택 완료

**개선 효과**
- UX 향상 (클릭 50% 감소)
- 화면 공간 절약
- 선택 오류 감소

---

### 요구사항 2: 이름 리스트로도 선택
**현재 상태**
- Seat No.로만 선택 가능 (#1, #2, #3...)
- 플레이어 이름을 알아도 좌석 번호를 찾아야 함

**개선 목표**
- **Seat No. 드롭다운**: `#1 - John Doe` 형식
- **이름 검색 드롭다운**: 별도로 제공 (선택사항)
- 둘 중 하나 선택하면 동기화

**개선 효과**
- 플레이어 이름으로 바로 찾기 가능
- 좌석 번호 모를 때 편리
- 기존 Seat 기반 워크플로우도 유지

---

### 요구사항 3: 복수 모드 + 여러 플레이어 선택
**현재 상태**
- 1개 모드만 선택
- 1명 플레이어만 처리
- 여러 명 처리하려면 여러 번 전송 필요

**개선 목표**
- **모드 다중 선택**: PU + ELIM 동시 선택 가능
- **플레이어 다중 선택**: 체크박스로 여러 명 선택
- **일괄 전송**: 선택된 플레이어 × 선택된 모드 = 한 번에 처리
- **미리보기**: 전체 내용 표시

**개선 효과**
- 작업 시간 대폭 단축 (예: 5명 × 2모드 = 10번 → 1번)
- 실수 감소
- 일관성 있는 데이터 입력

---

## 🏗️ 아키텍처 분석

### 현재 구조의 강점
✅ **데이터 인덱싱**: `byRoom`, `byRoomTable` 구조로 빠른 검색
✅ **모듈화**: 함수별로 명확히 분리됨
✅ **서버-클라이언트 분리**: GAS + HTML 구조 유지
✅ **유효성 검사**: 입력 검증 잘 되어 있음

### 변경 최소화 전략
1. **서버 API 수정 최소화** → 클라이언트만 주로 수정
2. **기존 데이터 구조 유지** → Type 시트 컬럼 추가 없음
3. **하위 호환성 유지** → 단일 모드/단일 플레이어도 계속 지원
4. **점진적 개선** → 기능별로 독립적으로 구현

---

## 📐 상세 설계

## 1️⃣ Room + Table 통합 드롭다운

### UI 변경

#### Before (현재)
```html
<div class="row three">
  <div class="field">
    <label>Poker Room</label>
    <select id="selRoom">...</select>
  </div>
  <div class="field">
    <label>Table No.</label>
    <select id="selTableNo">...</select>
  </div>
  <div class="field">
    <label>Seat No.</label>
    <select id="selSeat">...</select>
  </div>
</div>
```

#### After (개선)
```html
<div class="row two">
  <div class="field">
    <label>테이블 선택</label>
    <select id="selRoomTable">
      <option value="">-</option>
      <option value="PokerStars|7">PokerStars - Table 7</option>
      <option value="PokerStars|8">PokerStars - Table 8</option>
      <option value="888poker|3">888poker - Table 3</option>
    </select>
  </div>
  <div class="field">
    <label>좌석/플레이어 선택</label>
    <select id="selSeat">...</select>
  </div>
</div>
```

### 데이터 구조 변경

#### 새 인덱스 추가
```javascript
state.byRoomTable = {
  "PokerStars|7": [
    { room: "PokerStars", tno: "7", seat: "#1", player: "John Doe", ... },
    { room: "PokerStars", tno: "7", seat: "#2", player: "Kim Minsu", ... }
  ],
  "888poker|3": [...]
};

// 새로 추가: 테이블 목록
state.tableList = [
  { key: "PokerStars|7", label: "PokerStars - Table 7", room: "PokerStars", tno: "7" },
  { key: "PokerStars|8", label: "PokerStars - Table 8", room: "PokerStars", tno: "8" },
  { key: "888poker|3", label: "888poker - Table 3", room: "888poker", tno: "3" }
];
```

### 함수 수정

#### `indexTypeRows()` 수정
```javascript
function indexTypeRows(rows){
  state.byRoomTable = {};
  state.tableList = [];

  rows.forEach(r => {
    const key = r.room + '|' + r.tno;
    (state.byRoomTable[key] ||= []).push(r);
  });

  // 테이블 목록 생성
  Object.keys(state.byRoomTable).forEach(key => {
    const [room, tno] = key.split('|');
    const tname = state.byRoomTable[key][0]?.tname || '';
    state.tableList.push({
      key,
      label: `${room} - ${tname || 'Table ' + tno}`,
      room,
      tno
    });
  });

  // 정렬: Room → Table No.
  state.tableList.sort((a,b) => {
    if (a.room !== b.room) return a.room.localeCompare(b.room);
    return Number(a.tno) - Number(b.tno);
  });
}
```

#### `fillRoomTables()` 신규 함수
```javascript
function fillRoomTables() {
  const sel = document.getElementById('selRoomTable');
  sel.innerHTML = '<option value="">-</option>';

  state.tableList.forEach(t => {
    const o = document.createElement('option');
    o.value = t.key;
    o.textContent = t.label;
    sel.appendChild(o);
  });

  if (sel.options.length > 1) sel.selectedIndex = 1; // 첫 테이블 자동 선택
  fillSeatsFromRoomTable();
}
```

#### `fillSeatsFromRoomTable()` 신규 함수
```javascript
function fillSeatsFromRoomTable() {
  const key = document.getElementById('selRoomTable').value;
  const sel = document.getElementById('selSeat');
  sel.innerHTML = '<option value="">-</option>';

  if (!key) return;

  const arr = state.byRoomTable[key] || [];
  const seats = [...new Set(arr.map(r => normSeat(r.seat)))]
    .sort((a,b) => Number(a.replace('#','')) - Number(b.replace('#','')));

  seats.forEach(s => {
    const player = arr.find(r => normSeat(r.seat) === s);
    const o = document.createElement('option');
    o.value = s;
    o.textContent = `${s} - ${player?.player || ''}`;
    sel.appendChild(o);
  });

  if (sel.options.length > 1) sel.selectedIndex = 1;
  applyPickFromSeat();
}
```

### 서버 API 수정
**수정 필요 없음** ✅ (클라이언트만 수정)

---

## 2️⃣ 이름으로도 선택 가능

### UI 변경

#### 추가 드롭다운 (선택 옵션)
```html
<div class="field">
  <label>좌석/플레이어 선택</label>
  <div class="row two">
    <select id="selSeat">
      <option value="">좌석 선택</option>
      <option value="#1">#1 - John Doe</option>
      <option value="#2">#2 - Kim Minsu</option>
    </select>
    <select id="selPlayer">
      <option value="">이름 선택</option>
      <option value="John Doe">John Doe (#1)</option>
      <option value="Kim Minsu">Kim Minsu (#2)</option>
    </select>
  </div>
</div>
```

### 함수 추가

#### `fillPlayers()` 신규 함수
```javascript
function fillPlayers() {
  const key = document.getElementById('selRoomTable').value;
  const sel = document.getElementById('selPlayer');
  sel.innerHTML = '<option value="">이름 선택</option>';

  if (!key) return;

  const arr = state.byRoomTable[key] || [];

  // 이름 알파벳순 정렬
  const sorted = arr.slice().sort((a,b) => a.player.localeCompare(b.player));

  sorted.forEach(r => {
    const o = document.createElement('option');
    o.value = r.player;
    o.textContent = `${r.player} (${normSeat(r.seat)})`;
    o.dataset.seat = normSeat(r.seat); // 좌석 번호 저장
    sel.appendChild(o);
  });
}
```

#### 동기화 로직
```javascript
// Seat 선택 시 → Player 드롭다운 동기화
document.getElementById('selSeat').addEventListener('change', () => {
  const seat = document.getElementById('selSeat').value;
  const key = document.getElementById('selRoomTable').value;
  const arr = state.byRoomTable[key] || [];
  const player = arr.find(r => normSeat(r.seat) === seat);

  if (player) {
    document.getElementById('selPlayer').value = player.player;
  }
  applyPickFromSeat();
});

// Player 선택 시 → Seat 드롭다운 동기화
document.getElementById('selPlayer').addEventListener('change', () => {
  const sel = document.getElementById('selPlayer');
  const seat = sel.options[sel.selectedIndex]?.dataset.seat;

  if (seat) {
    document.getElementById('selSeat').value = seat;
  }
  applyPickFromSeat();
});
```

### 서버 API 수정
**수정 필요 없음** ✅

---

## 3️⃣ 복수 모드 + 여러 플레이어 일괄 처리

### UI 변경 (대폭 개편)

#### 모드 선택: 탭 → 체크박스
```html
<!-- Before -->
<div class="tabs">
  <button id="tabPU" class="active">스택 업데이트(PU)</button>
  <button id="tabELIM">탈락 정보(ELIM)</button>
  <button id="tabL3">프로필 자막(L3)</button>
  <button id="tabLB">리더보드(LEADERBOARD)</button>
</div>

<!-- After -->
<div class="field">
  <label>모드 선택 (다중 선택 가능)</label>
  <div style="display:flex; gap:20px; flex-wrap:wrap;">
    <label style="display:flex; align-items:center; gap:8px;">
      <input type="checkbox" id="chkPU" style="width:auto;height:auto;transform:scale(1.5);" />
      <span>스택 업데이트 (PU)</span>
    </label>
    <label style="display:flex; align-items:center; gap:8px;">
      <input type="checkbox" id="chkELIM" checked style="width:auto;height:auto;transform:scale(1.5);" />
      <span>탈락 정보 (ELIM)</span>
    </label>
    <label style="display:flex; align-items:center; gap:8px;">
      <input type="checkbox" id="chkL3" style="width:auto;height:auto;transform:scale(1.5);" />
      <span>프로필 자막 (L3)</span>
    </label>
    <label style="display:flex; align-items:center; gap:8px;">
      <input type="checkbox" id="chkLB" style="width:auto;height:auto;transform:scale(1.5);" />
      <span>리더보드 (LEADERBOARD)</span>
    </label>
  </div>
</div>
```

#### 플레이어 선택: 드롭다운 → 체크박스 리스트
```html
<div class="field">
  <label>
    플레이어 선택 (다중 선택 가능)
    <button class="btn ghost" id="btnSelectAll" style="margin-left:10px;">전체 선택</button>
    <button class="btn ghost" id="btnDeselectAll" style="margin-left:10px;">전체 해제</button>
  </label>
  <div id="playerList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
    <!-- 동적 생성 -->
    <label class="player-item" style="display:flex; align-items:center; gap:10px; padding:12px; background:var(--panel); border-radius:12px;">
      <input type="checkbox" class="chkPlayer" value="#1" data-player="John Doe" data-nat="US" style="width:auto;height:auto;transform:scale(1.4);" />
      <div>
        <div style="font-weight:600;">#1 John Doe</div>
        <div class="muted" style="font-size:0.85em;">United States of America</div>
      </div>
    </label>
    <!-- 반복... -->
  </div>
</div>
```

#### 모드별 입력 패널 (공통 데이터)
```html
<!-- PU 모드 선택 시 표시 -->
<div id="panelPU" style="display:none;">
  <div class="field">
    <label>PU 공통 설정</label>
    <div class="row two">
      <div class="field">
        <label>Big Blind (모든 선택된 플레이어 공통)</label>
        <input id="commonBigBlind" placeholder="예: 20000" inputmode="numeric" />
      </div>
    </div>
    <p class="muted">각 플레이어별 칩스택은 아래 입력란에서 개별 설정</p>
  </div>
</div>

<!-- ELIM 모드 선택 시 표시 -->
<div id="panelELIM" style="display:none;">
  <div class="field">
    <label>ELIM 공통 설정</label>
    <div class="row two">
      <div class="field">
        <label>상금 유무 (모든 선택된 플레이어 공통)</label>
        <select id="commonPrize">
          <option value="유">상금 유</option>
          <option value="무">상금 무</option>
        </select>
      </div>
    </div>
  </div>
</div>
```

#### 플레이어별 상세 입력 (PU 모드용)
```html
<div id="playerInputs" class="field" style="display:none;">
  <label>선택된 플레이어별 입력 (PU 모드)</label>
  <div id="playerInputList">
    <!-- 동적 생성 -->
    <div class="player-input-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:12px; background:var(--panel2); border-radius:12px; margin-bottom:10px;">
      <div>
        <label style="font-weight:600;">#1 John Doe</label>
        <input class="playerStack" data-seat="#1" placeholder="칩스택 (예: 1,234,000)" inputmode="numeric" />
      </div>
      <div style="display:flex; align-items:flex-end;">
        <input class="playerBB" readonly placeholder="BB 자동 계산" />
      </div>
    </div>
    <!-- 반복... -->
  </div>
</div>
```

#### 미리보기 (통합 결과)
```html
<section class="field">
  <label>
    전송될 내용 미리보기 (총 <span id="previewCount">0</span>건)
  </label>
  <textarea id="preview" readonly style="min-height:400px;"></textarea>
  <div class="muted" style="margin-top:8px;">
    각 플레이어 × 각 모드별로 구분선(빈 줄)으로 구분되어 J셀에 append됩니다.
  </div>
</section>
```

### 데이터 구조

#### State 추가
```javascript
state.selectedModes = [];     // ['PU', 'ELIM']
state.selectedPlayers = [];   // [{ seat: '#1', player: 'John Doe', nat: 'US', ... }]
state.playerInputs = {};      // { '#1': { stackAmt: '1234000', ... } }
```

### 핵심 로직

#### 모드 체크박스 변경 시
```javascript
function updateSelectedModes() {
  state.selectedModes = [];
  if (document.getElementById('chkPU').checked) state.selectedModes.push('PU');
  if (document.getElementById('chkELIM').checked) state.selectedModes.push('ELIM');
  if (document.getElementById('chkL3').checked) state.selectedModes.push('L3');
  if (document.getElementById('chkLB').checked) state.selectedModes.push('LEADERBOARD');

  // 관련 패널 표시/숨김
  document.getElementById('panelPU').style.display =
    state.selectedModes.includes('PU') ? 'block' : 'none';
  document.getElementById('panelELIM').style.display =
    state.selectedModes.includes('ELIM') ? 'block' : 'none';
  document.getElementById('panelL3').style.display =
    state.selectedModes.includes('L3') ? 'block' : 'none';
  document.getElementById('panelLB').style.display =
    state.selectedModes.includes('LEADERBOARD') ? 'block' : 'none';

  // PU 선택 시 플레이어별 입력란 표시
  document.getElementById('playerInputs').style.display =
    state.selectedModes.includes('PU') ? 'block' : 'none';

  rebuildPreview();
}
```

#### 플레이어 체크박스 변경 시
```javascript
function updateSelectedPlayers() {
  state.selectedPlayers = [];
  const key = document.getElementById('selRoomTable').value;
  const arr = state.byRoomTable[key] || [];

  document.querySelectorAll('.chkPlayer:checked').forEach(chk => {
    const seat = chk.value;
    const player = arr.find(r => normSeat(r.seat) === seat);
    if (player) state.selectedPlayers.push(player);
  });

  // PU 모드 선택 시 개별 입력란 생성
  if (state.selectedModes.includes('PU')) {
    buildPlayerInputs();
  }

  rebuildPreview();
}

function buildPlayerInputs() {
  const list = document.getElementById('playerInputList');
  list.innerHTML = '';

  state.selectedPlayers.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-input-row';
    row.innerHTML = `
      <div>
        <label style="font-weight:600;">${normSeat(p.seat)} ${p.player}</label>
        <input class="playerStack" data-seat="${normSeat(p.seat)}" placeholder="칩스택 (예: 1,234,000)" inputmode="numeric" />
      </div>
      <div style="display:flex; align-items:flex-end;">
        <input class="playerBB" data-seat="${normSeat(p.seat)}" readonly placeholder="BB 자동 계산" />
      </div>
    `;
    list.appendChild(row);

    // 입력 이벤트 리스너
    const stackInput = row.querySelector('.playerStack');
    stackInput.addEventListener('input', () => {
      formatInputWithComma(stackInput);
      computeBBForPlayer(normSeat(p.seat));
      rebuildPreview();
    });
  });
}

function computeBBForPlayer(seat) {
  const stackInput = document.querySelector(`.playerStack[data-seat="${seat}"]`);
  const bbInput = document.querySelector(`.playerBB[data-seat="${seat}"]`);
  const commonBB = parseIntClean(document.getElementById('commonBigBlind').value);

  const amt = parseIntClean(stackInput.value);
  const bb = (amt > 0 && commonBB > 0) ? Math.round(amt / commonBB) : '';

  bbInput.value = bb ? `${bb}BB` : '';

  // State 저장
  state.playerInputs[seat] = {
    stackAmt: stackInput.value,
    bb: bb
  };
}
```

#### 미리보기 생성 (복수 모드 × 복수 플레이어)
```javascript
function rebuildPreview() {
  if (state.selectedPlayers.length === 0 || state.selectedModes.length === 0) {
    document.getElementById('preview').value = '';
    document.getElementById('previewCount').textContent = '0';
    return;
  }

  const blocks = [];

  state.selectedPlayers.forEach(player => {
    state.selectedModes.forEach(mode => {
      const block = buildBlockForPlayerMode(player, mode);
      if (block) blocks.push(block);
    });
  });

  document.getElementById('preview').value = blocks.join('\n\n');
  document.getElementById('previewCount').textContent = blocks.length;
}

function buildBlockForPlayerMode(player, mode) {
  const country = iso2ToFull(player.nat).toUpperCase();
  const name = player.player.toUpperCase();

  if (mode === 'PU') {
    const input = state.playerInputs[normSeat(player.seat)];
    if (!input || !input.stackAmt) return null;

    const amt = input.stackAmt;
    const bb = input.bb || '';
    return `${country}\n${name}\nCURRENT STACK - ${amt} (${bb}BB)`;

  } else if (mode === 'ELIM') {
    const prize = document.getElementById('commonPrize').value === '유' ? '상금 유' : '상금 무';
    return `${country}\n${name}\nELIMINATED\n${prize.toUpperCase()}`;

  } else if (mode === 'L3') {
    return `프로필 자막\n${name}`;

  } else if (mode === 'LEADERBOARD') {
    // LEADERBOARD는 개별 플레이어가 아니라 전체 테이블이므로 1번만 처리
    return null; // 별도 처리
  }

  return null;
}
```

#### 전송 로직 (일괄 전송)
```javascript
function sendBatch() {
  if (state.selectedPlayers.length === 0) {
    toast('플레이어를 선택하세요.', false);
    return;
  }

  if (state.selectedModes.length === 0) {
    toast('모드를 선택하세요.', false);
    return;
  }

  // 유효성 검사
  if (state.selectedModes.includes('PU')) {
    const commonBB = parseIntClean(document.getElementById('commonBigBlind').value);
    if (!commonBB) {
      toast('PU 모드: Big Blind를 입력하세요.', false);
      return;
    }

    const allHaveStack = state.selectedPlayers.every(p => {
      const input = state.playerInputs[normSeat(p.seat)];
      return input && parseIntClean(input.stackAmt) > 0;
    });

    if (!allHaveStack) {
      toast('PU 모드: 모든 플레이어의 칩스택을 입력하세요.', false);
      return;
    }
  }

  if (state.selectedModes.includes('ELIM')) {
    if (!document.getElementById('commonPrize').value) {
      toast('ELIM 모드: 상금 유무를 선택하세요.', false);
      return;
    }
  }

  // Payload 생성
  const autoNow = document.getElementById('chkAuto').checked;
  const picked = document.getElementById('selTime').value;
  const jBlock = document.getElementById('preview').value;

  if (!jBlock) {
    toast('미리보기 내용이 비어있습니다.', false);
    return;
  }

  // 파일명 생성 (복수 처리)
  const [room, tno] = document.getElementById('selRoomTable').value.split('|');
  const hhmm = hhmmFromTimeStr(picked || state.timeCenter.slice(0,5));

  // 여러 플레이어 × 여러 모드 → 파일명에 "Batch" 표시
  const filename = `${hhmm}_Batch_${state.selectedPlayers.length}P_${state.selectedModes.join('_')}`;

  setStatus('전송 중…');

  google.script.run.withSuccessHandler(res => {
    if (!res?.ok) {
      toast('실패: ' + (res?.error || 'unknown'), false);
      setStatus('에러');
      return;
    }
    toast(`행 ${res.row}(${res.time}) 일괄 갱신 완료 (${state.selectedPlayers.length}명 × ${state.selectedModes.length}모드)`);
    setStatus('준비됨');
  }).withFailureHandler(err => {
    toast('서버 오류: ' + (err?.message || err), false);
    setStatus('에러');
  }).updateVirtual({
    autoNow,
    pickedTime: picked,
    tz: state.tz,
    kind: 'BATCH', // 새 모드
    eFix: '미완료',
    gFix: 'SOFT',
    filename,
    jBlock,
    cueId: state.cueId || undefined
  });
}
```

### 서버 API 수정

#### `buildFileName()` 수정
```javascript
function buildFileName(kind, hhmm, tableNo, playerOrLabel) {
  const safe = (s) => String(s || '').trim().replace(/[^\w\-#]+/g,'_');
  const modes = ['PU','ELIM','L3','LEADERBOARD','BATCH']; // BATCH 추가
  const mode = modes.includes(kind) ? kind : 'SC';
  const time = String(hhmm || '').padStart(4,'0');
  const name = (kind==='LEADERBOARD') ? safe(playerOrLabel || ('Table'+(tableNo||''))) : safe(playerOrLabel || 'Player');
  return `${time}_${name}_${mode}`;
}
```

**다른 서버 함수는 수정 불필요** ✅

---

## 🔄 마이그레이션 계획

### Phase 1: Room+Table 통합 (1시간)
1. `indexTypeRows()` 수정 → `tableList` 생성
2. `fillRoomTables()` 함수 추가
3. HTML에서 `selRoom`, `selTableNo` 제거, `selRoomTable` 추가
4. 이벤트 리스너 수정
5. 테스트

### Phase 2: 이름 선택 추가 (30분)
1. `fillPlayers()` 함수 추가
2. HTML에 `selPlayer` 드롭다운 추가
3. 동기화 로직 추가
4. 테스트

### Phase 3: 다중 선택 (2시간)
1. 모드 탭 → 체크박스 변경
2. 플레이어 드롭다운 → 체크박스 리스트 변경
3. State에 `selectedModes`, `selectedPlayers` 추가
4. `updateSelectedModes()`, `updateSelectedPlayers()` 함수 추가
5. 모드별 공통 입력 패널 추가
6. 플레이어별 상세 입력 패널 추가 (PU)
7. `rebuildPreview()` 대폭 수정
8. `sendBatch()` 함수 추가
9. 서버 `buildFileName()`에 'BATCH' 추가
10. 테스트

### 총 예상 시간: **3.5시간**

---

## 📊 변경 영향 분석

### 서버 코드 (softsender_code.gs)
| 함수 | 변경 | 난이도 |
|------|------|--------|
| `getBootstrap()` | 변경 없음 | - |
| `getTypeRows()` | 변경 없음 | - |
| `getCountryMap()` | 변경 없음 | - |
| `getTimeOptions()` | 변경 없음 | - |
| `buildFileName()` | `BATCH` 추가 | ⭐ 쉬움 |
| `updateVirtual()` | 변경 없음 | - |

**서버 수정: 1개 함수, 1줄 추가** ✅

### 클라이언트 코드 (softsender.gs)
| 영역 | 변경 | 난이도 |
|------|------|--------|
| HTML 구조 | 중간 수정 | ⭐⭐ 보통 |
| CSS | 변경 없음 | - |
| State 객체 | 3개 필드 추가 | ⭐ 쉬움 |
| 인덱싱 함수 | `indexTypeRows()` 수정 | ⭐⭐ 보통 |
| UI 채우기 함수 | 신규 3개, 수정 2개 | ⭐⭐⭐ 중간 |
| 미리보기 함수 | 대폭 수정 | ⭐⭐⭐ 중간 |
| 전송 함수 | `sendBatch()` 신규 | ⭐⭐⭐ 중간 |
| 이벤트 리스너 | 10개 추가 | ⭐⭐ 보통 |

**클라이언트 수정: 중간 규모** (기존 구조 유지)

---

## 🎨 UI 개선 사항

### 레이아웃 변경
```
Before (3단계 선택):
[Poker Room ▼] [Table No. ▼] [Seat No. ▼]
         ↓
[이름 입력] [국가 입력]
         ↓
[모드 탭 4개]
         ↓
[모드별 입력란]
         ↓
[미리보기]
         ↓
[전송 버튼]

After (2단계 선택 + 다중):
[테이블 선택: PokerStars - Table 7 ▼]
         ↓
[☑ PU] [☑ ELIM] [☐ L3] [☐ LB]  ← 다중 선택
         ↓
[☑ #1 John Doe]   [☑ #3 Lee Hyun]
[☐ #2 Kim Minsu]  [☐ #4 Alice Wong]  ← 체크박스 그리드
         ↓
[공통 설정: Big Blind 입력 (PU 모드)]
[공통 설정: 상금 유무 (ELIM 모드)]
         ↓
[플레이어별 칩스택 입력 (PU 모드만)]
#1 John Doe: [1,234,000] → 62BB
#3 Lee Hyun: [987,000]  → 49BB
         ↓
[미리보기 (4건)]  ← 2명 × 2모드
UNITED STATES...
JOHN DOE
CURRENT STACK - 1,234,000 (62BB)

SOUTH KOREA
LEE HYUN
CURRENT STACK - 987,000 (49BB)

UNITED STATES...
JOHN DOE
ELIMINATED
상금 유

SOUTH KOREA
LEE HYUN
ELIMINATED
상금 유
         ↓
[일괄 전송] 버튼
```

### 접근성 개선
- 체크박스 크기: 1.4~1.5배 확대
- 터치 영역: 최소 44px × 44px
- 색상 대비: WCAG AA 준수
- 키보드 네비게이션: Tab, Space, Enter 지원

---

## 🧪 테스트 계획

### 단위 테스트
1. `indexTypeRows()` → `tableList` 정확성
2. `fillRoomTables()` → 드롭다운 정렬 순서
3. `buildBlockForPlayerMode()` → 각 모드별 출력 형식
4. `computeBBForPlayer()` → BB 계산 정확성

### 통합 테스트
1. Room+Table 선택 → Seat 목록 갱신
2. Seat 선택 ↔ Player 선택 동기화
3. 모드 체크박스 변경 → 패널 표시/숨김
4. 플레이어 체크박스 변경 → 미리보기 갱신
5. 일괄 전송 → Sheet 업데이트 확인

### 엣지 케이스
1. 플레이어 0명 선택 → 에러 메시지
2. 모드 0개 선택 → 에러 메시지
3. PU 모드에서 일부 플레이어 칩스택 미입력 → 에러
4. LEADERBOARD + 다른 모드 동시 선택 → LEADERBOARD는 1회만
5. 100명 플레이어 × 4 모드 = 400건 → 성능 확인

---

## 📈 성능 최적화

### 렌더링 최적화
```javascript
// Before: 매번 innerHTML로 전체 재생성
function fillSeats() {
  sel.innerHTML = '';
  seats.forEach(s => {
    sel.innerHTML += `<option value="${s}">${s}</option>`;
  });
}

// After: DocumentFragment 사용
function fillSeats() {
  const fragment = document.createDocumentFragment();
  seats.forEach(s => {
    const o = document.createElement('option');
    o.value = o.textContent = s;
    fragment.appendChild(o);
  });
  sel.innerHTML = '';
  sel.appendChild(fragment);
}
```

### 미리보기 갱신 디바운싱
```javascript
let previewTimeout = null;

function rebuildPreviewDebounced() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(rebuildPreview, 300);
}

// 이벤트 리스너에 적용
stackInput.addEventListener('input', rebuildPreviewDebounced);
```

---

## 🔐 보안 고려사항

### XSS 방지
```javascript
// textContent 사용 (innerHTML 지양)
o.textContent = player.player; // ✅ 안전

// 또는 이스케이프 함수
function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
```

### 입력 검증 강화
```javascript
function validateBatchInput() {
  // 플레이어 수 제한 (DoS 방지)
  if (state.selectedPlayers.length > 50) {
    toast('플레이어는 최대 50명까지 선택 가능합니다.', false);
    return false;
  }

  // 미리보기 크기 제한 (10KB)
  const preview = document.getElementById('preview').value;
  if (preview.length > 10000) {
    toast('미리보기 내용이 너무 큽니다. (최대 10KB)', false);
    return false;
  }

  return true;
}
```

---

## 📝 사용자 가이드 업데이트

### 새 기능 설명 추가
1. "테이블 선택" 드롭다운 사용법
2. "이름으로 찾기" 기능 설명
3. "다중 선택" 워크플로우:
   - 모드 여러 개 체크
   - 플레이어 여러 명 체크
   - 공통 설정 입력
   - 플레이어별 개별 설정 (PU)
   - 미리보기 확인 (N건 표시)
   - 일괄 전송

### FAQ 추가
**Q: 여러 모드를 선택했는데 일부만 전송할 수 있나요?**
A: 네, 체크박스를 해제하면 해당 모드는 제외됩니다.

**Q: 플레이어별로 다른 상금 유무를 설정할 수 있나요?**
A: 현재는 공통 설정만 지원합니다. 개별 설정이 필요하면 2번 나눠서 전송하세요.

**Q: LEADERBOARD는 다른 모드와 어떻게 다른가요?**
A: LEADERBOARD는 테이블 전체 정보이므로, 선택된 플레이어 무시하고 전체 테이블로 1번만 생성됩니다.

---

## 🚀 배포 전략

### 버전 관리
- **v8**: 현재 버전 (백업)
- **v9-beta**: 개발 버전 (테스트용)
- **v9**: 정식 릴리스

### 롤백 계획
1. v8 코드 백업 (별도 파일)
2. v9 배포 후 문제 발생 시:
   - Apps Script에서 이전 버전 복원
   - 또는 백업 파일로 교체

### 단계적 배포
1. **내부 테스트** (1주)
   - 개발팀 사용
   - 버그 수정
2. **베타 테스트** (1주)
   - 일부 사용자 초대
   - 피드백 수집
3. **정식 배포**
   - 전체 공개
   - 사용자 가이드 배포

---

## 📊 예상 효과

### 작업 시간 단축
**시나리오**: 5명 플레이어 × 2개 모드 (PU + ELIM) 입력

| 항목 | v8 (현재) | v9 (개선) | 절감률 |
|------|-----------|-----------|--------|
| Room 선택 | 10회 (2초×5 + 2초×5) | 1회 (2초) | -90% |
| Table 선택 | 10회 | 0회 | -100% |
| Seat 선택 | 10회 (2초×10) | 1회 (5초, 체크) | -75% |
| 모드 선택 | 10회 (1초×10) | 1회 (2초, 체크) | -80% |
| 데이터 입력 | 10회 (10초×10) | 1회 (30초, 일괄) | -70% |
| 전송 클릭 | 10회 (1초×10) | 1회 (1초) | -90% |
| **총 시간** | **약 150초** | **약 40초** | **-73%** |

### 오류 감소
- Room/Table 선택 오류: **-90%** (1회만 선택)
- 데이터 일관성: **+100%** (공통 설정 사용)
- 누락: **-50%** (체크박스 시각적 확인)

---

## 🎯 결론

### 핵심 성과
✅ **서버 코드 수정 최소화**: 1개 함수, 1줄 추가
✅ **데이터 구조 변경 없음**: Type 시트 그대로 사용
✅ **하위 호환성 유지**: 단일 모드/플레이어도 계속 지원
✅ **작업 시간 73% 단축**: 150초 → 40초
✅ **UX 대폭 개선**: 클릭 횟수 90% 감소

### 리스크
⚠️ **UI 복잡도 증가**: 체크박스 많아짐 → 사용자 교육 필요
⚠️ **미리보기 크기**: 대량 처리 시 화면 스크롤 → 페이지네이션 고려
⚠️ **테스트 범위 증가**: 조합 케이스 많아짐

### 권장사항
1. **Phase 1, 2부터 먼저 구현** (Room+Table 통합, 이름 선택)
   - 리스크 낮음
   - 즉시 효과 체감
2. **Phase 3는 베타 테스트 후 배포**
   - 복잡도 높음
   - 충분한 테스트 필요
3. **사용자 가이드 필수**
   - 스크린샷 포함
   - 비디오 튜토리얼 권장

---

**예상 개발 시간**: 3.5시간
**예상 테스트 시간**: 2시간
**총 예상 시간**: 5.5시간

**ROI**: 작업 시간 73% 단축 → 10회 사용 시 투자 회수 완료 ✅
