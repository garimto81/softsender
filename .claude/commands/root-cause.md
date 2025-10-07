---
name: root-cause
description: 코드 오류의 근본 원인을 PLAN까지 역추적하여 자동 수정 (최대 5회 반복)
---

# /root-cause

코드 오류 발생 시 근본 원인을 PLAN 문서까지 자동 역추적하여 완벽하게 해결하는 자율 반복 시스템

## 개요
```
사용자: /root-cause
  ↓
[1초] 프로젝트 감지 + 오류 수집
  ↓
[15분] RCA Controller 자동 실행 (최대 5회 반복)
  ↓
[1초] 최종 보고
  ↓
총 16분 완료 (또는 조기 성공)
```

## 사용법

### 자동 감지 (권장)
```
/root-cause
```
- 마지막 터미널 출력에서 오류 자동 감지
- 오류 메시지, 스택 트레이스 자동 파싱

### 수동 입력
```
/root-cause "TypeError: Cannot read property 'tableId' of undefined"
```
- 오류 메시지 직접 입력
- 과거 오류 재분석 시 유용

## 실행 단계

### 1단계: 초기화 (1초)

**프로젝트 감지**
```
현재 디렉토리 확인
  ↓
docs/ 폴더 존재?
  ├─ Yes → 프로젝트 경로 확정
  └─ No → 에러: "현재 디렉토리에 docs/ 폴더가 없습니다"
```

**오류 정보 수집**
```python
if 인자 있음:
    error_info = parse_manual_error(인자)
else:
    error_info = detect_last_error()  # 터미널 출력 분석
```

**필수 파일 확인**
```
✅ docs/PLAN.md
✅ docs/PRD.md
✅ docs/LLD.md
✅ docs/STATUS.md
✅ .claude/agents/rca/rca-controller.md
```

### 2단계: RCA Controller 실행 (자동 반복)

**Task 도구 호출**
```
Task:
  subagent_type: "general-purpose"
  description: "RCA 자동 수정 실행 (최대 5회 반복)"

  prompt:
    """
    You are the RCA Controller agent.

    Project: {project_path}
    Error Info: {error_info}

    Execute the full RCA cycle:

    1. Read c:\claude\.claude\agents\rca\rca-controller.md
    2. Follow the 5-iteration loop algorithm exactly
    3. For each iteration:
       - Call error-analyzer agent
       - Call fix-planner agent
       - Call document-fixer agent
       - Call validator-wrapper agent
       - Check score and new issues
    4. Stop when:
       - Score = 100 (success)
       - Iteration = 5 (failure)
       - Divergence detected (failure)
       - Circular contradiction (failure)
    5. Use log-manager to record all steps
    6. Return final report JSON

    IMPORTANT:
    - Do NOT ask user for permission during iterations
    - Run fully autonomous until completion or failure
    - Save snapshots before each fix
    - Log everything to c:\claude\.rca\

    Return format:
    {
      "status": "SUCCESS" | "FAILED",
      "iterations": [
        {
          "number": 1,
          "score_before": 60,
          "score_after": 85,
          "changes": ["PLAN.md Line 45", "PRD.md Line 120"],
          "new_issues": 0
        },
        ...
      ],
      "final_score": 100,
      "total_duration_ms": 900000,
      "changed_files": ["PLAN.md", "PRD.md", "LLD.md"],
      "failure_reason": null | "divergence" | "circular_contradiction" | "timeout"
    }
    """
```

**진행 상황 표시 (선택적)**
```
사용자에게 간결한 진행률 표시:
  🔄 Iteration 1/5... (60 → 85점, +25)
  🔄 Iteration 2/5... (85 → 100점, +15) ✅
```

### 3단계: 최종 보고 (1초)

#### 성공 시 출력
```
════════════════════════════════════════════════════════════
✅ 근본 원인 해결 완료!
════════════════════════════════════════════════════════════

📊 수정 이력:
  - 1차 시도: PLAN 1곳 수정 → 새 문제 3개 발견
  - 2차 시도: PLAN 2곳 추가 수정 → 문제 0개 ✅

📝 변경 사항:
  PLAN.md (2곳)
    - Line 45: "자동 선택" → "사용자가 마지막 선택한 테이블 자동 선택"
    - Line 67: 성능 기준 추가 "3초 이내"

  PRD.md (3곳)
    - Line 120: PLAN 근거 추가
    - Line 145: tableId 기본값 로직 추가
    - Line 200: 성능 체크리스트 추가

  LLD.md (4곳)
    - Line 34: tableId 검증 로직 추가
    - Line 89: 캐싱 전략 추가
    - ...

📊 문서 건강도: 100/100 (이전 60점 → +40점)
  - 구조: ✅ 100%
  - 논리: ✅ 100%
  - 의미: ✅ 100%

⏱️  총 소요 시간: 15분 32초
🔄 반복 횟수: 2회 (최대 5회 중)

════════════════════════════════════════════════════════════
다음 단계:
  1. 코드 재실행하여 오류 해결 확인
  2. 필요시 코드 재생성 (LLD 기반)
  3. 개발 계속 진행
════════════════════════════════════════════════════════════
```

#### 실패 시 출력
```
════════════════════════════════════════════════════════════
⚠️  자동 해결 실패 (5회 시도)
════════════════════════════════════════════════════════════

🔍 실패 원인: 순환 모순 (Circular Contradiction)

핵심 문제:
  - PLAN Line 34: "핸드 입력 후 즉시 승률 확인"
  - LLD Line 89: "10,000개 핸드 계산 시 예상 3.2초"
  - 둘 다 핵심 요구사항으로 자동 우선순위 판단 불가

📊 시도 이력:
  - 1차: 점수 60 → 75 (+15)
  - 2차: 점수 75 → 72 (-3) ⚠️
  - 3차: 점수 72 → 71 (-1) ⚠️
  - 4차: 점수 71 → 70 (-1)
  - 5차: 순환 모순 감지 → 중단

📄 상세 보고서:
  c:\claude\.rca\projects\handlogger\failures\2025-01-07_15-30-45\FAILURE_REPORT.md

📝 스냅샷:
  c:\claude\.rca\projects\handlogger\failures\2025-01-07_15-30-45\snapshots\

════════════════════════════════════════════════════════════

💡 해결 방안 (사용자 결정 필요):

  A) 즉시성 유지 (성능 최적화)
     - 알고리즘 최적화 (O(n²) → O(n log n))
     - 웹 워커 사용 (비동기 계산)
     - 예상 소요: 3일
     - 리스크: 복잡도 증가

  B) 현실성 수용 (PLAN 수정)
     - PLAN Line 34 수정: "즉시" → "3초 이내"
     - 사용자 기대치 조정
     - 예상 소요: 1일
     - 리스크: 사용자 경험 저하

  C) 절충안 (UX 개선)
     - 로딩 UI 추가 ("계산 중... 2초")
     - 점진적 표시 (10% → 50% → 100%)
     - 예상 소요: 2일
     - 리스크: 낮음 (권장 ⭐)

════════════════════════════════════════════════════════════
어떤 방향으로 진행하시겠습니까? (A/B/C)
════════════════════════════════════════════════════════════
```

## 안전장치

### 타임아웃
```
최대 실행 시간: 30분
초과 시: 자동 종료 + 실패 보고서 생성
```

### 발산 감지
```
3회 연속 점수 하락 감지
  ↓
자동 중단 + 실패 보고서
```

### 순환 모순 감지
```
같은 PLAN 라인 3회 이상 수정 시도
  ↓
순환 모순으로 판단 → 사용자 개입 요청
```

### 스냅샷 자동 저장
```
각 반복 전에 스냅샷 저장:
  c:\claude\.rca\projects\{project_name}\sessions\{timestamp}\
    ├─ iteration_1_before\
    ├─ iteration_1_after\
    ├─ iteration_2_before\
    └─ ...

롤백 가능: 실패 시 자동 복원 옵션 제공
```

## 로그 저장

### 성공 세션
```
c:\claude\.rca\projects\{project_name}\sessions\{timestamp}\
  ├─ session.json          (전체 세션 로그)
  ├─ iterations.json       (반복 상세)
  ├─ final_report.json     (최종 보고)
  └─ snapshots\
      ├─ iteration_1_before\
      ├─ iteration_1_after\
      └─ ...

보관 기간: 90일 (자동 삭제)
```

### 실패 케이스
```
c:\claude\.rca\projects\{project_name}\failures\{timestamp}\
  ├─ FAILURE_REPORT.md     (사용자용 보고서)
  ├─ session.json          (디버깅용 로그)
  ├─ iterations.json
  ├─ options.json          (선택지 A/B/C)
  └─ snapshots\

보관 기간: 영구 (글로벌 학습 DB)
```

## 에러 처리

### 프로젝트 구조 없음
```
현재 디렉토리에 docs/ 폴더가 없습니다.

/root-cause는 문서 기반 프로젝트에서만 작동합니다.

필수 파일:
  - docs/PLAN.md
  - docs/PRD.md
  - docs/LLD.md
  - docs/STATUS.md

새 프로젝트 시작: 먼저 PLAN 작성 후 /validate-plan 실행
```

### 오류 감지 실패
```
마지막 터미널 출력에서 오류를 찾을 수 없습니다.

수동 입력: /root-cause "에러 메시지"

또는:
  1. 에러 발생 코드 재실행
  2. /root-cause 즉시 실행
```

### RCA Controller 파일 없음
```
RCA 시스템이 설치되지 않았습니다.

필요: c:\claude\.claude\agents\rca\rca-controller.md

설치: subAgent 프로젝트에서 에이전트 파일 복사
```

## 성공 기준
- ✅ 총 실행 시간 ≤ 20분 (80% 케이스)
- ✅ 자동 해결 성공률 ≥ 80%
- ✅ 문서 건강도 최종 ≥ 95점
- ✅ 사용자 개입 0회 (실패 시 제외)

## 언제 사용?

### 코드 오류 발생 시 (주 용도)
```
오류 발생 → /root-cause → 15분 대기 → 해결 완료
```

### 비슷한 오류 반복 시
```
같은 유형 오류 2회 이상
  ↓
근본 원인이 PLAN에 있을 가능성
  ↓
/root-cause로 PLAN 수정
```

### 문서 일관성 의심 시
```
"왜 이 기능을 만들었지?" 질문
  ↓
PLAN↔PRD↔LLD 불일치 가능성
  ↓
/root-cause로 전체 체인 검증
```

### /doctor 점수 낮을 때
```
/doctor 실행 → 점수 < 90
  ↓
/root-cause로 근본 원인 찾기
```

## 기존 시스템 통합

### /doctor와 차이점
```
/doctor:
  - 문서 검증 + 자동 수정 (1회)
  - 구조/논리 에러 위주
  - 15초 완료

/root-cause:
  - 오류 역추적 + 자동 반복 (최대 5회)
  - 근본 원인까지 추적
  - 15분 완료
  - /doctor를 내부적으로 사용
```

### 함께 사용
```
1. PLAN 작성
2. /validate-plan (사전 검증)
3. 코드 작성
4. 오류 발생 → /root-cause (근본 원인 해결)
5. 주기적 /doctor (건강 체크)
```

## 제한사항

### LLM 판단 한계
- 순환 모순은 자동 해결 불가 (사용자 결정 필요)
- 페르소나 현실성은 70% 정확도 (False Positive 가능)
- 도메인 전문 지식 부족 시 오판 가능

### 코드 자동 생성 미지원
- PLAN → PRD → LLD 수정까지만
- 코드 재생성은 사용자가 수동 실행

### 성능 리스크 예측 한계
- 알고리즘 복잡도 분석 제한적
- 실제 성능은 프로파일링 필요

## 완료 기준
이 커맨드 실행 후:
1. ✅ 근본 원인 식별 (PLAN까지 역추적)
2. ✅ 문서 5개 자동 동기화 (PLAN, PRD, LLD, STATUS, CHANGELOG)
3. ✅ 문서 건강도 ≥ 95점
4. ✅ 오류 해결 경로 명확히 기록
5. ✅ 실패 시 선택지 A/B/C 제공