# 본과학학원 프리미엄 내신관리 시스템

## 앱 재생성을 위한 완전 가이드

이 문서는 동일한 시스템을 다른 Replit에서 재생성하기 위한 완전한 프롬프트, 아키텍처, 기능 명세서입니다.

---

## 1. Replit Agent 프롬프트 (복사해서 사용)

```
통합과학 시험 평가 시스템을 만들어주세요.

### 앱 이름
"본과학학원 프리미엄 내신관리 시스템"

### 핵심 기능

1. **학생 로그인**
   - 학생ID + 이름으로 로그인
   - 세션 스토리지로 로그인 상태 유지

2. **학교/시험 선택**
   - 학교 목록 표시 (대일고, 구로고, 한가람고 등)
   - 학교별 시험 선택 (2024년 2학기 중간 등)

3. **시험 응시**
   - 객관식 답안 입력 (①②③④⑤ 선택)
   - 복수 정답 지원 (체크박스)
   - OMR 카드 촬영 인식 기능

4. **성적 확인**
   - 전체 점수 표시
   - 단원별 성취도 분석 (에너지, 화학, 생태계 등)
   - 차트로 시각화
   - 학생/교사 피드백 제공

5. **관리자 기능**
   - 비밀번호: 3721
   - 학생 목록 조회
   - 전체 성적 통계
   - Google Sheets 연동 설정

### 점수 계산 방식 (중요!)
- 점수 = (맞은 문제 수 / 답한 문제 수) × 100
- 예: 5문제 중 4문제 맞음 = 80점 (20문제 기준 아님)
- 응시하지 않은 단원은 성취도에 표시하지 않음

### 기술 스택
- Frontend: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- Backend: Express.js + TypeScript
- Database: PostgreSQL (Drizzle ORM)
- 차트: Recharts
- Google Sheets API 연동 (Replit 커넥터 사용)

### Google Sheets 연동
- 학생 정보 읽기
- 시험 결과 저장 (시트2: 요약, 시트3: 단원별 상세)
- 정답 데이터 불러오기

### OMR 인식
- Python OpenCV 사용
- 4개 모서리 마커 인식
- 30문제 5지선다 지원

### 페이지 구성
1. / - 로그인 페이지
2. /schools - 학교 선택
3. /exams/:schoolId - 시험 선택
4. /test/:examId - 시험 응시
5. /result - 결과 확인
6. /reports - 성적 이력
7. /admin-login - 관리자 로그인
8. /admin - 관리자 대시보드
```

---

## 2. 데이터베이스 스키마

### schools 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| name | text | 학교명 (unique) |

### exams 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| schoolId | integer | FK → schools.id |
| schoolName | text | 학교명 |
| year | integer | 연도 |
| semester | text | "2학기 중간", "2학기 기말" 등 |
| subject | text | "통합과학" |

### questions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| examId | integer | FK → exams.id |
| questionNumber | integer | 문제 번호 |
| type | varchar(20) | "객관식" 또는 "주관식" |
| category | text | "에너지", "화학", "생태계" 등 |
| unit | text | "전자기 유도", "산화-환원" 등 |
| answer | text | 정답 (JSON 배열 또는 단일 문자) |
| isMultipleAnswer | boolean | 복수 정답 여부 |

### students 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| studentId | varchar(50) | 학생 ID (unique) |
| studentName | text | 학생 이름 |
| grade | text | 학년 |
| phone | varchar(20) | 전화번호 |

### submissions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| studentId | varchar(50) | 학생 ID |
| studentName | text | 학생 이름 |
| examId | integer | FK → exams.id |
| submittedAt | timestamp | 제출 시간 |
| answers | text | 학생 답안 (JSON) |
| score | integer | 점수 |
| totalQuestions | integer | 전체 문제 수 |
| answeredQuestions | integer | 답한 문제 수 |
| correctAnswers | integer | 맞은 문제 수 |
| achievementRate | integer | 성취율 |
| unitResults | text | 단원별 결과 (JSON) |

### settings 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| key | varchar(100) | 설정 키 (unique) |
| value | text | 설정 값 |
| updatedAt | timestamp | 수정 시간 |

---

## 3. Google Sheets 구조

### 시트1: 학생정보
| A | B | C | D |
|---|---|---|---|
| 학생ID | 이름 | 학년 | 전화번호 |
| h01001 | 김철수 | 고1 | 010-1234-5678 |

### 시트2: 학생별 요약 결과
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| 학생ID | 이름 | 학교 | 시험 | 점수 | 성취도 | 제출일시 |
| h01001 | 김철수 | 대일고등학교 | 2024년 2학기 중간 | 85점 | 85% | 2024-11-15 |

### 시트3: 단원별 상세 분석
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 학생ID | 이름 | 시험 | 단원 | 정답수 | 오답수 | 미응시 | 성취도 | 제출일시 |
| h01001 | 김철수 | 2024년 2학기 중간 | 전자기 유도 | 3 | 1 | 0 | 75% | 2024-11-15 |

### 기출문제 시트 (정답 데이터)
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 학교 | 연도 | 학기 | 문제번호 | 분류 | 단원 | 정답 | 복수정답 |
| 대일고등학교 | 2024 | 2학기 중간 | 1 | 에너지 | 전자기 유도 | ③ | FALSE |

---

## 4. API 엔드포인트

### 인증
- `POST /api/auth/login` - 학생 로그인
- `POST /api/admin/login` - 관리자 로그인 (비번: 3721)

### 학교/시험
- `GET /api/schools` - 학교 목록
- `GET /api/schools/:schoolId/exams` - 학교별 시험
- `GET /api/exams/:examId` - 시험 정보
- `GET /api/exams/:examId/questions` - 시험 문제

### 시험 제출
- `POST /api/test/submit` - 답안 제출
- `GET /api/submissions/:studentId` - 학생 제출 기록

### 통계
- `GET /api/exams/:examId/unit-stats` - 단원별 통계

### OMR
- `POST /api/omr/scan` - OMR 이미지 스캔

### 관리자
- `GET /api/admin/students` - 학생 목록
- `GET /api/admin/submissions` - 전체 제출 기록
- `GET /api/admin/all-results` - Google Sheets 결과 읽기
- `GET /api/admin/settings/spreadsheet-id` - 스프레드시트 ID 조회
- `POST /api/admin/settings/spreadsheet-id` - 스프레드시트 ID 설정

### 데이터 동기화
- `POST /api/init-data` - 초기 데이터 로드
- `POST /api/upload-to-sheets` - Sheets에 업로드
- `POST /api/load-from-sheets` - Sheets에서 로드

---

## 5. 통합과학 단원 분류

### 카테고리
- 에너지
- 화학
- 생태계
- 지구
- 생명
- 신소재

### 세부 단원
| 카테고리 | 단원 |
|----------|------|
| 에너지 | 전자기 유도, 발전, 전력 수송, 전력 손실, 에너지 효율 |
| 화학 | 산화-환원, 산-염기, 원소 주기성, 화학 결합 |
| 생태계 | 생태계 구성, 생태계 평형, 진화와 변이, 생물 다양성 |
| 지구 | 지구 시스템, 지권 변동, 지질 시대, 대기 순환 |
| 생명 | 생명체 구성 물질, 물질대사, 유전 정보 |
| 신소재 | 반도체, 초전도체, 신소재 |

---

## 6. 점수 계산 로직 (핵심!)

```typescript
// 전체 점수 계산
const answeredQuestions = answers.length; // 답한 문제 수
const correctAnswers = /* 맞은 문제 수 */;
const score = Math.round((correctAnswers * 100) / answeredQuestions);

// 단원별 성취도 계산
const unitAnswered = unit.correct + unit.wrong;
const achievementRate = Math.round((unit.correct * 100) / unitAnswered);

// 응시하지 않은 단원 필터링
const answeredUnitResults = unitResults.filter(unit => {
  return (unit.correct + unit.wrong) > 0;
});
```

**중요:** 전체 문제 수가 아닌 **답한 문제 수** 기준으로 점수 계산!

---

## 7. OMR 템플릿

OMR 인식을 위해서는 특정 템플릿이 필요합니다:
- 4개 모서리에 검정 원형 마커 (●)
- 30문제 × 5지선다 그리드
- A4 크기 권장

---

## 8. 설정 방법

### 1단계: Replit 프로젝트 생성
1. Replit에서 새 프로젝트 생성
2. Template: Node.js 선택
3. 위의 프롬프트 입력

### 2단계: 데이터베이스 설정
1. Replit의 PostgreSQL 데이터베이스 생성
2. 자동으로 DATABASE_URL 환경변수 설정됨

### 3단계: Google Sheets 연동
1. Replit Connectors에서 Google Sheets 추가
2. Google 계정 연결
3. 스프레드시트 ID 입력 (관리자 페이지에서)

### 4단계: 데이터 초기화
1. 학생 정보를 Google Sheets 시트1에 입력
2. 기출문제 정답을 기출문제 시트에 입력
3. 관리자 페이지에서 "Sheets에서 불러오기" 클릭

---

## 9. 필요한 패키지

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "drizzle-orm": "^0.x",
    "express": "^4.x",
    "googleapis": "^140.x",
    "multer": "^1.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "recharts": "^2.x",
    "wouter": "^3.x",
    "zod": "^3.x"
  }
}
```

### Python 패키지 (OMR용)
```
opencv-python
numpy
pillow
```

---

## 10. 브랜딩 변경 포인트

"본과학학원"으로 변경 시 수정할 파일:
1. `client/src/pages/login.tsx` - 로고, 학원명
2. `client/src/pages/result.tsx` - 결과 페이지 헤더
3. `client/src/pages/admin.tsx` - 관리자 페이지 헤더
4. `replit.md` - 프로젝트 설명

---

## 11. 주의사항

1. **점수 계산**: 반드시 "답한 문제 수" 기준으로 계산
2. **응시하지 않은 단원**: 성취도에 표시하지 않음
3. **복수 정답**: JSON 배열 형식으로 저장 (예: ["③", "④"])
4. **OMR 인식**: 커스텀 템플릿 필요
5. **Google Sheets**: 헤더 행 필수

---

이 문서를 사용하여 다른 Replit에서 동일한 시스템을 재생성할 수 있습니다.
