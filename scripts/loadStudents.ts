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

// 학생 데이터
const students = [
  // 고등 1학년
  { studentId: 'h01001', studentName: '강민엽', grade: '고등 1학년', phone: '01097561279' },
  { studentId: 'h01002', studentName: '강소율', grade: '고등 1학년', phone: '01043301135' },
  { studentId: 'h01003', studentName: '김경호', grade: '고등 1학년', phone: '01032400486' },
  { studentId: 'h01004', studentName: '김도우', grade: '고등 1학년', phone: '01032601833' },
  { studentId: 'h01005', studentName: '김도혜', grade: '고등 1학년', phone: '01090987981' },
  { studentId: 'h01006', studentName: '김상윤', grade: '고등 1학년', phone: '01041680116' },
  { studentId: 'h01007', studentName: '김서우', grade: '고등 1학년', phone: '01040211705' },
  { studentId: 'h01008', studentName: '김태경', grade: '고등 1학년', phone: '01035762397' },
  { studentId: 'h01009', studentName: '김태윤', grade: '고등 1학년', phone: '01099495123' },
  { studentId: 'h01010', studentName: '김태환', grade: '고등 1학년', phone: '01056841977' },
  { studentId: 'h01011', studentName: '나광혁', grade: '고등 1학년', phone: '01022627409' },
  { studentId: 'h01012', studentName: '민경록', grade: '고등 1학년', phone: '01048114216' },
  { studentId: 'h01013', studentName: '민수민', grade: '고등 1학년', phone: '01086311872' },
  { studentId: 'h01014', studentName: '민예빈', grade: '고등 1학년', phone: '01062437507' },
  { studentId: 'h01015', studentName: '박사랑', grade: '고등 1학년', phone: '01042970408' },
  { studentId: 'h01016', studentName: '박예서', grade: '고등 1학년', phone: '01020411949' },
  { studentId: 'h01017', studentName: '박우준', grade: '고등 1학년', phone: '01020808070' },
  { studentId: 'h01018', studentName: '신주헌', grade: '고등 1학년', phone: '01093732201' },
  { studentId: 'h01019', studentName: '심다은', grade: '고등 1학년', phone: null },
  { studentId: 'h01020', studentName: '양서준', grade: '고등 1학년', phone: '01071240071' },
  { studentId: 'h01021', studentName: '오재윤', grade: '고등 1학년', phone: '01087342359' },
  { studentId: 'h01022', studentName: '원예준', grade: '고등 1학년', phone: '01093328602' },
  { studentId: 'h01023', studentName: '유병주', grade: '고등 1학년', phone: '01023256076' },
  { studentId: 'h01025', studentName: '윤수영', grade: '고등 1학년', phone: '01063967021' },
  { studentId: 'h01026', studentName: '윤정연', grade: '고등 1학년', phone: '01048731884' },
  { studentId: 'h01027', studentName: '이민정', grade: '고등 1학년', phone: '01020026601' },
  { studentId: 'h01028', studentName: '이태림', grade: '고등 1학년', phone: '01090969729' },
  { studentId: 'h01029', studentName: '이태형', grade: '고등 1학년', phone: '01053333238' },
  { studentId: 'h01030', studentName: '이현석', grade: '고등 1학년', phone: '01030489634' },
  { studentId: 'h01031', studentName: '최유현', grade: '고등 1학년', phone: '01092230270' },
  { studentId: 'h01032', studentName: '이효상', grade: '고등 1학년', phone: '01030804046' },
  { studentId: 'h01033', studentName: '이효주', grade: '고등 1학년', phone: '01047520365' },
  { studentId: 'h01034', studentName: '임유하', grade: '고등 1학년', phone: '01031352602' },
  { studentId: 'h01035', studentName: '장윤제', grade: '고등 1학년', phone: '01032375339' },
  { studentId: 'h01036', studentName: '정민유', grade: '고등 1학년', phone: '01025672279' },
  { studentId: 'h01037', studentName: '정승헌', grade: '고등 1학년', phone: '01089866963' },
  { studentId: 'h01038', studentName: '정하진', grade: '고등 1학년', phone: '01056658046' },
  { studentId: 'h01039', studentName: '조원희', grade: '고등 1학년', phone: '01048454977' },
  { studentId: 'h01040', studentName: '조준서', grade: '고등 1학년', phone: '01071235836' },
  { studentId: 'h01041', studentName: '조태윤', grade: '고등 1학년', phone: '01031212970' },
  { studentId: 'h01042', studentName: '차유민', grade: '고등 1학년', phone: '01089792340' },
  { studentId: 'h01043', studentName: '최서연', grade: '고등 1학년', phone: '01039490728' },
  { studentId: 'h01044', studentName: '최승아', grade: '고등 1학년', phone: '01064790168' },
  { studentId: 'h01045', studentName: '최승희', grade: '고등 1학년', phone: '01022458716' },
  { studentId: 'h01046', studentName: '최지용', grade: '고등 1학년', phone: '01085913207' },
  { studentId: 'h01047', studentName: '함정민', grade: '고등 1학년', phone: '01029076399' },
  { studentId: 'h01048', studentName: '허서우', grade: '고등 1학년', phone: '01039209105' },
  { studentId: 'h01049', studentName: '현서연', grade: '고등 1학년', phone: '01090444556' },
  { studentId: 'h01050', studentName: '형태은', grade: '고등 1학년', phone: null },
  { studentId: 'h01051', studentName: '황석현', grade: '고등 1학년', phone: '01032302154' },
  { studentId: 'h01052', studentName: '강혜린', grade: '고등 1학년', phone: '01090646019' },
  { studentId: 'h01053', studentName: '강재민', grade: '고등 1학년', phone: '01094447623' },
  { studentId: 'h01054', studentName: '안영준', grade: '고등 1학년', phone: '01093025576' },
  { studentId: 'h01055', studentName: '이수열', grade: '고등 1학년', phone: '01037626451' },
  { studentId: 'h01056', studentName: '강하율', grade: '고등 1학년', phone: '01077670742' },
  { studentId: 'h01057', studentName: '변도윤', grade: '고등 1학년', phone: '01090647234' },
  { studentId: 'h01058', studentName: '최윤슬', grade: '고등 1학년', phone: '01054796169' },
  { studentId: 'h01059', studentName: '최유현', grade: '고등 1학년', phone: '01092230270' },
  { studentId: 'h01060', studentName: '안소현', grade: '고등 1학년', phone: '01024700745' },
  { studentId: 'h01061', studentName: '유승체', grade: '고등 1학년', phone: '01029406330' },
  { studentId: 'h01062', studentName: '김도연', grade: '고등 1학년', phone: null },
  { studentId: 'h01063', studentName: '윤서현', grade: '고등 1학년', phone: '01051599373' },
  { studentId: 'h01064', studentName: '이유주', grade: '고등 1학년', phone: '01047870059' },

  // 중등 3학년
  { studentId: 'm03001', studentName: '권승수', grade: '중등 3학년', phone: '01027266383' },
  { studentId: 'm03002', studentName: '권주하', grade: '중등 3학년', phone: '01087559138' },
  { studentId: 'm03003', studentName: '김은효', grade: '중등 3학년', phone: '01091889482' },
  { studentId: 'm03004', studentName: '노건우', grade: '중등 3학년', phone: '01058968893' },
  { studentId: 'm03005', studentName: '노건희', grade: '중등 3학년', phone: '01058968893' },
  { studentId: 'm03006', studentName: '서지민', grade: '중등 3학년', phone: '01097378589' },
  { studentId: 'm03007', studentName: '서지웅', grade: '중등 3학년', phone: null },
  { studentId: 'm03008', studentName: '신수호', grade: '중등 3학년', phone: '01092840932' },
  { studentId: 'm03009', studentName: '안지효', grade: '중등 3학년', phone: '01087228870' },
  { studentId: 'm03010', studentName: '유은서', grade: '중등 3학년', phone: '01066216890' },
  { studentId: 'm03011', studentName: '유채현', grade: '중등 3학년', phone: '01042750556' },
  { studentId: 'm03012', studentName: '유채호', grade: '중등 3학년', phone: '01042750556' },
  { studentId: 'm03013', studentName: '이상언', grade: '중등 3학년', phone: '01037219479' },
  { studentId: 'm03014', studentName: '이연지', grade: '중등 3학년', phone: '01083306114' },
  { studentId: 'm03015', studentName: '이준범', grade: '중등 3학년', phone: '01027827371' },
  { studentId: 'm03016', studentName: '장하준', grade: '중등 3학년', phone: '01042556569' },
  { studentId: 'm03017', studentName: '정예솔', grade: '중등 3학년', phone: '01073764233' },
  { studentId: 'm03018', studentName: '조민결', grade: '중등 3학년', phone: '01032931821' },
  { studentId: 'm03019', studentName: '하은수', grade: '중등 3학년', phone: '01045705033' },
  { studentId: 'm03021', studentName: '홍승기', grade: '중등 3학년', phone: '01063593870' },
  { studentId: 'm03022', studentName: '이유민', grade: '중등 3학년', phone: '01093781113' },
  { studentId: 'm03023', studentName: '윤태진', grade: '중등 3학년', phone: '01027169342' },
  { studentId: 'm03024', studentName: '채서연', grade: '중등 3학년', phone: '01091639535' },
  { studentId: 'm03025', studentName: '조효민', grade: '중등 3학년', phone: null },
  { studentId: 'm03031', studentName: '강수민', grade: '중등 3학년', phone: '01064069276' },
  { studentId: 'm03032', studentName: '강희제', grade: '중등 3학년', phone: '01048153610' },
  { studentId: 'm03033', studentName: '김루비', grade: '중등 3학년', phone: '01073378850' },
  { studentId: 'm03034', studentName: '김성호', grade: '중등 3학년', phone: '01029424475' },
  { studentId: 'm03035', studentName: '김연준', grade: '중등 3학년', phone: '01088615065' },
  { studentId: 'm03036', studentName: '김유성', grade: '중등 3학년', phone: '01074363777' },
  { studentId: 'm03038', studentName: '김자훈', grade: '중등 3학년', phone: '01028260309' },
  { studentId: 'm03039', studentName: '김하니', grade: '중등 3학년', phone: '01032531243' },
  { studentId: 'm03040', studentName: '김현서', grade: '중등 3학년', phone: '01073356388' },
  { studentId: 'm03042', studentName: '이인재', grade: '중등 3학년', phone: '01073753317' },
  { studentId: 'm03043', studentName: '이정목', grade: '중등 3학년', phone: '01089401105' },
  { studentId: 'm03045', studentName: '이정석', grade: '중등 3학년', phone: '01089401105' },
  { studentId: 'm03047', studentName: '전욱진', grade: '중등 3학년', phone: '01033091152' },
  { studentId: 'm03048', studentName: '정시은', grade: '중등 3학년', phone: '01085817331' },
  { studentId: 'm03050', studentName: '조서완', grade: '중등 3학년', phone: '01048028246' },
  { studentId: 'm03051', studentName: '조정인', grade: '중등 3학년', phone: '01026663806' },
  { studentId: 'm03052', studentName: '채부영', grade: '중등 3학년', phone: '01032542713' },
  { studentId: 'm03054', studentName: '하동호', grade: '중등 3학년', phone: '01054439828' },
  { studentId: 'm03056', studentName: '홍유하', grade: '중등 3학년', phone: '01099224173' },
  { studentId: 'm03057', studentName: '홍주연', grade: '중등 3학년', phone: '01053111038' },
  { studentId: 'm03058', studentName: '오채민', grade: '중등 3학년', phone: '01047253518' },
  { studentId: 'm03059', studentName: '성준혁', grade: '중등 3학년', phone: '01023077504' },
  { studentId: 'm03060', studentName: '유지효', grade: '중등 3학년', phone: '01086842646' },
  { studentId: 'm03061', studentName: '송선우', grade: '중등 3학년', phone: '01063930012' },
  { studentId: 'm03062', studentName: '황형식', grade: '중등 3학년', phone: '01053815839' },
  { studentId: 'm03063', studentName: '정유정', grade: '중등 3학년', phone: '01045074333' },
  { studentId: 'm03064', studentName: '김윤성', grade: '중등 3학년', phone: null },
  { studentId: 'm03065', studentName: '백서윤', grade: '중등 3학년', phone: null },
  { studentId: 'm03066', studentName: '김가현', grade: '중등 3학년', phone: null },
  { studentId: 'm03067', studentName: '조민준', grade: '중등 3학년', phone: null },
  { studentId: 'm03068', studentName: '이승주', grade: '중등 3학년', phone: null },

  // 중등 2학년
  { studentId: 'm02001', studentName: '고은채', grade: '중등 2학년', phone: '01023350941' },
  { studentId: 'm02002', studentName: '권예지', grade: '중등 2학년', phone: '01033885110' },
  { studentId: 'm02003', studentName: '권준용', grade: '중등 2학년', phone: '01052203598' },
  { studentId: 'm02004', studentName: '김지원', grade: '중등 2학년', phone: '01088103736' },
  { studentId: 'm02005', studentName: '남건우', grade: '중등 2학년', phone: '01063643708' },
  { studentId: 'm02006', studentName: '신가윤', grade: '중등 2학년', phone: null },
  { studentId: 'm02007', studentName: '신건휘', grade: '중등 2학년', phone: '01025107174' },
  { studentId: 'm02008', studentName: '이슬안', grade: '중등 2학년', phone: '01025212457' },
  { studentId: 'm02009', studentName: '조예원', grade: '중등 2학년', phone: '01094070757' },
  { studentId: 'm02021', studentName: '남영우', grade: '중등 2학년', phone: null },
  { studentId: 'm02011', studentName: '천수민', grade: '중등 2학년', phone: null },
  { studentId: 'm02012', studentName: '한상엽', grade: '중등 2학년', phone: '01087176151' },
  { studentId: 'm02013', studentName: '홍민정', grade: '중등 2학년', phone: '01025223936' },
];

async function loadStudents() {
  console.log('👥 학생 정보 로드 시작...\n');

  try {
    // 1. 기존 학생 데이터 삭제
    console.log('1️⃣  기존 학생 데이터 삭제 중...');
    await pool.query('DELETE FROM students');
    console.log('   ✅ 기존 학생 데이터 삭제 완료\n');

    // 2. 학생 데이터 입력
    console.log('2️⃣  학생 데이터 입력 중...');

    let insertedCount = 0;
    for (const student of students) {
      await pool.query(
        'INSERT INTO students (student_id, student_name, grade, phone) VALUES ($1, $2, $3, $4)',
        [student.studentId, student.studentName, student.grade, student.phone]
      );
      insertedCount++;

      if (insertedCount % 20 === 0) {
        console.log(`   진행 중... ${insertedCount}/${students.length} 학생 입력 완료`);
      }
    }

    console.log(`   ✅ 총 ${insertedCount}명 학생 입력 완료\n`);

    // 3. 학년별 통계 확인
    console.log('3️⃣  학년별 학생 수 확인...');
    const gradeStats = await pool.query(`
      SELECT grade, COUNT(*) as count
      FROM students
      GROUP BY grade
      ORDER BY grade
    `);

    console.log('\n📊 학년별 학생 수:');
    gradeStats.rows.forEach((stat: any) => {
      console.log(`   - ${stat.grade}: ${stat.count}명`);
    });

    console.log('\n✅ 학생 정보 로드 완료!');
    console.log(`\n📌 요약:`);
    console.log(`   - 총 학생 수: ${insertedCount}명`);
    console.log(`   - 전화번호 없는 학생: ${students.filter(s => !s.phone).length}명`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

loadStudents()
  .then(() => {
    console.log('\n🎉 스크립트 실행 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 스크립트 실행 실패:', error);
    process.exit(1);
  });
