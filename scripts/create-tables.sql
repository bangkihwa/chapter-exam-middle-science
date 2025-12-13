-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Schools 테이블
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Exams 테이블
CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '통합과학'
);

-- Questions 테이블 (정답지)
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- '객관식' or '주관식'
  category TEXT NOT NULL, -- '물질', '생명', '에너지'
  unit TEXT NOT NULL, -- 단원명
  answer TEXT NOT NULL, -- 정답 (복수정답은 JSON array)
  is_multiple_answer BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(exam_id, question_number)
);

-- Students 테이블
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  phone VARCHAR(20)
);

-- Submissions 테이블 (학생 답안 제출 기록)
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  student_name TEXT NOT NULL,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  answers TEXT NOT NULL, -- JSON string
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answered_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  achievement_rate INTEGER NOT NULL,
  unit_results TEXT NOT NULL -- JSON string
);

-- Settings 테이블 (앱 설정)
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_exams_school_id ON exams(school_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_unit ON questions(unit);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_exam_id ON submissions(exam_id);

-- 완료 메시지
SELECT 'Tables created successfully!' as message;
