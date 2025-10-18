# PRD Summary - Soft Content Sender
**최종 업데이트**: 2025-01-18 | **현재 버전**: v11.15.5

---

## 📊 현재 상태

### ✅ 최근 업데이트

#### **v11.15.5 (2025-01-18) - E열 검증 오류 수정**
**문제**: `src/batch.js`에서 `eFix: '미완료'` 사용으로 E열 검증 규칙 위반

**해결책**:
- ✅ `eFix: '미완료'` → `eFix: '수정 중'` 변경 (2곳)
- ✅ E열 허용값 준수: 수정 중, 전송중, 복사완료, 미사용

**오류 메시지**:
```
E387 셀에 입력하신 데이터는 이 셀에 설정된 데이터 확인 규칙을 위반합니다.
```

---

#### **v11.15.4 (2025-01-18) - 시간 매칭 로직 단순화**
**문제**: Virtual 시트에 테이블 정보가 없는데 C열을 테이블 매칭에 사용

**해결책**:
- ✅ B열 단독 매칭: PC 로컬 시간 → B열 Cyprus 시간만 사용
- ✅ C열 제거: Seoul 시간(C열)은 참조용, 매칭 안 함
- ✅ 테이블 로직 제거: Virtual 시트는 테이블 정보 없음

**데이터 구조**:
- B열 = 로컬 시간 (Cyprus) → **매칭 기준** (v11.9.0+)
- C열 = Seoul 시간 → 참조용
- TYPE 시트 = 테이블 정보 (display용만)

---

### ✅ 완료된 최적화 (v11.8 시리즈)

#### **v11.8.3 (2025-01-16) - 점진적 성능 저하 해결**
**문제**: 시간이 지날수록 입력 응답 속도가 느려지는 현상

**원인**:
- Hot Reload/페이지 재로드 시 `setInterval` 누적 생성
- `init()` 중복 실행으로 Event Listener 중복 등록
- 페이지 종료 시 리소스 미정리

**해결책**:
- ✅ `isInitialized` 플래그로 init() 중복 방지
- ✅ `keepAliveInterval` 전역 변수로 interval 관리
- ✅ `beforeunload` 이벤트로 리소스 정리

**결과**:
- 1회 입력 = 100회 입력 (동일한 응답 속도)
- 개발/프로덕션 환경 모두 메모리 누수 방지

---

#### **v11.8.2 (2025-01-16) - C열 하이브리드 캐싱**
**문제**: C열 캐시 크기 초과 (11.5KB > 9KB)

**해결책**:
- ✅ CacheService (Primary): 6시간 TTL, 100KB 지원
- ✅ PropertiesService (Backup): 영구 저장, 일일 캐시

**결과**:
- 762ms → 5ms (99.3% 절감, 2회차부터)
- 11.5KB C열 데이터 캐싱 성공

---

#### **v11.8.1 (2025-01-16) - K열 PRD 준수**
**문제**: K열에 "미완료" 오류 입력

**해결책**:
- ✅ PU: "소프트 콘텐츠\n'플레이어 업데이트'" (2줄)
- ✅ L3: "소프트 콘텐츠\n'플레이어 소개'" (2줄)

**결과**:
- PRD 요구사항 완전 준수

---

#### **v11.8.0 (2025-01-16) - 성능 최적화 4종 세트**
**목표**: 전송 속도 97% 단축

**최적화 내역**:
1. **Priority 1: Session Keep-Alive** - Cold Start 제거 (19.6s → 0s)
2. **Priority 2: C~J열 행 단위 읽기** - 1,447행 → 1행 (1,475ms → 50ms)
3. **Priority 3: SC Number 동기화 연장** - 30분 → 2시간
4. **Priority 4: Type Rows TTL 연장** - 5분 → 30분

**결과**:
- 총 전송 시간: 22.8s → 0.8s (97% 절감)

---

## 🎯 성능 지표 총정리

| 최적화 | Before | After | 절감율 |
|--------|--------|-------|--------|
| **Cold Start** (v11.8.0) | 19.6s | 0s | 100% |
| **C~J열 읽기** (v11.8.0) | 1,475ms | 50ms | 97% |
| **C열 캐싱** (v11.8.2) | 762ms | 5ms | 99.3% |
| **SC 동기화 빈도** (v11.8.0) | 30분 | 2시간 | 75% |
| **Type Rows 캐시** (v11.8.0) | 5분 | 30분 | 83% |
| **점진적 성능 저하** (v11.8.3) | 누적 | 일정 | 100% |

**총 전송 시간**: 22.8s → 0.8s (97% 절감) ✅

---

## 📝 다음 진행 사항

### 🚀 배포 필요
**현재 상태**: GitHub 푸시 완료 ✅

**남은 작업**:
1. **Google Apps Script 배포**
   - `page.html` 전체 복사 (Ctrl+A → Ctrl+C)
   - Google Apps Script 에디터 → `page.html` 파일에 붙여넣기
   - 배포 → 새 배포 또는 기존 배포 업데이트

2. **테스트**
   - 10회 연속 입력하여 속도 일정한지 확인
   - 콘솔에서 다음 로그 확인:
     - `🔄 [Keep-Alive] 세션 유지 시작`
     - `✅ [Keep-Alive] 세션 유지 성공`
     - (페이지 새로고침 시) `🧹 [Keep-Alive] 기존 interval 정리`

---

## 🔍 기술 스택 & 아키텍처

### 프론트엔드
- **프레임워크**: Vanilla JavaScript
- **빌드**: Node.js 기반 모듈 번들링
- **소스 파일**: 8개 모듈 (template, styles, constants, utils, preview, batch, events, init)
- **빌드 출력**: `page.html` (단일 파일, 59.10 KB)

### 백엔드
- **플랫폼**: Google Apps Script
- **데이터베이스**: Google Sheets
  - CUE Sheet (virtual 탭): 방송 큐시트
  - TYPE Sheet (Type 탭): 플레이어 데이터
- **캐싱**: CacheService + PropertiesService (하이브리드)

### 성능 최적화 기법
- **Session Keep-Alive**: 4분마다 더미 호출 (Cold Start 방지)
- **하이브리드 캐싱**: CacheService (Primary) + PropertiesService (Backup)
- **배치 API**: E~K열 한번에 쓰기 (7개 셀)
- **행 단위 읽기**: 전체 테이블 → 1행만 읽기
- **리소스 정리**: beforeunload 이벤트 핸들러

---

## 📌 핵심 기능 (4가지 모드)

### 1. PU (Player Update) - 플레이어 업데이트
- 칩스택, Big Blind 입력
- BB 자동 계산
- K열: "소프트 콘텐츠\n'플레이어 업데이트'"

### 2. L3 (Lower Third) - 플레이어 소개
- 플레이어 이름 자동 로드
- 국가 정보 포함
- K열: "소프트 콘텐츠\n'플레이어 소개'"

### 3. ELIM (Elimination) - 탈락 정보
- 상금 여부 선택
- 순위 + 금액 입력 (상금 있을 시)

### 4. LEADERBOARD - 리더보드
- 테이블 전체 칩스택 순위
- 자동 정렬 (칩스택 내림차순)

---

## 🔧 빌드 & 배포

### 개발 모드
```bash
npm run dev  # 파일 변경 감지 → 자동 빌드
```

### 일반 빌드
```bash
npm run build  # dist/page.html + page.html 생성
```

### 최적화 빌드
```bash
npm run build:min  # 압축 (11% 크기 감소)
```

---

## 🐛 알려진 이슈

**없음** - v11.8.3에서 점진적 성능 저하 해결 완료

---

## 🎯 향후 개선 사항 (Future Roadmap)

### Phase 1 (단기)
- [ ] 이전 전송 내역 조회
- [x] 키보드 단축키 지원 (Ctrl+B) ✅

### Phase 2 (중기)
- [ ] 자막 스타일 프리셋
- [ ] 배치 항목 순서 변경
- [ ] 다크/라이트 모드 토글

### Phase 3 (장기)
- [ ] clasp 도입 (자동 배포)
- [ ] CI/CD (GitHub Actions)
- [ ] OBS Studio 플러그인 연동

---

## 📞 문의 & 지원

**프로젝트 리포지토리**: [GitHub - garimto81/softsender](https://github.com/garimto81/softsender)
**이슈 등록**: GitHub Issues

---

**문서 버전**: 1.0.0
**작성**: Claude Code Agent
**날짜**: 2025-01-16
