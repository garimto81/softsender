# PRD-0001: Virtual 시트 K열 '소프트 콘텐츠' 전송 추가

**버전**: 1.0
**작성일**: 2025-01-15
**상태**: ✅ 완료 (v11.1)

---

## 1. 개요 (Overview)

Virtual 시트 데이터 전송 시 기존 J열까지 전송하던 기능을 K열까지 확장하고, K열에 '소프트 콘텐츠' 고정 문자열을 추가합니다.

---

## 2. 목표 (Goals)

- Virtual 시트 전송 범위를 J열 → K열로 확장
- 모든 모드(PU/ELIM/L3/LEADERBOARD)에서 K열에 '소프트 콘텐츠' 자동 입력
- 기존 A~J열 로직은 변경 없음

---

## 3. 사용자 스토리 (User Stories)

**As a** 방송 자막 오퍼레이터
**I want to** Virtual 시트 K열에 자동으로 '소프트 콘텐츠' 입력되도록
**So that** 수동 입력 없이 일관된 콘텐츠 분류 가능

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 필수 기능

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-1 | 모든 모드에서 K열에 '소프트 콘텐츠' 문자열 전송 | P0 |
| FR-2 | 단일 전송 시 K열 포함 | P0 |
| FR-3 | 배치 전송 시 모든 행의 K열 포함 | P0 |
| FR-4 | 기존 A~J열 데이터 유지 | P0 |

### 4.2 수정 대상

**파일**: `softsender_code.gs`
**함수**: `updateVirtual()`, `updateVirtualBatch()`

**변경 내용**:
```javascript
// Before (J열까지)
const row = [
  timeCode, fileName, subLayer, inOut, duration,
  title, player, flag, content, extra  // J열
];

// After (K열 추가)
const row = [
  timeCode, fileName, subLayer, inOut, duration,
  title, player, flag, content, extra,  // J열
  '소프트 콘텐츠'                        // K열 (신규)
];
```

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| 속성 | 요구사항 |
|------|----------|
| 성능 | 전송 속도 변화 없음 (K열 추가로 인한 지연 <10ms) |
| 호환성 | 기존 Virtual 시트 구조와 호환 (K열 추가) |
| 유지보수 | 하드코딩된 문자열 ('소프트 콘텐츠') 명확히 표시 |

---

## 6. 제외 사항 (Out of Scope)

- ❌ K열 값 변경 기능 (항상 '소프트 콘텐츠' 고정)
- ❌ UI 변경 (프론트엔드 수정 없음)
- ❌ 다른 시트(Type, Players) 수정
- ❌ 미리보기에 K열 표시 (선택사항, 필수 아님)

---

## 7. 디자인 & UX (Design)

**변경 없음** (서버 측 로직만 수정)

---

## 8. 기술 사양 (Technical Specifications)

### 8.1 수정 함수

**1. `updateVirtual()` (단일 전송)**
```javascript
// 라인 ~250 근처
const row = [
  timeCode, fileName, subLayer, inOut, duration,
  title, player, flag, content, extra,
  '소프트 콘텐츠'  // 추가
];
```

**2. `updateVirtualBatch()` (배치 전송)**
```javascript
// 라인 ~350 근처
batchData.forEach(item => {
  const row = [
    // ... 기존 10개 컬럼 ...
    '소프트 콘텐츠'  // 추가
  ];
  rows.push(row);
});
```

### 8.2 테스트 케이스

| 모드 | 입력 | K열 예상값 |
|------|------|------------|
| PU | 칩스택 1,000,000 | '소프트 콘텐츠' |
| ELIM | 순위 5위 | '소프트 콘텐츠' |
| L3 | 프로필 | '소프트 콘텐츠' |
| LEADERBOARD | 리더보드 | '소프트 콘텐츠' |
| 배치 (PU+ELIM) | 2건 전송 | 모두 '소프트 콘텐츠' |

---

## 9. 성공 지표 (Success Metrics)

| 지표 | 목표 |
|------|------|
| K열 전송 성공률 | 100% |
| 기존 기능 회귀 버그 | 0건 |
| 배포 소요 시간 | <10분 |

---

## 10. 미해결 질문 (Open Questions)

- ✅ K열에 다른 값 필요 가능성? → **불필요** (항상 '소프트 콘텐츠')
- ✅ 미리보기에 K열 표시? → **선택사항** (필수 아님)

---

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0 | 2025-01-15 | 초기 작성 |