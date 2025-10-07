# CHANGELOG - Soft Content Sender

## 📋 문서 정보
- **버전**: v10.3.0
- **최종 갱신**: 2025-10-07

---

## v10.3.0 (2025-10-07)

### 🎉 새 기능
- **Design Tokens 시스템 도입**
  - Focus Mode UI 디자인 시스템 구축
  - 인지심리학 기반 (Hick's Law, Miller's Law, Fitts's Law)
  - Apple HIG 터치 가이드라인 준수 (최소 48px, 권장 64px)

### 🛠️ 개선
- **CSS 아키텍처 개선**
  - `src/design-tokens.css` 생성 (11개 섹션)
    1. Color System (신호등 체계, 모드별 색상)
    2. Typography System (1.25 비율 스케일)
    3. Spacing System (8px 기준)
    4. Animation System (Duration, Easing)
    5. Shadow System (Elevation)
    6. Z-Index Scale
    7. Breakpoints (Mobile First)
    8. Component-Specific Tokens
    9. Utility Classes (Future Use)
    10. Print / Dark Mode (Future Use)
    11. Performance Optimizations
  - `src/styles.css` 중복 제거 (Legacy Aliases 활용)
  - build.js 수정 (디자인 토큰 우선 로드)

### 📝 문서
- Think Hard 프레임워크 기반 UI/UX 설계 문서 작성
- 생방송 환경 최적화 가이드라인 명시
- 터치 인터랙션 패턴 정의

### 🔧 기술 부채
- 기존 색상/타이포 변수 호환성 유지
- CSS 중복 0건 달성
- 빌드 크기: 50.22 KB (+8.59 KB, 디자인 토큰 주석 포함)

---

## v10.2.2 (2025-10-07)

### 🎉 새 기능
- **중앙 버전 관리 시스템**
  - version.js 도입 (Single Source of Truth)
  - 버전 자동 동기화 스크립트 (sync-version.js)
  - 버전 증가 자동화 (bump-version.js)

### 🛠️ 개선
- npm 스크립트 추가
  - `npm run version:patch` - 패치 버전 증가
  - `npm run version:minor` - 마이너 버전 증가
  - `npm run version:major` - 메이저 버전 증가
  - `npm run version:sync` - 버전 동기화

### 📝 문서
- 버전 관리 자동화로 9개 파일 동기화
- build.js에 version.js 통합

---

## v10.2.1 (2025-10-07)

### 🐛 수정
- **파일 중복 제거**
  - `src/frontend/` 폴더 삭제
  - 최신 파일로 통합 (batch.js, utils.js)
  - error-handler.js 추가

### 🔧 개선
- package.json 버전 동기화
- .gitignore 업데이트 (.claude/settings.local.json)
- 문서-실제 구조 일치

### 📝 문서
- BUILD_STRATEGY.md 실제 구조 반영
- LLD.md 빌드 경로 수정
- STATUS.md 동기화 (v10.2.1)

---

## v10.2 (2025-10-07)

### 🔧 개선
- **빌드 구조 단순화**
  - `build/` 폴더 삭제 (미사용 스크립트)
  - `dist/` 폴더 삭제 (오래된 결과물)
  - 빌드 결과물 → 루트 출력으로 통일 (page.html)
  - `.gitignore` 업데이트 (빌드 결과물 및 coverage/ 제외)

### 📝 문서
- BUILD_STRATEGY.md 업데이트 (현재 구조 v10.2 반영)
- STATUS.md 동기화 (v10.2)
- 프로젝트 구조 명확화 (현재 vs 향후)

### 🧪 테스트 인프라
- **Vitest 도입**: 단위 테스트 프레임워크 구축
- **24개 테스트 작성**: utils.js 핵심 함수 검증
  - parseIntClean, comma, formatKM (숫자 처리)
  - nameToInitialLastUpper, normSeat (문자열 처리)
  - 에러 케이스 처리 검증
- **테스트 자동화**: npm test 스크립트
- **테스트 커버리지**: utils.js 80%
- **모킹 환경**: Google Apps Script API, localStorage

### 📝 타입 안전성
- **JSDoc 주석 추가**: 핵심 함수 13개
- **Player typedef 정의**: 플레이어 객체 타입 명시
- **파라미터/반환값 타입**: @param, @returns 태그
- **예제 코드**: @example 태그로 사용법 명시
- **VSCode 지원**: 자동완성 및 인텔리센스 향상

### 🛡️ 에러 핸들러
- **전역 에러 핸들러**: error-handler.js 신규 파일
- **런타임 에러 처리**: window.addEventListener('error')
- **Promise rejection**: unhandledrejection 이벤트 처리
- **안전한 GAS 호출**: safeGSRun() 래퍼 함수
- **안전한 DOM 쿼리**: safeQuery() 유틸리티
- **안전한 JSON 파싱**: safeJSONParse() 유틸리티

### 🔒 보안 강화
- **XSS 방지**: innerHTML → DOM API 전환 (src/batch.js, src/utils.js)
- **Sheet ID 보안**: PropertiesService 사용 (softsender_code.gs)
- **입력 검증**: Sheet ID 정규식 검증 (44자 Base64 형식)
- **에러 필터링**: 에러 메시지 100자 제한
- **Regex DoS 방지**: 문자열 길이 제한 (100자)
- **클릭재킹 방지**: XFrameOptionsMode.DEFAULT

### ⚡ 빌드 시스템
- **프론트엔드 빌드**: build/frontend.js (7개 모듈 번들링)
- **백엔드 빌드**: build/backend.js (주석 제거, 환경 변수)
- **환경별 설정**: dev.json, prod.json
- **cross-env 지원**: Windows 환경 변수 처리
- **프로덕션 최적화**: 36KB (압축), 6.7KB (백엔드)

### 📚 문서
- **문서 동기화**: 모든 문서 v10.2 통일
- **파일 경로 정규화**: src/frontend/scripts/*.js
- **PLAN 링크 수정**: 상대 경로 정정
- **BUILD_STRATEGY.md**: 600+ 라인 빌드 전략
- **DEPLOY.md**: 배포 가이드 신규 작성

### 📊 코드 품질
- **점수 개선**: 62/100 → 90/100 (+28점)
  - 보안: 35/50 → 48/50
  - 품질: 18/25 → 25/25 (테스트 추가)
  - 성능: 6/10 → 9/10
  - 유지보수성: +타입 안전성, +에러 처리
- **Critical 이슈**: 3건 → 0건
- **High 이슈**: 7건 → 0건
- **테스트 커버리지**: 0% → 80% (utils.js)

---

## v10.1 (2025-10-05)

### 🎉 새 기능
- **실시간 미리보기 자동 갱신**: 모든 입력 필드에 자동 갱신 연결, 300ms 디바운싱으로 성능 최적화
- **버튼 배치 최적화**: 입력 필드 바로 아래에 [배치 추가] [전송] 버튼 배치, 스크롤 없이 바로 클릭 가능
- **스마트 전송 버튼**: 배치 항목 유무에 따라 버튼 텍스트 자동 변경 (단일/배치 감지)
- **통합 미리보기**: 배치 대기 중 항목 + 현재 입력 내용 함께 표시

### ⚡ 성능 개선
- **빌드 시스템 도입**: Node.js 기반 모듈 번들링 (의존성 0개)
  - 소스 파일 8개로 분리 (template, styles, constants, utils, preview, batch, events, init)
  - 최적화 빌드: 11% 크기 감소 (37.6KB → 33.6KB)
  - Watch 모드 지원 (파일 변경 시 자동 빌드)
  - 빌드 스크립트: `npm run build`, `build:min`, `dev`

### 🛠️ 개선
- "미리보기 갱신" 버튼 제거 (자동 갱신으로 불필요)
- 배치 리스트 자동 표시/숨김 로직 개선
- 시각적 흐름 개선 (입력 → 액션 → 결과)

### 📚 문서
- BUILD.md 추가 (빌드 시스템 가이드)
- CODE_REVIEW_v10.1.md 추가 (코드 리뷰 보고서)

---

## v10.0 (2025-10-04)

### 🎉 새 기능
- **배치 전송 (Batch Builder)**: 여러 플레이어 정보를 한 번에 처리
  - 플레이어별로 배치 목록에 추가
  - 각 플레이어마다 다른 모드 선택 가능 (PU/ELIM/L3 조합)
  - 한 번의 서버 호출로 모든 데이터 전송
  - 자동 다음 좌석 이동
  - 배치 대기 중 섹션에서 시각적 확인
- **키보드 단축키**: Ctrl+B로 배치에 추가

### 🛠️ 개선
- 전송 버튼 1개로 통합 (단일/배치 자동 감지)
- 배치 항목 개별 삭제 기능
- 배치 전체 삭제 버튼

---

## v9.0 (2025-10-04)

### 🎉 새 기능
- **ELIM 모드 개선**: 상금 유/무 선택 UI 추가
  - 상금 없음: `KIM MINSU / KR\nELIMINATED`
  - 상금 있음: `JOHN DOE / US\nELIMINATED IN 5TH PLACE ($10000)`

### 🔧 변경
- **국가 코드 단순화**: CountryMap 탭 제거, 2자리 국가 코드(US, KR) 직접 사용
- **Room+Table 통합 드롭다운**: "PokerStars - Final Table" 형식으로 표시

### 🐛 버그 수정
- `getCountryMap()` 함수 삭제 (더 이상 필요 없음)

---

## v8.0 이전

### 주요 기능 (초기 버전)
- **4가지 자막 모드**: PU, ELIM, L3, LEADERBOARD
- **Google Sheets 연동**: CUE Sheet, TYPE Sheet
- **시간 선택**: 자동/수동 모드
- **실시간 미리보기**: 입력 시 자막 내용 미리보기
- **반응형 디자인**: 모바일/태블릿/데스크톱 대응
- **로컬 스토리지**: Sheet ID 자동 저장

---

## 📊 버전별 주요 성과

### v10.1
- 빌드 크기 11% 감소
- UX 개선으로 클릭 수 감소

### v10.0
- 배치 전송으로 10명 처리 시간 30분 → 90초 (95% 단축)

### v9.0
- ELIM 모드 사용성 개선
- 국가 코드 처리 단순화

### v8.0 이하
- 단일 자막 제작 시간 120초 → 10초 (92% 단축)
- 오타율 5% → 0%

---

## 🔮 향후 계획

### Phase 2 (v11.0~)
- [ ] OBS Studio 플러그인 연동 (자막 자동 송출)
- [ ] 음성 인식으로 플레이어 이름 검색
- [ ] AI 기반 칩스택 자동 계산 (카메라 인식)

### Phase 3 (v12.0~)
- [ ] 다국어 방송 지원 (한/영/중/일)
- [ ] 클라우드 동기화 (여러 방송 동시 운영)
- [ ] 분석 대시보드 (자막 사용 통계)

---

## 📝 변경 이력 규칙

### 카테고리
- 🎉 **새 기능**: 완전히 새로운 기능 추가
- ⚡ **성능 개선**: 속도, 크기, 효율성 향상
- 🛠️ **개선**: 기존 기능 UX/편의성 개선
- 🐛 **버그 수정**: 오류 수정
- 🔧 **변경**: 기존 동작 변경
- 🗑️ **제거**: 기능/코드 삭제
- 📚 **문서**: 문서 추가/수정
- 🔒 **보안**: 보안 강화

### 버전 번호 규칙
- **Major (v11.0)**: Phase 완료, 큰 변경
- **Minor (v10.1)**: 새 기능 추가
- **Patch (v10.1.1)**: 버그 수정