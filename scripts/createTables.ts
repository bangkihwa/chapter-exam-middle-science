import pg from 'pg';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function query(text: string) {
  const client = await pool.connect();
  try {
    await client.query(text);
  } finally {
    client.release();
  }
}

async function createTables() {
  console.log('🗄️  데이터베이스 테이블 생성 시작...\n');

  try {
    // 1. 기존 테이블 삭제
    console.log('1️⃣  기존 테이블 삭제 중...');
    await query('DROP TABLE IF EXISTS submissions CASCADE');
    await query('DROP TABLE IF EXISTS questions CASCADE');
    await query('DROP TABLE IF EXISTS exams CASCADE');
    await query('DROP TABLE IF EXISTS schools CASCADE');
    await query('DROP TABLE IF EXISTS students CASCADE');
    await query('DROP TABLE IF EXISTS settings CASCADE');
    console.log('   ✅ 기존 테이블 삭제 완료\n');

    // 2. Schools 테이블 생성
    console.log('2️⃣  테이블 생성 중...');
    await query(`
      CREATE TABLE schools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);
    console.log('   ✅ schools 테이블 생성');

    // 3. Exams 테이블 생성
    await query(`
      CREATE TABLE exams (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        school_name TEXT NOT NULL,
        year INTEGER NOT NULL,
        semester TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT '통합과학'
      )
    `);
    console.log('   ✅ exams 테이블 생성');

    // 4. Questions 테이블 생성
    await query(`
      CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        question_number INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        answer TEXT NOT NULL,
        is_multiple_answer BOOLEAN NOT NULL DEFAULT false,
        UNIQUE(exam_id, question_number)
      )
    `);
    console.log('   ✅ questions 테이블 생성');

    // 5. Students 테이블 생성
    await query(`
      CREATE TABLE students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL UNIQUE,
        student_name TEXT NOT NULL,
        grade TEXT NOT NULL,
        phone VARCHAR(20)
      )
    `);
    console.log('   ✅ students 테이블 생성');

    // 6. Submissions 테이블 생성
    await query(`
      CREATE TABLE submissions (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        student_name TEXT NOT NULL,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        answers TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        answered_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        achievement_rate INTEGER NOT NULL,
        unit_results TEXT NOT NULL
      )
    `);
    console.log('   ✅ submissions 테이블 생성');

    // 7. Settings 테이블 생성
    await query(`
      CREATE TABLE settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('   ✅ settings 테이블 생성\n');

    // 8. 인덱스 생성
    console.log('3️⃣  인덱스 생성 중...');
    await query('CREATE INDEX idx_exams_school_id ON exams(school_id)');
    await query('CREATE INDEX idx_questions_exam_id ON questions(exam_id)');
    await query('CREATE INDEX idx_questions_unit ON questions(unit)');
    await query('CREATE INDEX idx_submissions_student_id ON submissions(student_id)');
    await query('CREATE INDEX idx_submissions_exam_id ON submissions(exam_id)');
    console.log('   ✅ 인덱스 생성 완료\n');

    console.log('✅ 모든 테이블 생성 완료!\n');
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables()
  .then(() => {
    console.log('🎉 스크립트 실행 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 스크립트 실행 실패:', error);
    process.exit(1);
  });
