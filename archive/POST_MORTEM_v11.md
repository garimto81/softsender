# Post-Mortem: v11.0 실패 분석

## 📅 일자
2025-10-07

## 🚨 문제 요약
v11.0 Mobile UX Redesign 배포 후 즉시 실패, 긴급 롤백

---

## 💥 발생한 문제

### 에러 내용
```
Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
    at attachInputListeners (userCodeAppPanel:754:35)

Uncaught TypeError: Cannot read properties of null (reading 'value')
    at getSelectedPlayer (userCodeAppPanel:267:53)
```

### 원인
1. **DOM 요소 누락**: v11 HTML에서 기존 ID 제거
   - `selRoomTable`, `selSeat` 등 필수 요소 삭제
   - JavaScript가 존재하지 않는 요소 참조

2. **HTML/JS 불일치**:
   - HTML 구조 완전 변경
   - JavaScript는 기존 구조 가정
   - 통합 테스트 누락

3. **파일 구조 혼란**:
   - `src/` vs `src/frontend/` 중복
   - `-v11` 파일 별도 생성
   - 빌드 스크립트 2개 (build.js, build-v11.js)

---

## 🔍 근본 원인 분석

### 1. 전체 재작성 시도
- **문제**: v10.1 구조를 버리고 완전히 새로 작성
- **결과**: 기존 기능과 호환성 깨짐
- **교훈**: 점진적 개선 원칙 위반

### 2. 테스트 누락
- **문제**: 로컬 테스트 없이 바로 배포
- **결과**: 런타임 에러 발견 못함
- **교훈**: 빌드 != 작동 보장

### 3. 롤백 계획 부족
- **문제**: 백업 강조했으나 즉시 롤백 방법 미비
- **결과**: 사용자가 직접 문제 발견
- **교훈**: 자동 테스트 + 스테이징 환경 필요

### 4. 복잡도 증가
- **문제**:
  - 파일 2배 증가 (template.html + template-v11.html)
  - 빌드 스크립트 2개
  - 소스 구조 변경 (src/ → src/frontend/)
- **결과**: 혼란, 유지보수 어려움
- **교훈**: 단순함이 최고

---

## 📊 영향 범위

### 긍정적 (의도)
- 없음 (배포 직후 실패)

### 부정적 (실제)
- ❌ 서비스 중단 (사용자 검증 중 에러)
- ❌ 신뢰도 하락
- ❌ 개발 시간 낭비 (4시간)
- ❌ 기술 부채 증가 (v11 파일 정리 필요)

---

## ✅ 올바른 접근 방식

### 원칙
1. **기존 코드 유지**: v10.1 구조 100% 보존
2. **점진적 개선**: 한 번에 1가지만 변경
3. **호환성 보장**: 모든 테스트 통과 후 배포
4. **단순함 유지**: 파일 구조 복잡화 금지

### 3단계 개선안

#### Step 1: 코드 최적화 (v10.2) - JavaScript만
**목표**: 성능 개선, UI 변경 없음

**변경 사항**:
```javascript
// 1. 중복 제거 (preview.js 88줄)
function generatePreview(returnOnly = false) {
  // rebuildPreview + generateCurrentPreview 통합
}

// 2. DOM 캐싱 (성능)
const DOM = {
  stackAmt: document.getElementById('stackAmt'),
  preview: document.getElementById('preview')
  // 초기화 시 1회만 조회
};

// 3. rAF 최적화
let rafId;
input.addEventListener('input', () => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updatePreview);
});
```

**검증**:
- [ ] 모든 기능 동일하게 작동
- [ ] 입력 반응 빨라짐 (체감)
- [ ] 에러 없음

**예상 결과**:
- HTML: 변경 없음
- CSS: 변경 없음
- JS: 중복 제거, 성능 개선
- 빌드 크기: 유사 (35KB)

---

#### Step 2: CSS 개선 (v10.3) - CSS만
**목표**: 터치 영역 확대, Safe Area 지원

**변경 사항**:
```css
/* 터치 영역 확대 */
button, select, input {
  min-height: 48px; /* Apple HIG 준수 */
  font-size: 16px; /* iOS 줌 방지 */
}

/* 간격 확대 (오터치 방지) */
.tabs button { margin: 0 6px; }

/* Safe Area (iOS) */
body {
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

**검증**:
- [ ] 버튼 터치하기 쉬워짐
- [ ] iOS Notch 영역 겹치지 않음
- [ ] 모든 기능 동일

**예상 결과**:
- HTML: 변경 없음
- CSS: 터치 최적화
- JS: 변경 없음

---

#### Step 3: HTML 점진 개선 (v11.0+) - 컴포넌트별
**목표**: UI 개선, 한 번에 1개 컴포넌트만

**순서** (각 단계 검증 후 다음 진행):
1. **Header 교체**: "Soft Content Sender" → "T3"
   - 변경: header HTML만
   - 검증: 제목만 변경, 기능 동일

2. **Mode Tabs 교체**: 텍스트 → 아이콘+텍스트
   - 변경: tabs HTML + CSS
   - 검증: 모드 전환 동일

3. **Table Selector 교체**: 드롭다운 → 좌우 버튼
   - 변경: selector HTML + JS (이벤트만)
   - 검증: 테이블 선택 동일

4. **Seat Selector 교체**: 드롭다운 → 2×5 Grid
   - 변경: seat HTML + CSS
   - 검증: 좌석 선택 동일

**원칙**:
- 한 번에 1개만
- 기존 ID 유지 (호환성)
- 기존 함수 서명 유지
- 각 단계 배포 + 검증

---

## 🛠️ 파일 구조 정리

### 현재 상태 (혼란)
```
src/
  batch.js (삭제됨)
  constants.js (삭제됨)
  ...
src/frontend/
  scripts/
    batch.js (v11)
    components-v11.js (v11)
    ...
  template-v11.html (v11)
  styles-v11.css (v11)

build.js (v10.1)
build-v11.js (v11)
page.html (v10.1 작동)
page-v11.html (v11 실패)
```

### 정리 후 (단순)
```
src/frontend/
  scripts/
    constants.js
    utils.js
    preview.js
    batch.js
    events.js
    init.js
  template.html
  styles.css

build/
  frontend.js (빌드 스크립트)
  backend.js (빌드 스크립트)

dist/
  page.html (빌드 출력)
  Code.gs (빌드 출력)

softsender_code.gs (백엔드 소스, 정답)
```

**규칙**:
- `-v11` 파일 생성 금지
- 소스는 `src/frontend/` 한 곳에만
- 빌드 출력은 `dist/` + 루트 `page.html`

---

## 📝 배운 교훈

### Do ✅
1. **점진적 개선**: 한 번에 1가지만 변경
2. **로컬 테스트**: 브라우저에서 먼저 검증
3. **호환성 우선**: 기존 ID/클래스 유지
4. **단순함 유지**: 파일 구조 복잡화 금지
5. **롤백 계획**: 자동 복구 방법 준비

### Don't ❌
1. **전체 재작성**: 기존 구조 버리지 말 것
2. **한꺼번에 변경**: HTML+CSS+JS 동시 변경 금지
3. **테스트 생략**: 빌드 성공 ≠ 작동 보장
4. **파일 중복**: -v11, -v12 등 버전별 파일 생성 금지
5. **복잡도 증가**: "더 나은 구조"는 함정

---

## 🎯 다음 액션 플랜

### 즉시 (오늘)
1. [x] v11 파일 모두 삭제
2. [x] package.json 롤백
3. [ ] v10.1 재빌드 확인
4. [ ] 문서 업데이트 (이 문서 + STATUS.md)

### 단기 (이번 주)
1. [ ] Step 1 (코드 최적화) 계획 문서화
2. [ ] Step 1 구현 (JavaScript만)
3. [ ] 로컬 테스트 → 배포 → 검증

### 중기 (다음 주)
1. [ ] Step 2 (CSS 개선)
2. [ ] Step 3-1 (Header만)
3. [ ] 각 단계마다 배포 + 검증

---

## 💬 사용자 피드백

### 발견된 문제
- "Uncaught TypeError" 즉시 발견
- 롤백 요청

### 요구사항 재확인
1. **모바일 최적화가 아님**: 현재 v10.1도 모바일에서 작동
2. **코드 정리 우선**: 난립한 파일 구조 정리
3. **점진적 개선**: 한 번에 전체 변경 금지

---

## 📊 시간 분석

### 소요 시간
- v11 기획: 1시간
- v11 개발: 3시간
- **총 4시간 낭비**

### 올바른 접근 시 예상
- Step 1 (코드 최적화): 1시간
- Step 2 (CSS 개선): 30분
- Step 3-1 (Header): 20분
- **총 2시간, 점진적 배포**

### 교훈
- 빠르게 가려다 느려짐
- 단순함이 빠름

---

## 🔄 현재 상태

### 작동 중
- softsender_code.gs (백엔드)
- page.html (v10.1)
- src/frontend/scripts/*.js (v10.1 소스)

### 삭제 필요
- page-v11.html
- build-v11.js
- src/frontend/*-v11.*
- docs/CHANGELOG-v11.md
- docs/MOBILE_UX_REDESIGN.md
- DEPLOY-v11.md

### 복구 필요
- package.json → v10.1
- 문서 버전 → v10.1

---

## 🎓 핵심 메시지

> **"완벽한 재설계" < "점진적 개선"**
>
> 작동하는 코드를 버리지 말 것.
> 한 번에 하나씩, 검증하며 나아갈 것.
> 단순함이 최고의 아키텍처다.

---

**작성자**: AI Assistant
**검토자**: garimto81
**상태**: 롤백 완료, 재시작 준비
