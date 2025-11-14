import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

const sql = neon(process.env.DATABASE_URL!);

interface Question {
  number: number;
  type: string;
  category: string;
  unit: string;
  answer: string[];
}

interface ExamData {
  school_name: string;
  year: number | null;
  semester: string;
  questions: Question[];
}

function parseAnswerFile(filePath: string): ExamData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exams: ExamData[] = [];
  
  // Split by school sections
  const sections = content.split(/---\s*\n+###\s+\d+\.\s+/);
  console.log(`  File: ${filePath} -> ${sections.length - 1} sections`);
  
  for (const section of sections.slice(1)) {  // Skip intro
    // Extract school name and exam info
    const headerMatch = section.match(/^([^(]+)\s+\(([^)]+)\)/);
    if (!headerMatch) {
      console.log(`    No header match for section starting: "${section.substring(0, 50)}..."`);
      continue;
    }
    
    const schoolName = headerMatch[1].trim();
    const examInfo = headerMatch[2].trim();
    
    // Parse year and semester
    const yearMatch = examInfo.match(/(\d{4})/);
    const semesterMatch = examInfo.match(/(\d+학기|1학년\s*\d+학기)\s*(중간|기말)/);
    
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    const semester = semesterMatch ? semesterMatch[0] : examInfo;
    
    // Extract questions
    const questions: Question[] = [];
    
    // Find 선택형 section
    const multipleChoiceMatch = section.match(/#### 선택형\s*\n+(.*?)(?=####|---|\n\n### |\Z)/s);
    if (multipleChoiceMatch) {
      const mcContent = multipleChoiceMatch[1];
      // Parse each question with category/unit info
      // Pattern: * 1번 🧬생명(물질) 정답 ③
      const questionPattern = /\*\s+(\d+)번\s+(⚡️|🧪|🌍|🌎|🧬|⚛️|💡)\s*([^(]+)\(([^)]+)\)\s+정답\s+([①②③④⑤,\s]+)/g;
      let match;
      
      // Debug: Check if content has the expected format
      const firstLine = mcContent.split('\n')[0];
      if (schoolName === '구로고등학교' && year === 2024) {
        console.log(`      구로고등학교 첫 줄: "${firstLine}"`);
        console.log(`      첫 200자: "${mcContent.substring(0, 200)}"`);
      }
      
      while ((match = questionPattern.exec(mcContent)) !== null) {
        const qNum = parseInt(match[1]);
        const emoji = match[2];
        const categoryRaw = match[3].trim();
        const unitRaw = match[4].trim();
        const answerText = match[5].trim();
        
        // Map emoji to category
        const categoryMap: Record<string, string> = {
          '⚡️': '에너지',
          '🧪': '화학',
          '🌍': '생태계',
          '🌎': '지구',
          '🧬': '생명',
          '⚛️': '화학',
          '💡': '신소재'
        };
        
        const category = categoryMap[emoji] || '에너지';
        
        // Extract unit - take first part before any slash
        const unit = unitRaw.split('/')[0].trim();
        
        // Handle multiple answers
        const answers: string[] = [];
        const answerChars = answerText.match(/[①②③④⑤]/g);
        if (answerChars) {
          answers.push(...answerChars);
        }
        
        if (answers.length > 0) {
          questions.push({
            number: qNum,
            type: '객관식',
            category,
            unit,
            answer: answers
          });
        }
      }
    }
    
    if (questions.length > 0) {
      exams.push({
        school_name: schoolName,
        year,
        semester,
        questions
      });
    } else {
      console.log(`    Skipping ${schoolName} (${year} ${semester}) - no questions parsed`);
    }
  }
  
  return exams;
}

async function loadAllExams() {
  console.log('Parsing answer files...');
  
  const file1 = 'attached_assets/Pasted--cite--1763100515683_1763100515683.txt';
  const file2 = 'attached_assets/Pasted---1763100538213_1763100538214.txt';
  
  const allExams: ExamData[] = [];
  allExams.push(...parseAnswerFile(file1));
  allExams.push(...parseAnswerFile(file2));
  
  console.log(`Found ${allExams.length} exams`);
  
  let totalQuestions = 0;
  
  for (const examData of allExams) {
    const { school_name, year, semester, questions } = examData;
    
    if (questions.length === 0) {
      console.log(`Skipping ${school_name} (${year} ${semester}) - no questions found`);
      continue;
    }
    
    // Check if school exists
    let schoolResult = await sql`SELECT id FROM schools WHERE name = ${school_name}`;
    let schoolId: number;
    
    if (schoolResult.length === 0) {
      // Insert school
      const newSchool = await sql`
        INSERT INTO schools (name) 
        VALUES (${school_name}) 
        RETURNING id
      `;
      schoolId = newSchool[0].id;
      console.log(`Created school: ${school_name} (ID: ${schoolId})`);
    } else {
      schoolId = schoolResult[0].id;
    }
    
    // Check if exam exists
    const examResult = await sql`
      SELECT id FROM exams 
      WHERE school_id = ${schoolId} AND year = ${year} AND semester = ${semester}
    `;
    
    let examId: number;
    
    if (examResult.length > 0) {
      examId = examResult[0].id;
      console.log(`Exam already exists: ${school_name} (${year} ${semester}) - updating questions`);
      // Delete existing questions
      await sql`DELETE FROM questions WHERE exam_id = ${examId}`;
    } else {
      // Create exam
      const newExam = await sql`
        INSERT INTO exams (school_id, school_name, year, semester)
        VALUES (${schoolId}, ${school_name}, ${year}, ${semester})
        RETURNING id
      `;
      examId = newExam[0].id;
      console.log(`Created exam: ${school_name} (${year} ${semester}) - ID: ${examId}`);
    }
    
    // Insert questions
    for (const q of questions) {
      // Convert answer array to sorted JSON string
      const answerJson = JSON.stringify(q.answer.sort());
      const isMultiple = q.answer.length > 1;
      
      await sql`
        INSERT INTO questions (exam_id, question_number, type, category, unit, answer, is_multiple_answer)
        VALUES (${examId}, ${q.number}, ${q.type}, ${q.category}, ${q.unit}, ${answerJson}, ${isMultiple})
      `;
      totalQuestions++;
    }
    
    console.log(`  Added ${questions.length} questions`);
  }
  
  console.log(`\nTotal: ${allExams.length} exams, ${totalQuestions} questions loaded`);
}

loadAllExams().catch(console.error);
