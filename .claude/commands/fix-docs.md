# /fix-docs

자동 수정 가능한 결함을 **1회 실행으로** 모두 수정

## 전제 조건
- `/validate-docs`가 먼저 실행되어 `scripts/issues_merged.json` 존재
- 또는 이 커맨드가 자동으로 `/validate-docs` 먼저 실행

## 실행 단계

### 1단계: 검증 (issues_merged.json 없으면)
```
/validate-docs 실행 → issues_merged.json 생성
```

### 2단계: 자동 수정 (10초)
```
Task: doc-auto-fixer 에이전트
입력:
  - scripts/issues_merged.json
  - 현재 프로젝트 경로
출력:
  - 수정된 문서 파일들 (각 파일당 1회 Edit)
  - scripts/fix_report.json
```

**핵심 동작:**
```python
# ❌ 이렇게 하면 반복 감지됨
for issue in issues:
    Edit(issue.file, ...)  # 15회

# ✅ 올바른 방법
by_file = group_by(issues, 'file')
for file, file_issues in by_file:
    old = Read(file)
    new = apply_all_fixes(old, file_issues)
    Edit(file, old, new)  # 파일당 1회만
```

### 3단계: 재검증 (1초)
```bash
python scripts/validate_structure.py .
```
- Layer 1만 빠르게 재검증
- 여전히 에러 → 자동 수정 실패
- 에러 없음 → 성공

### 4단계: 보고 (1초)
```
✅ 자동 수정 완료

📝 수정된 파일:
  PLAN.md (3곳)
    Line 1: v2.3.0 → v2.3.1
    Line 45: 들여쓰기 3칸 → 4칸
    Line 67: 파일 경로 docs/plan.md → docs/PLAN.md

  PRD.md (5곳)
    Line 1: v2.3.0 → v2.3.1
    Line 89: 들여쓰기 수정
    ...

  STATUS.md (2곳)
    Line 1: v2.3.0 → v2.3.1
    Line 20: 버전 동기화

🔍 재검증: ✅ 통과 (구조적 에러 0개)

⚠️ 수동 검토 필요 (3개):
  PLAN.md:45 - 페르소나 나이-경력 모순 (AI가 임의로 수정할 수 없음)
  PRD.md:120 - Phase 의존성 순환 (구조 재설계 필요)
  LLD.md:67 - 기술 스택 과도함 (판단 필요)

📊 최종 상태:
  - 자동 수정: 10개 ✅
  - 수동 필요: 3개 ⚠️
  - 문서 건강도: 85/100 (이전 75 → +10)
```

## 충돌 처리

```
⚠️ 자동 수정 충돌 발견

파일: PLAN.md
Line 45에 2개 수정 시도:
  1. version_sync: v2.3.0 → v2.3.1
  2. list_indent: 들여쓰기 3 → 4

해결 방법:
  Option 1: scripts/issues_merged.json 확인 후 수동 수정
  Option 2: 하나씩 수정 (version_sync만 먼저 → /fix-docs 재실행)

Action: 자동 수정 중단, 사용자 판단 대기
```

## 성공 기준
- ✅ Edit 호출 ≤ 5회
- ✅ 총 실행 시간 ≤ 15초
- ✅ 재검증 통과
- ✅ 반복 없음

## 에러 처리

### 파일 권한 에러
```
❌ 자동 수정 실패

파일: PRD.md
에러: Permission denied (읽기 전용)

해결:
  1. 파일 권한 확인
  2. 읽기 전용 해제
  3. /fix-docs 재실행
```

### 재검증 실패
```
⚠️ 자동 수정 후에도 에러 남음

수정 완료: 10개
여전히 에러: 2개

남은 에러:
  PLAN.md:67 - 코드 펜스 짝 안 맞음
  PRD.md:120 - 헤딩 순서 잘못됨

원인: 복잡한 구조 변경은 자동 수정 불가

해결:
  1. scripts/fix_report.json 확인
  2. 수동 수정
  3. /validate-docs로 재확인
```

## 언제 사용?
- `/validate-docs`로 "자동 수정 가능: X개" 확인 후
- 간단한 결함(버전 불일치, 들여쓰기 등) 빠르게 수정
- 대량 문서 작성 후 일괄 정리

## 제한사항
자동 수정 **불가능**:
- ❌ 의미적 문제 (페르소나 모순, 시나리오 비논리)
- ❌ 구조 변경 (섹션 순서, 헤딩 추가)
- ❌ 내용 추가 (PLAN 근거, 체크리스트 구체화)
- ❌ 판단 필요 (기술 스택 선택, 의존성 재설계)

자동 수정 **가능**:
- ✅ 버전 동기화
- ✅ 들여쓰기 조정
- ✅ 단순 파일 경로 수정
- ✅ CHANGELOG 날짜 정렬

## 다음 단계
- 자동 수정 완료 → `/validate-docs`로 재확인
- 수동 필요 항목 → `scripts/fix_report.json` 확인 후 수정
- 완벽 → CHANGELOG에 "문서 정리" 기록