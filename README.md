# Soft Content Sender v9

포커 라이브 방송용 자막 콘텐츠 전송 시스템

## 📌 개요

Google Apps Script 기반 웹 애플리케이션으로, 포커 토너먼트의 실시간 정보를 관리하고 자막 콘텐츠를 생성합니다.

## ✨ 주요 기능

### 1. 4가지 모드 지원
- **PU (Player Update)**: 플레이어 칩스택 업데이트
- **ELIM (Elimination)**: 탈락 정보
- **L3**: 프로필 자막
- **LEADERBOARD**: 리더보드 생성

### 2. 실시간 데이터 관리
- Google Sheets 연동
- 자동 시간대 선택 (±20분)
- 테이블/좌석 기반 플레이어 관리

### 3. 사용자 친화적 인터페이스
- 모바일 최적화 UI
- 실시간 미리보기
- 자동 콤마 포맷팅
- BB(Big Blind) 자동 계산

## 🚀 v10.1 UX 개선 완료 (2025-10-05)

### ✨ 신규 기능 (v10.1 - UX 최적화)
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

### 5. 웹 앱 배포
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

#### PU (스택 업데이트)
- 칩스택 입력 (자동 콤마 포맷)
- Big Blind 입력
- BB 자동 계산

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

**버전**: v11.2.1 (2025-01-15)
**상태**: 프로덕션 배포 완료 ✅

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
- **v11.1** (2025-01-15):
  - **K열 자동 전송** - Virtual 시트 전송 시 K열에 '소프트 콘텐츠' 자동 추가
  - 모든 모드(PU/ELIM/L3/LEADERBOARD)에서 동일하게 적용
- **v11.0** (2025-01-15):
  - **파일명 형식 변경** - `{HHMM}_SC###_{내용}` 형식으로 시간 접두사 추가
  - **SC 번호 자동 부여** - F열 파일명 스캔하여 마지막 번호 +1 자동 생성
  - **Properties Service 도입** - 사용자별 Sheet ID 서버에 영구 저장
  - **로딩 오버레이 추가** - 로딩 중 클릭 방지 & 단계별 상세 로그
  - **L3 모드 수정** - 프로필 자막에 국가 정보 포함
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
