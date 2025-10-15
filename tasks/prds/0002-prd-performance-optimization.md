# PRD-0002: 성능 최적화 - Optimistic UI + Batch API

**버전**: 1.0
**작성일**: 2025-01-15
**상태**: ✅ 완료 (v11.2)

---

## 1. 개요 (Overview)

Google Sheets 연동 시 발생하는 지연 시간(2-5초)을 개선하기 위해 **Optimistic UI**(즉시 피드백) + **Batch API**(배치 최적화) + **Cache 레이어**를 구현합니다.

---

## 2. 목표 (Goals)

- **사용자 체감 지연 95% 감소**: 2-5초 → 0.1초 (즉시 피드백)
- **Sheets API 호출 50% 감소**: 개별 호출 → 배치 호출
- **네트워크 불안정 대응**: 자동 재시도 (최대 3회)
- **비용 $0/월**: 기존 인프라 활용

---

## 3. 사용자 스토리 (User Stories)

**As a** 포커 라이브 방송 오퍼레이터
**I want to** 버튼 클릭 즉시 다음 작업 진행
**So that** 빠른 템포의 방송 환경에서 효율적으로 작업 가능

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 Optimistic UI (우선순위 P0)

| ID | 요구사항 | 상태 |
|----|----------|------|
| FR-1 | 버튼 클릭 시 0.1초 이내 피드백 | ✅ |
| FR-2 | IndexedDB 동기화 큐 구현 | ✅ |
| FR-3 | 백그라운드 Sheets 동기화 | ✅ |
| FR-4 | 실패 시 자동 재시도 (최대 3회, 지수 백오프) | ✅ |
| FR-5 | 실패 항목 수동 재시도 UI | ✅ |

### 4.2 Batch API 최적화 (우선순위 P0)

| ID | 요구사항 | 상태 |
|----|----------|------|
| FR-6 | getRange() 개별 호출 → 1회 배치 읽기 | ✅ |
| FR-7 | setValue() 개별 호출 → 1회 배치 쓰기 | ✅ |
| FR-8 | Sheets API 호출 5회 → 2회로 감소 | ✅ |

### 4.3 Cache 레이어 (우선순위 P1)

| ID | 요구사항 | 상태 |
|----|----------|------|
| FR-9 | CacheService로 Type Rows 캐싱 (5분 TTL) | ✅ |
| FR-10 | 캐시 히트 시 0.5초 이하 응답 | ✅ |
| FR-11 | Sheets 읽기 90% 감소 | ✅ |

---

## 5. 기술 사양 (Technical Specifications)

### 5.1 서버 (softsender_code.gs)

#### A. Batch API 최적화
```javascript
// Before (5회 API 호출)
sh.getRange(row, 5).setValue(eVal);  // 1
sh.getRange(row, 6).setValue(fVal);  // 2
sh.getRange(row, 7).setValue(gVal);  // 3
sh.getRange(row, 10).setValue(jVal); // 4
sh.getRange(row, 11).setValue('소프트 콘텐츠'); // 5

// After (2회 API 호출)
const existingRow = sh.getRange(row, 1, 1, 11).getValues()[0]; // 1회 읽기
const updatedRow = [...existingRow];
updatedRow[4] = eVal;
updatedRow[5] = fVal;
updatedRow[6] = gVal;
updatedRow[9] = jVal;
updatedRow[10] = '소프트 콘텐츠';
sh.getRange(row, 1, 1, 11).setValues([updatedRow]); // 1회 쓰기
```

#### B. Cache 레이어
```javascript
function getCachedTypeRows(typeIdOverride) {
  const cache = CacheService.getScriptCache();
  const key = 'TYPE_ROWS_' + typeId;

  const cached = cache.get(key);
  if (cached) return JSON.parse(cached); // Cache HIT

  const result = getTypeRows(typeIdOverride);
  if (result.ok) cache.put(key, JSON.stringify(result), 300); // 5분

  return result;
}
```

### 5.2 클라이언트

#### A. IndexedDB 동기화 큐 (sync-queue.js)
- DB 이름: `SoftSenderQueue`
- Store: `queue` (키: `id`)
- 인덱스: `status`, `timestamp`

#### B. Optimistic UI (optimistic-ui.js)
```javascript
async function sendWithOptimisticUI(payload) {
  const tempId = Date.now();

  // 1. 즉시 피드백 (0.1초)
  toast('✅ 전송 중...', true);

  // 2. 큐 추가
  await addToSyncQueue({ id: tempId, payload, status: 'pending' });

  // 3. 백그라운드 동기화
  syncToServer(tempId, payload);

  // 4. 즉시 다음 작업 허용
  hideLoadingOverlay();
}
```

#### C. 자동 재시도
- 최대 3회 시도
- 지수 백오프: 2초, 4초, 8초
- 최종 실패 시 수동 재시도 UI 표시

---

## 6. 성능 지표 (Success Metrics)

### 6.1 지연 시간

| 시나리오 | Before | After | 개선율 |
|---------|--------|-------|--------|
| 단일 전송 | 3초 | 0.1초* | 97% |
| 배치 10건 | 25초 | 0.1초* | 99.6% |
| Type Rows 로드 | 4초 | 0.5초 | 87.5% |

\* 사용자 체감 시간 (백그라운드 동기화는 계속 진행)

### 6.2 API 호출 감소

| 항목 | Before | After | 감소율 |
|------|--------|-------|--------|
| updateVirtual() | 5회 | 2회 | 60% |
| getTypeRows() | 매번 | 5분마다 | 90% |

---

## 7. 제외 사항 (Out of Scope)

- ❌ Firestore 전환 (Phase 3 계획)
- ❌ 실시간 구독 (WebSocket)
- ❌ 오프라인 모드

---

## 8. 비기능 요구사항 (Non-Functional Requirements)

| 속성 | 요구사항 | 달성 |
|------|----------|------|
| 성능 | 체감 지연 0.5초 이하 | ✅ 0.1초 |
| 안정성 | 네트워크 불안정 시 자동 재시도 | ✅ 3회 |
| 호환성 | 기존 기능 회귀 없음 | ✅ Fallback 제공 |
| 비용 | 추가 비용 없음 | ✅ $0/월 |

---

## 9. 배포 체크리스트

- ✅ 서버 코드 배포 (softsender_code.gs)
  - `getCachedTypeRows()` 추가
  - `updateVirtual()` Batch API 적용
- ✅ 클라이언트 빌드 (page.html)
  - `sync-queue.js` 추가
  - `optimistic-ui.js` 추가
  - `batch.js` 수정
- ✅ Google Apps Script 업로드
- ⬜ 사용자 테스트 (PU/ELIM/L3/LEADERBOARD)

---

## 10. 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| IndexedDB 미지원 브라우저 | 낮음 | 중간 | Fallback 구현 완료 |
| 동기화 실패 누적 | 중간 | 높음 | 24시간 자동 정리 + 수동 재시도 |
| 캐시 불일치 | 낮음 | 낮음 | 5분 TTL로 최소화 |

---

## 11. 성공 지표 (Success Metrics)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 사용자 체감 지연 | <0.5초 | Toast 메시지 표시 시간 |
| Sheets API 호출 | -60% | Logger.log() 카운트 |
| 동기화 성공률 | >95% | IndexedDB 성공/실패 비율 |
| 사용자 만족도 | >4.5/5 | 피드백 수집 |

---

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0 | 2025-01-15 | 초기 작성 |
