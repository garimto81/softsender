# Soft Content Sender v11.15.4

포커 라이브 방송용 자막 콘텐츠 전송 시스템

## 📌 개요

Google Apps Script 기반 웹 애플리케이션으로, 포커 토너먼트의 실시간 정보를 관리하고 자막 콘텐츠를 생성합니다.

## ✨ 주요 기능

### 1. 3가지 모드 지원
- **PU (Player Update)**: 플레이어 업데이트 (칩스택 표시)
- **ELIM (Elimination)**: 플레이어 탈락 (v11.15.0 복원)
- **L3**: 플레이어 소개

### 2. 실시간 데이터 관리
- Google Sheets 연동
- 자동 시간대 선택 (±20분)
- 테이블/좌석 기반 플레이어 관리

### 3. 사용자 친화적 인터페이스
- 모바일 최적화 UI
- 실시간 미리보기
- 자동 콤마 포맷팅
- BB(Big Blind) 자동 계산

## 🚀 v11.15 ELIM 모드 복원 (2025-01-17)

### 🔧 버그 수정 (v11.15.3 - 2025-01-18)
- ✅ **C열 빈 데이터 처리 개선**
  - C열이 비어있을 경우 시간만으로 매칭
  - 테이블 매칭 실패 시 fallback 로직 추가
  - NO_MATCH_TIME_TABLE 오류 근본 해결

### 🔧 버그 수정 (v11.15.2 - 2025-01-18)
- ✅ **시간/테이블 매칭 로직 개선**
  - 정규식 기반 테이블 번호 매칭 추가
  - "Table 4", "Table4", "#4", "T4" 등 다양한 형식 지원
  - C열 샘플 데이터 로그 추가 (디버깅 개선)

### 🔧 버그 수정 (v11.15.1 - 2025-01-18)
- ✅ **E열 데이터 검증 오류 수정**
  - E열 기본값: "미완료" → "수정 중" 변경
  - Google Sheets 데이터 검증 규칙 준수
  - 허용값: 수정 중, 전송중, 복사완료, 미사용

### ✨ 신규 기능 (v11.15.0 - 2025-01-17)
- ✅ **ELIM 모드 복원** - 플레이어 탈락 전송 기능 재추가
  - 독립 탭 방식: [PU] [ELIM] [L3]
  - 간소화된 출력 형식: "NAME / COUNTRY\nELIMINATED"
  - 배치 전송 지원
  - K열 자동 입력: "소프트 콘텐츠\n'플레이어 탈락'"
  - 파일명 형식: `{HHMM}_SC###_{이름}_ELIM`

## 🚀 v11.14 J열 데이터 손상 수정 완료 (2025-01-17)

### 🔧 버그 수정 (v11.14.1 - 2025-01-17)
- ✅ **Type 탭 캐시 제거** - 신규 플레이어 즉시 반영
  - 30분 TTL 캐시 완전 제거 → 항상 최신 데이터 로드
  - 플레이어 등록 후 즉시 드롭다운에 표시
  - 버전 체크 버그 해결 (A1 셀 lastEditTime → 전체 시트 로드)

### 🔒 신규 기능 (v11.14.0 - Critical Bug Fix)
- ✅ **LockService 적용** - Race Condition 완전 방지
  - 동시 쓰기 충돌로 인한 자막 손실 문제 해결
  - 여러 사용자가 동일 시간에 전송 시 순차 처리 보장
  - Lost Update 방지 (Read-Modify-Write Atomic Operation)
- ✅ **B열 실시간 읽기** - 캐시 Staleness 제거
  - 6시간 TTL 캐시 대신 항상 최신 데이터 사용
  - 행 삽입/삭제 시 즉시 반영
  - 엉뚱한 행에 데이터 쓰기 오류 완전 해결
- ✅ **테이블 정보 매칭** - Time Ambiguity 해결
  - 동일 시간 여러 테이블 정확히 구분
  - B열(시간) + C열(테이블) 동시 매칭
  - 테이블별 독립적 자막 관리 보장

### 🐛 수정된 버그 (v11.14)
- ❌ **Race Condition**: 동시 전송 시 자막 손실 (Critical)
- ❌ **Cache Staleness**: 행 삽입/삭제 시 엉뚱한 행 업데이트 (High)
- ❌ **Time Matching Ambiguity**: 동일 시간 여러 테이블 혼동 (Medium)

### ⚡ 성능 영향 (v11.14)
- **Lock 대기 시간**: 평균 +50ms (동시 사용자 충돌 시만)
- **B열 읽기 시간**: +100ms (캐시 제거로 인한 Sheets API 호출)
- **데이터 정확성**: 100% (엉뚱한 데이터 입력 완전 제거)

## 🚀 v11.13 Cache 최적화 완료 (2025-01-16)

### ✨ 신규 기능 (v11.13 - Smart Cache Strategy)
- ✅ **Stale-While-Revalidate** - 즉시 캐시 표시 + 백그라운드 갱신
  - 페이지 로딩 속도 95% 개선 (2000ms → 100ms)
  - 메모리 캐시로 즉시 UI 표시
  - 백그라운드에서 자동으로 최신 데이터 확인
- ✅ **Version-Based Cache Invalidation** - 정확한 캐시 갱신
  - Google Sheets 메타데이터 기반 (lastRow + lastEditTime)
  - 데이터 변경 시에만 갱신 (불필요한 Sheets API 호출 제거)
  - 30분 TTL + 버전 체크 하이브리드
- ✅ **Smart Refresh Notification** - 데이터 변경 감지
  - 백그라운드 갱신 완료 시 토스트 알림
  - 변경 없으면 조용히 처리
- ✅ **Manual Cache Button Removed** - 워크플로우 간소화
  - 브라우저 새로고침으로 자동 갱신
  - 사용자 인터페이스 단순화

### ✨ 이전 기능 (v10.1 - UX 최적화)
- ✅ **스마트 전송 버튼** - 단일/배치 자동 감지
  - 배치 항목 있으면 자동으로 "📤 배치 전송 (N건)" 표시
  - 전송 버튼 1개로 통합 (혼란 제거)
  - 배치 리스트 자동 표시/숨김
- ✅ **통합 미리보기** - 배치 + 현재 입력 함께 표시
- ✅ **모드 변경 피드백** - 배치 작업 중 모드 변경 시 토스트 알림
- ✅ **간소화된 워크플로우** - [➕ 배치에 추가] 버튼 자동 표시

### ✨ 이전 기능 (v10)
- ✅ **배치 전송 (Batch Builder)** - 여러 플레이어 한 번에 처리
  - 각 플레이어별 다른 모드 선택 가능 (PU/ELIM/L3 조합)
  - 한 번의 서버 호출로 모든 데이터 전송
  - 자동 다음 좌석 이동
  - 모바일 최적화 UI (터치 64px)

### ✨ 이전 기능 (v9 Phase 1)
- ✅ **Room+Table 통합 드롭다운** - 클릭 50% 감소
- ✅ **좌석 선택에 이름 표시** - "#1 - John Doe" 형식
- ✅ **ELIM 모드 개선** - 순위/상금 정보 표시
- ✅ **국가 코드 간소화** - 2자리 코드 직접 사용

### 🛠️ 성능 최적화
- ✅ 메모리 누수 방지 (이벤트 위임)
- ✅ CPU 사용량 30% 감소 (디바운싱)
- ✅ DOM 조회 90% 감소 (캐싱)
- ✅ 렌더링 성능 향상 (DocumentFragment)

### 📊 코드 품질
- ✅ 중복 코드 제거 (findPlayerBySeat 헬퍼)
- ✅ 상수 관리 (CONSTANTS 객체)
- ✅ DRY 원칙 적용 (formatKM 리팩토링)
- ✅ 코드 품질: ⭐⭐⭐⭐⭐ (5/5)

## 📂 프로젝트 구조

```
softsender/
├── src/                       # 개발 소스 (모듈별 분리)
│   ├── template.html          # HTML 템플릿
│   ├── design-tokens.css      # Design System (CSS 변수)
│   ├── styles.css             # 레거시 스타일
│   ├── constants.js           # 상수 정의
│   ├── utils.js               # 유틸리티 함수
│   ├── preview.js             # 미리보기 로직
│   ├── batch.js               # 배치 전송 기능
│   ├── events.js              # 이벤트 핸들러
│   └── init.js                # 초기화
├── page.html                  # 프론트엔드 (빌드된 단일 파일, GAS 배포용)
├── softsender_code.gs         # 서버 로직 (Google Apps Script)
├── version.js                 # 버전 관리 시스템
├── build.js                   # 빌드 스크립트
├── package.json               # npm 설정
├── docs/                      # 문서
│   ├── BUILD.md               # 빌드 시스템 문서
│   ├── PRD.md                 # 제품 요구사항 명세서
│   ├── LLD.md                 # 저수준 설계 문서
│   ├── CHANGELOG.md           # 변경 이력
│   ├── STATUS.md              # 현재 상태
│   ├── FEATURE_ENHANCEMENT_PLAN.md  # 기능 개선 계획
│   └── samples/               # 샘플 데이터
│       ├── Players.csv        # 플레이어 샘플 (레거시)
│       └── Seats.csv          # 좌석 샘플 (현재 사용)
└── archive/                   # 구버전 문서
    ├── CODE_REVIEW_v10.1.md   # v10.1 코드 리뷰
    └── POST_MORTEM_v11.md     # v11 계획 문서
```

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script
- **Storage**: Google Sheets
- **Deployment**: Google Apps Script Web App

## 📦 개발 환경 설정

### 1. Node.js 설치
- [Node.js](https://nodejs.org/) 다운로드 및 설치 (v18 이상 권장)

### 2. 의존성 설치
```bash
npm install
```

### 3. 빌드 시스템 사용

#### 개발 모드 (자동 빌드)
```bash
npm run dev
```
- `src/` 폴더의 파일 변경 감지 → 자동으로 `dist/page.html` 재생성

#### 일반 빌드
```bash
npm run build
```

#### 배포용 최적화 빌드
```bash
npm run build:min
```
- 주석 제거 + 압축 (약 11% 크기 감소)

---

## 🚀 배포 프로세스

### 1. Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com/) 접속
2. 새 프로젝트 생성

### 2. 빌드 및 배포
```bash
# 1. 최적화 빌드 실행
npm run build:min

# 2. dist/page.html 열기
# 3. 전체 내용 복사 (Ctrl+A → Ctrl+C)
# 4. Google Apps Script의 page.html에 붙여넣기
```

### 3. 서버 코드 배포
1. `softsender_code.gs` 내용을 Google Apps Script의 `코드.gs` 파일에 복사

### 4. Sheet ID 설정
`softsender_code.gs`에서 기본 Sheet ID 설정:
```javascript
const DEFAULT_CUE_SHEET_ID = 'YOUR_CUE_SHEET_ID';
const DEFAULT_TYPE_SHEET_ID = 'YOUR_TYPE_SHEET_ID';
```

### 5. SC 카운터 초기화 (⚠️ 필수 - 최초 1회)
**배포 후 반드시 실행해야 합니다!**

Google Apps Script 에디터에서:
1. 함수 선택: `initializeSCCounter`
2. 실행 버튼 클릭
3. 로그 확인:
   ```
   ✅ [SC-INIT] 초기화 완료 - 카운터: 12
   ```

**초기화 효과**:
- F열 전체 스캔하여 기존 SC 최댓값 찾기
- Properties에 `SC_COUNTER` 저장
- 이후 모든 SC 번호 발급은 O(1) 성능

### 6. 웹 앱 배포
1. 배포 → 새 배포
2. 유형 선택: 웹 앱
3. 액세스 권한: 나만 또는 조직 내부

## 📖 사용 방법

### 기본 워크플로우 (단일 전송)
1. **Sheet ID 설정** (선택사항)
2. **테이블 선택** - Room + Table 조합
3. **좌석 선택** - 플레이어 자동 로드
4. **모드 선택** - PU/ELIM/L3/LEADERBOARD
5. **정보 입력** - 모드별 필수 정보
6. **미리보기 확인**
7. **전송** - Google Sheets 업데이트

### 배치 전송 워크플로우 (v10.1 개선)
1. **플레이어 1 입력** → **[➕ 배치에 추가]** 버튼 클릭
   - 버튼은 자동으로 나타남 (배치 리스트와 함께)
   - 자동으로 다음 좌석 이동
2. **플레이어 2 입력** → 모드 변경 가능 → **[➕ 배치에 추가]**
3. **반복** (여러 플레이어)
4. **배치 대기 중 섹션 확인** - 추가된 항목 시각적 확인
5. **미리보기 확인** - 배치 전체 + 현재 입력 함께 표시
6. **[📤 배치 전송 (N건)]** - 자동으로 배치 모드로 전환된 버튼 클릭
   - 한 번의 서버 호출로 모두 전송

### 모드별 가이드

#### PU (플레이어 업데이트)
- 칩스택 입력 (자동 콤마 포맷)
- Big Blind 입력
- BB 자동 계산
- K열 자동 입력: "소프트 콘텐츠\n'플레이어 업데이트'" (2줄)

#### L3 (플레이어 소개)
- 플레이어 자동 선택
- 국가 정보 포함
- K열 자동 입력: "소프트 콘텐츠\n'플레이어 소개'" (2줄)

#### ELIM (탈락 정보)
- 플레이어 자동 선택
- 상금 여부 선택
- 상금 있을 시: 순위 + 금액 입력
- 출력 형식:
  - 상금 없음: `이름 / 국기\nELIMINATED`
  - 상금 있음: `이름 / 국기\nELIMINATED IN 5TH PLACE ($10000)`

#### LEADERBOARD (리더보드)
- Level, SB, BB, ANTE 입력
- 플레이어별 칩스택 입력
- 자동 정렬 (칩스택 내림차순)

## 🎨 UI 특징

- **다크 모드** 디자인
- **터치 친화적** (64px 버튼)
- **반응형** 레이아웃
- **실시간 피드백** (Toast 메시지)

## 📊 성능 지표

| 항목 | 수치 |
|------|------|
| DOM 조회 감소 | 90% |
| 이벤트 리스너 감소 | 95% |
| CPU 사용량 감소 | 30% |
| 메모리 누수 | 제거 완료 |

## 🔒 보안

- XSS 방어 (textContent 사용)
- 입력 검증 (parseIntClean)
- 에러 처리 (try-catch, 실패 핸들러)
- localStorage (Sheet ID만 저장)

## 📝 문서

- [BUILD.md](docs/BUILD.md) - **빌드 시스템 가이드** (필독!)
- [PRD.md](docs/PRD.md) - 제품 요구사항 (v10.7 업데이트)
- [LLD.md](docs/LLD.md) - 기술 설계 문서 (v10.7 업데이트)
- [CHANGELOG.md](docs/CHANGELOG.md) - 버전별 변경 이력
- [STATUS.md](docs/STATUS.md) - 현재 프로젝트 상태
- [FEATURE_ENHANCEMENT_PLAN.md](docs/FEATURE_ENHANCEMENT_PLAN.md) - 기능 개선 계획

## 🤝 기여

버그 리포트 및 기능 제안은 Issues에 등록해주세요.

## 📄 라이선스

MIT License

## 👨‍💻 개발자

- **초기 개발**: garimto81
- **코드 개선**: Claude Code Agent (v9~v10 최적화)
- **빌드 시스템**: Node.js 기반 모듈 번들링 (v10.1)

## 📞 문의

GitHub Issues를 통해 문의해주세요.

---

## 📋 버전 히스토리

### v11.15.4 (2025-01-18)
**🐛 시간 매칭 로직 단순화**

#### 문제
- Virtual 시트에 테이블 정보가 없는데 C열(Seoul 시간)을 테이블 매칭에 사용
- 불필요한 테이블 매칭 로직으로 `NO_MATCH_TIME_TABLE` 오류 발생

#### 해결
- ✅ **B열 단독 매칭**: PC 로컬 시간 → B열 Cyprus 시간 매칭만 사용
- ✅ **C열 제거**: Seoul 시간(C열)은 참조용, 매칭에 사용 안 함
- ✅ **테이블 로직 제거**: Virtual 시트는 테이블 정보 없음 (TYPE 시트에만 존재)

#### 데이터 구조
- B열 = 로컬 시간 (Cyprus, 13:00) → **매칭 기준** (v11.9.0+)
- C열 = Seoul 시간 (19:00) → 참조용
- TYPE 시트 = 테이블 정보 (display용, 매칭 안 함)

---

### v11.12.0 (2025-01-17)
**🌍 PC 로컬 시간 적용 & 키 플레이어 테이블 우선 표시**

#### PC 로컬 시간 사용
- ✅ **시간 드롭다운**: PC 로컬 시간 기준 ±20분 범위 표시 (기존: 서버 시간)
- ✅ **파일명 생성**: PC 로컬 시간 사용 (예: `1830_SC001_Player.jpg`)
- ✅ **클라이언트→서버 전달**: 브라우저에서 현재 시간을 HH:mm 형식으로 서버에 전달
- 🎯 **일관성 향상**: 사용자가 보는 시간과 실제 저장되는 시간이 동일

**변경 내용**:
```javascript
// 클라이언트(PC)에서 현재 시간 생성
const now = new Date();
const clientTime = `${hours}:${minutes}`; // "18:30"

// 서버로 전달
getTimeOptions(cueId, clientTime); // PC 시간 기준 ±20분 필터링
```

#### 키 플레이어 테이블 우선 표시
- ✅ **테이블 드롭다운 ⭐ 표시**: 키 플레이어가 있는 테이블에 별표 표시
- ✅ **최상단 배치**: 키 플레이어 테이블을 드롭다운 최상단에 자동 정렬
- ✅ **빠른 접근**: 중요한 테이블을 즉시 찾을 수 있음

**예시**:
```
드롭다운:
Amazon - Thunder Dome (Table 1) ⭐  ← 키 플레이어 테이블 (최상단)
Amazon - Table 2 ⭐                 ← 키 플레이어 테이블
Amazon - Table 3                    ← 일반 테이블 (하단)
```

---

### v11.11.0 (2025-01-17)
**🎯 E3 셀 우선 적용 & 통합 로딩 시스템**

#### E3 수동 수정 우선 적용
- ✅ **E3 수정 감지**: 카운터 값과 E3 값이 다르면 사용자 수정으로 판단
- ✅ **0 값 지원**: E3을 0으로 변경하면 카운터가 0으로 리셋됨 (기존에는 무시)
- ✅ **즉시 반영**: 다음 전송 시 E3 값이 우선 적용되어 SC 번호가 조정됨
- 🎯 **유연성 향상**: 사용자가 임의의 값으로 SC 번호를 제어 가능

**변경 전 (v11.10.0)**:
```javascript
// 무조건 세 값 중 최댓값 사용 → E3=0이면 무시됨
syncedValue = Math.max(F열_max, Properties, E3)
```

**변경 후 (v11.11.0)**:
```javascript
// E3 수정 감지 시 E3 값 우선
if (E3 ≠ Properties) {
  syncedValue = E3; // 0 포함
} else {
  syncedValue = Math.max(F열_max, Properties);
}
```

**사용 예시**:
```
1. 현재: SC246
2. E3을 "0"으로 수정
3. 다음 전송: SC001 발급 (리셋)
```

#### 통합 로딩 시스템 (LoadingManager)
- ✅ **중복 요청 차단**: 작업 중 다른 버튼 클릭 방지
- ✅ **UI 자동 비활성화**: 모든 버튼/입력 필드 잠금
- ✅ **페이지 이탈 경고**: 작업 중 페이지 나가려 하면 경고창
- ✅ **명확한 피드백**: 진행 상황 및 로딩 메시지 표시
- 🎯 **사용자 실수 방지**: 데이터 전송 중 오조작 완벽 차단

**적용 구간**:
- ID 저장/초기화 (`saveIds`, `clearIds`)
- 단일/배치 전송 (`sendSingle`, `sendBatch`)
- 초기 데이터 로딩 (`init`, `reloadSheets`)

#### UI 공간 최적화
- ✅ **여백 압축**: 입력 필드 44px, 버튼 40-44px (64px에서 축소)
- ✅ **한 화면 배치**: 스크롤 없이 모든 컨트롤 표시 (배치 리스트 제외)
- ✅ **가독성 유지**: 공간은 절약하되 터치 영역 확보

---

### v11.10.0 (2025-01-16)
**📊 E3 셀 SC 카운터 출력 & 수동 수정 지원**
- ✅ **E3 셀 출력**: SC 카운터의 현재 값을 E3 셀에 실시간 출력
- ✅ **수동 수정 인식**: E3 셀 값을 수동으로 변경하면 다음 동기화 시 반영
- ✅ **삼중 검증**: F열 최댓값, Properties 카운터, E3 셀 값 중 가장 큰 값 사용
- 🎯 **투명성 향상**: 사용자가 현재 SC 번호를 확인하고 필요시 수정 가능

**동작 방식**:
```javascript
// 초기화 시: F열 스캔 → Properties + E3 셀 저장
initializeSCCounter() → E3 = 246

// 번호 발급 시: Properties 증가 → E3 업데이트
reserveSCNumber() → SC247 발급 → E3 = 247

// 동기화 시: 3개 값 중 최댓값 선택
syncedValue = Math.max(F열_max, Properties, E3)
```

**사용 예시**:
1. E3 셀 확인: 현재 "246" 표시
2. 수동 수정: E3를 "300"으로 변경
3. 다음 동기화 (2시간 후 또는 initializeSCCounter 실행): SC301부터 발급

### v11.9.0 (2025-01-16)
**🔄 시간값 마이닝 변경 - B열 & PC 로컬 시간 사용**
- ✅ **B열로 변경**: C열 → B열로 시간값 읽기 위치 변경
- ✅ **PC 로컬 시간 기준**: 서버 시간 대신 사용자 PC의 현재 시각 사용
- ✅ **캐시 로직 업데이트**: `getCachedColumnC()` 함수가 B열 데이터 캐싱하도록 수정
- 🎯 **정확성 향상**: 사용자의 로컬 시간대를 기준으로 시간 매칭

**변경 사항**:
```javascript
// BEFORE: 서버 시간 + C열
const nowKST = new Date(); // 서버 시각
const colC = sh.getRange(2, 3, last - 1, 1).getDisplayValues();

// AFTER: PC 로컬 시간 + B열
const now = new Date(); // PC 로컬 시각 (프론트엔드)
const colB = sh.getRange(2, 2, last - 1, 1).getDisplayValues();
```

**영향**:
- 자동 모드: PC의 현재 시각이 B열과 매칭됨
- 수동 모드: 기존과 동일하게 드롭다운 선택값 사용
- 캐시: B열 데이터가 6시간 캐싱됨 (성능 유지)

### v11.8.3 (2025-01-16)
**🐛 점진적 성능 저하 해결 (Progressive Slowdown Fix)**
- ✅ **init() 중복 방지**: `isInitialized` 플래그로 중복 초기화 차단
- ✅ **setInterval 누적 방지**: `keepAliveInterval` 전역 변수로 관리, 재시작 시 기존 interval 정리
- ✅ **리소스 정리**: `beforeunload` 이벤트로 페이지 종료 시 interval 정리
- 🎯 **증상 해결**: 시간이 지날수록 입력 응답 속도가 느려지는 문제 해결

**원인 분석**:
```javascript
// BEFORE: Hot Reload 시 setInterval 누적
function startSessionKeepAlive() {
  setInterval(() => { ... }, 4 * 60 * 1000); // ❌ 중복 생성
}

// AFTER: 기존 interval 정리 후 재시작
let keepAliveInterval = null;
function startSessionKeepAlive() {
  if (keepAliveInterval) clearInterval(keepAliveInterval); // ✅ 정리
  keepAliveInterval = setInterval(() => { ... }, 4 * 60 * 1000);
}
```

**성능 영향**:
- 개발 환경: Hot Reload 시 event listener/interval 누적 방지
- 프로덕션: 장시간 사용 시 메모리 누수 방지
- 사용자 경험: 일관된 응답 속도 유지

**테스트 방법**:
1. 페이지 로드 후 10회 연속 입력 → 속도 일정 확인
2. 개발 모드에서 코드 수정 (Hot Reload) → 속도 저하 없음 확인
3. 콘솔에서 `🧹 [Keep-Alive] 기존 interval 정리` 로그 확인

### v11.8.2 (2025-01-16)
**⚡ C열 하이브리드 캐싱 (CacheService + PropertiesService)**
- ✅ **Primary Cache**: CacheService (6시간 TTL, 100KB 지원)
- ✅ **Backup Cache**: PropertiesService (영구 저장, 일일 캐시)
- ✅ **성능**: 762ms → 5ms (99.3% 절감, 2회차부터)
- 🎯 **안정성**: 11.5KB C열 데이터 캐싱 성공 (이전 9KB 제한 초과 해결)

### v11.8.1 (2025-01-16)
**🔧 K열 PRD 준수 (소프트 콘텐츠 정보)**
- ✅ **PU 모드**: "소프트 콘텐츠\n'플레이어 업데이트'" (2줄 형식)
- ✅ **L3 모드**: "소프트 콘텐츠\n'플레이어 소개'" (2줄 형식)
- 🐛 **수정**: "미완료" 오류 입력 → PRD 요구사항 준수

### v11.8.0 (2025-01-16)
**⚡ 성능 최적화 4종 세트 (응답 속도 97% 단축)**
- ✅ **Priority 1: Session Keep-Alive** - Cold Start 제거 (19.6s → 0s)
- ✅ **Priority 2: C~J열 행 단위 읽기** - 1행만 읽기 (1,475ms → 50ms)
- ✅ **Priority 3: SC Number 동기화 연장** - 30분 → 2시간
- ✅ **Priority 4: Type Rows TTL 연장** - 5분 → 30분

**성능 비교**:
| 최적화 | Before | After | 절감 |
|--------|--------|-------|------|
| Cold Start 제거 | 19.6s | 0s | 100% |
| C~J열 읽기 | 1,475ms | 50ms | 97% |
| SC 동기화 빈도 | 30분마다 | 2시간마다 | 75% |
| Type Rows 캐시 | 5분 | 30분 | 83% |
| **총 전송 시간** | **22.8s** | **0.8s** | **97%** |

### v11.7.0 (2025-01-16)
**⚡ Ultra 성능 최적화 - 전송 속도 65% 단축**
- ✅ **Phase 1: Batch API** - E~K열 한번에 쓰기 (9,500ms → 500ms, 95% 절감)
- ✅ **Phase 2: Sheet 객체 재사용** - reserveSCNumber()에 ss/sh 파라미터 전달
- ✅ **Phase 3: C~J열 배치 읽기** - J열 사전 로딩 (9,695ms → 0ms)
- ✅ **Phase 4: C열 일일 캐싱** - PropertiesService 활용 (561ms → 5ms, 2회차부터)
- ✅ **K열 Validation 호환** - "미완료" 값만 사용하여 에러 방지

**성능 비교**:
| 항목 | v11.6.1 | v11.7.0 | 절감 |
|------|---------|---------|------|
| 개별 setValue x5 | 9,500ms | 500ms (배치) | 95% |
| J열 별도 읽기 | 9,695ms | 0ms (사전 로딩) | 100% |
| C열 읽기 (2회차) | 561ms | 5ms (캐시) | 99% |
| **전송 총 시간** | **~33초** | **~11.5초** | **65%** |

**Phase별 상세**:
- **Phase 1**: `sh.getRange(row, 5, 1, 7).setValues([...])` - 7개 셀 한번에 쓰기
- **Phase 2**: `reserveSCNumber(cueId, row, ss, sh)` - 중복 openById() 제거
- **Phase 3**: `sh.getRange(2, 3, last-1, 8).getValues()` - C~J열 동시 로딩
- **Phase 4**: `getCachedColumnC()` - YYYYMMDD 기반 일일 캐시

**배포 후 확인 사항**:
1. 로그에서 "⏱️ [7] Batch 쓰기 (E~K 7개 셀): ~500ms" 확인
2. 2회차 요청부터 "✅ [C열 캐시] HIT" 로그 확인
3. K열 validation 에러 발생 여부 확인

### v11.6.1 (2025-01-16)
**🔧 파일명 시간값 불일치 수정**
- ✅ **C열 매칭 시간값 재사용**: 파일명에도 동일한 시간 사용
- ✅ **일관성 보장**: autoNow 모드에서도 C열 시간과 파일명 시간 일치
- ✅ **중복 계산 제거**: 프론트엔드 `payload.hhmm` 대신 서버 C열 매칭값 사용
- 🎯 **정확성**: C열 "14:33" → 파일명 "1433_SC246_..."

**수정 전 (v11.6.0)**:
```
autoNow=true 시:
- C열 매칭: "14:33" (서버 현재 시각)
- 파일명: "1415_SC246_..." (프론트엔드 계산값) ❌ 불일치
```

**수정 후 (v11.6.1)**:
```
autoNow=true 시:
- C열 매칭: "14:33" (서버 현재 시각)
- 파일명: "1433_SC246_..." (C열 매칭값 재사용) ✅ 일치
```

### v11.6.0 (2025-01-16)
**⚡ SC 번호 발급 성능 10배 향상 (하이브리드 카운터)**
- ✅ **Properties 카운터 도입**: O(1) 성능, F열 전체 읽기 제거
- ✅ **주기적 동기화**: 30분마다 마지막 20행 스캔하여 F열과 동기화
- ✅ **수동 수정 감지**: F열 수정 시 자동으로 카운터 조정
- ✅ **초기화 함수**: `initializeSCCounter()` - 최초 1회 실행 필수
- ✅ **성능 개선**: Lock 시간 500ms → 50ms (90% 감소)
- 🎯 **확장성**: 데이터 증가에 무관, 동시 처리량 10배 증가

**성능 비교**:
| 항목 | v11.5.0 | v11.6.0 | 개선율 |
|------|---------|---------|--------|
| F열 읽기 | 500행 (매번) | 20행 (30분마다) | 96% 감소 |
| Lock 시간 | ~500ms | ~50ms | 90% 감소 |
| 동시 처리량 | ~2 req/sec | ~20 req/sec | 10배 증가 |

### v11.5.0 (2025-01-16)
**🔒 SC 번호 2단계 예약 패턴** - DEPRECATED (v11.6.0에서 개선됨)
- ⚠️ **성능 이슈**: F열 전체 읽기로 인한 Lock 시간 과다 (500ms)
- ✅ **v11.6.0에서 해결**: Properties 카운터로 10배 성능 향상

### v11.4.0 (2025-01-16)
**🔒 SC 번호 중복 발급 문제 해결 (Lock 기반) - DEPRECATED**
- ⚠️ **문제 발견**: Lock 해제 후 F열 작성으로 인한 Race Condition
- ❌ **해결 실패**: Lock과 F열 작성 사이 시간 격차로 중복 발생 가능
- ✅ **v11.5.0에서 완전 해결**: 2단계 예약 패턴으로 대체됨

### v11.3.7 (2025-01-16)
**🚀 성능 최적화: SC 번호 캐싱** (Deprecated - v11.4.0에서 제거됨)
- ⚠️ **문제 발견**: 캐시로 인한 중복 번호 발급 및 번호 건너뛰기 문제
- ❌ **제거됨**: getCachedSCNumber() 함수 및 CacheService 의존성

### v11.3.3 (2025-01-15)
**🔧 B/C 열 보호 완료**
- ✅ B/C 열을 배치 쓰기에서 제외 (개별 열 쓰기로 전환)
- ✅ E/F/G/J/K만 개별 업데이트 (B/C는 읽기 전용)

**버전**: v11.9.0 (2025-01-16)
**상태**: 프로덕션 배포 완료 ✅
**중요**: 배포 후 `initializeSCCounter()` 실행 필수!

### 📅 버전 히스토리
- **v11.2.1** (2025-01-15):
  - **🚀 서버 캐싱 활성화** - Type Rows 로딩 80% 개선 (4초 → 0.5초)
  - **🔧 코드 정리** - LS_KEYS를 constants.js로 이동 (중복 제거)
  - **✅ Optimistic UI 비활성화** - 안정성 우선 (기존 동기 방식으로 복귀)
  - **Batch API 최적화 유지** - Sheets API 호출 60% 감소 (5회 → 2회)
  - 캐시 적중 시 즉시 로딩 (5분 TTL)
- **v11.2** (2025-01-15):
  - **⚡ 성능 대폭 개선** - Batch API 최적화
  - **Batch API 최적화** - Sheets API 호출 60% 감소 (5회 → 2회)
  - **Cache 레이어 추가** - Type Rows 5분 캐싱 준비
  - 포커 라이브 방송 환경에 최적화
- **v11.3.3** (2025-10-16):
  - **🐛 B/C열 완전 배제** - E/F/G/J/K만 개별 업데이트 (B/C 읽지도 쓰지도 않음)
  - **빌드 오류 수정** - page.html 546줄 `(LS_KEYS)` 텍스트 제거
  - **API 호출 최적화** - 읽기 1회(J열만) + 쓰기 5회(E/F/G/J/K)
- **v11.3** (2025-10-16):
  - **용어 변경** - "스택 업데이트" → "플레이어 업데이트", "프로필 자막" → "플레이어 소개"
  - **K열 로직 개선** - 모드별 자동 분기 (PU: "플레이어 업데이트", L3: "플레이어 소개")
  - **문서 업데이트** - PRD, README, 프론트엔드 UI 전체 반영
- **v11.1** (2025-01-15):
  - **K열 자동 전송** - Virtual 시트 전송 시 K열에 '소프트 콘텐츠' 자동 추가
  - 모든 모드(PU/ELIM/L3/LEADERBOARD)에서 동일하게 적용
- **v11.0** (2025-01-15):
  - **파일명 형식 변경** - `{HHMM}_SC###_{내용}` 형식으로 시간 접두사 추가
  - **SC 번호 자동 부여** - F열 파일명 스캔하여 마지막 번호 +1 자동 생성
  - **Properties Service 도입** - 사용자별 Sheet ID 서버에 영구 저장
  - **로딩 오버레이 추가** - 로딩 중 클릭 방지 & 단계별 상세 로그
  - **L3 모드 수정** - 플레이어 소개에 국가 정보 포함
  - 모든 기기에서 설정 자동 동기화
- **v10.8** (2025-10-14):
  - **KeyPlayer K열 고정** - 헤더 검색 대신 컬럼 인덱스 10번 직접 참조
  - **배치 리스트 키 플레이어 표시** - 배치 대기 목록에도 ⭐ 아이콘 추가
  - **디버깅 로그 강화** - 서버/클라이언트 양쪽 KeyPlayer 데이터 추적
  - 헤더 이름 오타/대소문자 문제 해결
- **v10.7** (2025-10-12):
  - **Seats.csv 구조 적용** - 11개 컬럼으로 확장 (PokerRoom, TableName, TableId, TableNo, SeatId, SeatNo, PlayerId, PlayerName, Nationality, ChipCount, KeyPlayer)
  - **KeyPlayer 기능 추가** - 주요 플레이어에게 ⭐ 아이콘 표시
  - TYPE_SHEET_ID 변경 (19e7eDjoZRFZooghZJF3XmOZzZcgmqsp9mFAfjvJWhj4)
  - 데이터베이스 구조 현대화
- **v10.1** (2025-10-05):
  - UX 대폭 개선 - 스마트 전송 버튼, 통합 미리보기
  - **빌드 시스템 도입** - Node.js 기반 모듈 분리 및 번들링
  - 개발/배포 분리로 코드 유지보수성 향상
- **v10** (2025-10-05): 배치 전송 기능 추가 (여러 플레이어 한 번에 처리)
- **v9** (2025-10-05): Room+Table 통합, ELIM 개선, 성능 최적화
- **v8** (2025-10-04): 초기 릴리스
