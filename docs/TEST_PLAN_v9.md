# 테스트 계획서 - v9 Phase 1&2
# Room+Table 통합 + 이름 선택 기능

## 📋 문서 정보
- **작성일**: 2025-10-04
- **버전**: v9 (Phase 1&2)
- **테스트 범위**: Room+Table 통합, 이름 선택 기능

---

## 🎯 테스트 목표

### 구현된 기능
1. ✅ **Room + Table 통합 드롭다운**
   - 기존 2단계 선택 → 1단계로 통합
   - "PokerStars - Final Table" 형식

2. ✅ **이름으로 플레이어 선택**
   - Seat 드롭다운: "#1 - John Doe" 형식
   - Player 드롭다운: "John Doe (#1)" 형식
   - 두 드롭다운 동기화

---

## 🔍 변경사항 요약

### 서버 코드 (softsender_code.gs)
- **변경 없음** ✅

### 클라이언트 코드 (softsender.gs)

#### State 객체
```javascript
// 추가됨
tableList: []  // Room+Table 통합 목록
```

#### 인덱싱 함수
```javascript
indexTypeRows(rows)
  - byRoom, byRoomTable 생성 (기존)
  - tableList 생성 (신규)
    - 형식: { key: "PokerStars|7", label: "PokerStars - Final Table", room, tno }
    - 정렬: Room → Table No.
```

#### UI 채우기 함수
```javascript
fillRoomTables()  // 신규
  - selRoomTable 드롭다운 채우기
  - tableList 사용

fillSeats()  // 수정
  - selRoomTable에서 key 가져오기
  - selSeat: "#1 - John Doe" 형식
  - selPlayer: "John Doe (#1)" 형식 (알파벳순)

applyPickFromSeat()  // 수정
  - selRoomTable에서 key 사용
  - selPlayer도 동기화
```

#### 이벤트 리스너
```javascript
selRoomTable.change → fillSeats()
selSeat.change → applyPickFromSeat()
selPlayer.change → selSeat 동기화 → applyPickFromSeat()
```

#### HTML 구조
```html
<!-- 제거됨 -->
<select id="selRoom">
<select id="selTableNo">

<!-- 추가됨 -->
<select id="selRoomTable">
<select id="selPlayer">

<!-- 수정됨 -->
<select id="selSeat"> (라벨: "좌석 선택")
```

---

## 🧪 테스트 케이스

### TC-001: 초기 로딩
**목적**: 페이지 로딩 시 데이터 정상 로드 확인

**전제조건**
- TYPE Sheet에 데이터 있음
- 최소 2개 이상의 Room/Table 조합 존재

**단계**
1. 웹 앱 접속
2. 로딩 완료 대기

**기대 결과**
- ✅ `selRoomTable` 드롭다운에 옵션 표시
- ✅ 첫 번째 테이블 자동 선택됨
- ✅ `selSeat`, `selPlayer` 드롭다운 채워짐
- ✅ 첫 번째 좌석 자동 선택됨
- ✅ 플레이어 이름, 국가 자동 입력됨
- ✅ 상태: "준비됨"

**실패 시 확인사항**
- console.log로 `state.tableList` 확인
- `indexTypeRows()` 실행 여부 확인
- `fillRoomTables()` 실행 여부 확인

---

### TC-002: Room+Table 통합 드롭다운 선택
**목적**: 테이블 선택 시 좌석 목록 갱신 확인

**전제조건**
- TC-001 통과

**단계**
1. `selRoomTable` 드롭다운 클릭
2. 다른 테이블 선택 (예: "888poker - Table 3")

**기대 결과**
- ✅ `selSeat` 드롭다운이 해당 테이블 좌석으로 갱신됨
- ✅ `selPlayer` 드롭다운도 해당 테이블 플레이어로 갱신됨
- ✅ 첫 번째 좌석 자동 선택됨
- ✅ 플레이어 정보 자동 입력됨
- ✅ 파일명 갱신됨 (테이블 번호 변경 반영)

**검증 포인트**
- `state.byRoomTable["888poker|3"]` 데이터 확인
- `selSeat` 옵션 개수 = 해당 테이블 좌석 수
- `selPlayer` 옵션 알파벳순 정렬 확인

---

### TC-003: Seat 드롭다운 형식 확인
**목적**: "#1 - John Doe" 형식 표시 확인

**전제조건**
- TC-001 통과

**단계**
1. `selSeat` 드롭다운 열기
2. 옵션 텍스트 확인

**기대 결과**
- ✅ 첫 번째 옵션: "좌석 선택" (value="")
- ✅ 이후 옵션: "#1 - John Doe", "#2 - Kim Minsu" 형식
- ✅ 좌석 번호 오름차순 정렬
- ✅ value = "#1", "#2" (좌석 번호만)

**검증 데이터**
```
TYPE Sheet:
Seat No. | Players
#1       | John Doe
#2       | Kim Minsu
#3       | Lee Hyun

Expected:
<option value="">좌석 선택</option>
<option value="#1">#1 - John Doe</option>
<option value="#2">#2 - Kim Minsu</option>
<option value="#3">#3 - Lee Hyun</option>
```

---

### TC-004: Player 드롭다운 형식 및 정렬
**목적**: "John Doe (#1)" 형식 및 알파벳순 정렬 확인

**전제조건**
- TC-001 통과

**단계**
1. `selPlayer` 드롭다운 열기
2. 옵션 텍스트 및 순서 확인

**기대 결과**
- ✅ 첫 번째 옵션: "이름 선택" (value="")
- ✅ 이후 옵션: "John Doe (#1)", "Kim Minsu (#2)" 형식
- ✅ 알파벳순 정렬 (J → K → L)
- ✅ value = "John Doe", "Kim Minsu" (플레이어 이름)
- ✅ `dataset.seat` = "#1", "#2" (좌석 번호)

**검증 데이터**
```
TYPE Sheet (이름 무작위 순서):
Seat No. | Players
#3       | Alice Wong
#1       | John Doe
#2       | Kim Minsu

Expected (알파벳순):
<option value="">이름 선택</option>
<option value="Alice Wong" data-seat="#3">Alice Wong (#3)</option>
<option value="John Doe" data-seat="#1">John Doe (#1)</option>
<option value="Kim Minsu" data-seat="#2">Kim Minsu (#2)</option>
```

---

### TC-005: Seat 선택 → Player 동기화
**목적**: Seat 선택 시 Player 드롭다운 자동 동기화

**전제조건**
- TC-001 통과

**단계**
1. `selSeat` 드롭다운에서 "#2 - Kim Minsu" 선택
2. `selPlayer` 드롭다운 확인

**기대 결과**
- ✅ `selPlayer` 값 = "Kim Minsu"로 자동 변경됨
- ✅ 플레이어 이름 입력란: "Kim Minsu"
- ✅ 국가 입력란: "South Korea" (또는 TYPE Sheet의 nat 값)
- ✅ 미리보기 갱신됨
- ✅ 파일명 갱신됨

---

### TC-006: Player 선택 → Seat 동기화
**목적**: Player 선택 시 Seat 드롭다운 자동 동기화

**전제조건**
- TC-001 통과

**단계**
1. `selPlayer` 드롭다운에서 "Lee Hyun (#3)" 선택
2. `selSeat` 드롭다운 확인

**기대 결과**
- ✅ `selSeat` 값 = "#3"으로 자동 변경됨
- ✅ 플레이어 이름 입력란: "Lee Hyun"
- ✅ 국가 입력란: "South Korea"
- ✅ 미리보기 갱신됨
- ✅ 파일명 갱신됨

**코드 검증**
```javascript
// selPlayer 이벤트 리스너
const sel = document.getElementById('selPlayer');
const seat = sel.options[sel.selectedIndex]?.dataset.seat;  // "#3"
document.getElementById('selSeat').value = seat;  // Seat 동기화
applyPickFromSeat();  // 플레이어 정보 로드
```

---

### TC-007: LEADERBOARD 모드 테스트
**목적**: LEADERBOARD 모드에서 정상 동작 확인

**전제조건**
- TC-001 통과

**단계**
1. "리더보드(LEADERBOARD)" 탭 클릭
2. `lbList` 영역 확인

**기대 결과**
- ✅ 플레이어별 입력란 생성됨 (좌석 순서)
- ✅ 플레이어 이름 자동 입력됨
- ✅ Table Label: "Table7" (또는 해당 테이블 번호)
- ✅ 파일명: "HHmm_Table7_LEADERBOARD" 형식

**검증 데이터**
```javascript
state.byRoomTable["PokerStars|7"] = [
  { seat: "#1", player: "John Doe", ... },
  { seat: "#2", player: "Kim Minsu", ... },
  { seat: "#3", player: "Lee Hyun", ... }
];

Expected lbList:
<input class="lbName" value="John Doe" />
<input class="lbName" value="Kim Minsu" />
<input class="lbName" value="Lee Hyun" />
```

---

### TC-008: PU 모드 전송 테스트
**목적**: PU 모드에서 전송 기능 정상 동작 확인

**전제조건**
- TC-001 통과

**단계**
1. "스택 업데이트(PU)" 탭 클릭
2. `selRoomTable`: "PokerStars - Final Table" 선택
3. `selPlayer`: "John Doe (#1)" 선택
4. 칩스택: "1,234,000" 입력
5. Big Blind: "20000" 입력
6. 미리보기 확인
7. 전송 버튼 클릭

**기대 결과**
- ✅ BB 자동 계산: "62BB"
- ✅ 미리보기:
  ```
  UNITED STATES OF AMERICA
  JOHN DOE
  CURRENT STACK - 1,234,000 (62BB)
  ```
- ✅ 파일명: "HHmm_John_Doe_PU" 형식
- ✅ 전송 성공 토스트 메시지
- ✅ Sheet의 J셀에 내용 append됨

---

### TC-009: 여러 테이블 전환 테스트
**목적**: 테이블 전환 시 상태 유지 확인

**전제조건**
- TC-001 통과
- 최소 3개 테이블 존재

**단계**
1. `selRoomTable`: "PokerStars - Table 7" 선택
2. `selPlayer`: "John Doe" 선택
3. 칩스택 입력: "1,000,000"
4. `selRoomTable`: "888poker - Table 3" 선택
5. `selPlayer`: 다른 플레이어 선택
6. 다시 `selRoomTable`: "PokerStars - Table 7" 선택

**기대 결과**
- ✅ 4단계: 좌석/플레이어 목록 정확히 갱신됨
- ✅ 4단계: 칩스택 입력값 유지됨 (또는 초기화됨 - 현재 동작 확인 필요)
- ✅ 6단계: Table 7 플레이어 목록 정확히 복원됨
- ✅ 모든 전환에서 오류 없음

---

### TC-010: 빈 데이터 처리
**목적**: 데이터 없는 경우 처리 확인

**테스트 시나리오**

#### 10-1: TYPE Sheet 비어있음
**단계**
1. TYPE Sheet 모든 데이터 삭제 (헤더만 남김)
2. 웹 앱 리로드

**기대 결과**
- ✅ `selRoomTable`: "-" 옵션만 표시
- ✅ `selSeat`, `selPlayer`: "선택" 옵션만 표시
- ✅ 에러 토스트 없음

#### 10-2: 특정 테이블만 데이터 없음
**단계**
1. TYPE Sheet에서 Table 7 데이터만 삭제
2. `selRoomTable`: Table 7 선택 (옵션 목록에 없어야 함)

**기대 결과**
- ✅ Table 7 옵션이 `selRoomTable`에 나타나지 않음
- ✅ 다른 테이블은 정상 동작

---

### TC-011: 특수 문자 처리
**목적**: 이름에 특수 문자 포함된 경우 처리

**테스트 데이터**
```
TYPE Sheet:
Seat No. | Players
#1       | O'Brien
#2       | Lee-Hyun
#3       | José García
```

**단계**
1. `selPlayer` 드롭다운 열기
2. 각 플레이어 선택 테스트

**기대 결과**
- ✅ 모든 이름 정확히 표시됨
- ✅ 선택 시 이름 입력란에 정확히 입력됨
- ✅ 파일명 생성 시 안전한 문자로 변환됨 (서버 `buildFileName()`)
  - O'Brien → O_Brien
  - Lee-Hyun → Lee-Hyun (하이픈 허용)
  - José García → Jos_Garc_a

---

### TC-012: 국가 코드 변환
**목적**: CountryMap 탭 사용 확인

**전제조건**
- CountryMap 탭 존재
- 매핑 데이터: `{ "US": "United States of America", "KR": "South Korea" }`

**단계**
1. TYPE Sheet에서 nat = "US"인 플레이어 선택
2. 국가 입력란 확인

**기대 결과**
- ✅ 국가 입력란: "United States of America"
- ✅ 미리보기에서도 풀네임 사용됨

**엣지 케이스**
- nat = "ZZ" (매핑 없음) → "ZZ" 그대로 표시
- nat = "South Korea" (이미 풀네임) → "South Korea" 그대로

---

## 🐛 알려진 이슈 및 해결 방법

### 이슈 1: selPlayer 드롭다운에 중복 플레이어
**원인**: 같은 테이블에 동일 이름 플레이어 2명
**해결**: TYPE Sheet 데이터 수정 (좌석 번호로 구분)

### 이슈 2: 테이블 선택 시 플레이어 정보 초기화됨
**원인**: `fillSeats()` → `applyPickFromSeat()` 흐름
**해결**: 의도된 동작 (새 테이블 선택 시 첫 좌석 자동 선택)

### 이슈 3: 알파벳순 정렬 시 대소문자 구분
**원인**: `localeCompare()` 기본 동작
**해결**: 현재 코드는 대소문자 구분함 (의도된 동작)

---

## ✅ 체크리스트

### 배포 전 필수 확인
- [ ] TC-001~TC-012 모두 통과
- [ ] 브라우저 호환성 (Chrome, Safari, Firefox)
- [ ] 모바일 반응형 (iOS Safari, Android Chrome)
- [ ] console.log에 에러 없음
- [ ] 네트워크 탭에서 API 호출 성공 확인
- [ ] TYPE Sheet 권한 확인 (읽기 가능)
- [ ] CUE Sheet 권한 확인 (읽기/쓰기 가능)

### 성능 확인
- [ ] 초기 로딩: 3초 이내
- [ ] 테이블 전환: 1초 이내
- [ ] 플레이어 선택: 즉시 (지연 없음)
- [ ] 미리보기 갱신: 500ms 이내

### 사용자 경험 확인
- [ ] 드롭다운 텍스트 가독성 (모바일)
- [ ] 터치 영역 충분 (최소 44px)
- [ ] 에러 메시지 명확함
- [ ] 성공 메시지 명확함

---

## 🔄 롤백 계획

### 문제 발생 시
1. Apps Script 편집기 → "버전" 메뉴
2. v8 버전으로 복원
3. 배포 → "배포 관리" → v8 버전으로 재배포

### 백업 파일
- `softsender_v8_backup.gs` (로컬 저장)
- `softsender_code_v8_backup.gs` (로컬 저장)

---

## 📝 테스트 결과 기록 템플릿

```
테스트 일시: 2025-10-04 14:00
테스트 환경: Chrome 120 / Windows 11
수행자: [이름]

[TC-001] 초기 로딩
  결과: ✅ 통과 / ❌ 실패
  비고:

[TC-002] Room+Table 통합 드롭다운 선택
  결과: ✅ 통과 / ❌ 실패
  비고:

[TC-003] Seat 드롭다운 형식 확인
  결과: ✅ 통과 / ❌ 실패
  비고:

... (이하 TC-012까지)

종합 결과: ✅ 배포 가능 / ❌ 수정 필요
수정 필요 항목:
```

---

## 🚀 배포 후 모니터링

### 첫 1일
- [ ] 사용자 피드백 수집
- [ ] 에러 로그 확인
- [ ] 성능 메트릭 확인

### 첫 1주
- [ ] 사용 패턴 분석
- [ ] 개선 사항 도출
- [ ] v9 Phase 3 (다중 선택) 기획 재검토

---

## 📞 문의
테스트 중 문제 발생 시 개발팀에 즉시 보고
- 스크린샷 첨부
- console.log 에러 메시지 복사
- 재현 방법 상세 기록
