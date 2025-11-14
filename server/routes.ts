import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, submitTestSchema, type UnitResult } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { studentId, studentName } = loginSchema.parse(req.body);
      
      const student = await storage.getStudentByCredentials(studentId, studentName);
      
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "학생 ID 또는 이름이 일치하지 않습니다.",
        });
      }

      return res.json({
        success: true,
        student: {
          studentId: student.studentId,
          studentName: student.studentName,
          grade: student.grade,
          phone: student.phone,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "로그인 중 오류가 발생했습니다.",
      });
    }
  });

  // Get all schools
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getAllSchools();
      return res.json(schools);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "학교 목록을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get exams by school
  app.get("/api/schools/:schoolId/exams", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const exams = await storage.getExamsBySchool(schoolId);
      return res.json(exams);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "시험 목록을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get all exams
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      return res.json(exams);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "시험 목록을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get exam by id
  app.get("/api/exams/:examId", async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExamById(examId);
      
      if (!exam) {
        return res.status(404).json({
          message: "시험을 찾을 수 없습니다.",
        });
      }
      
      return res.json(exam);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "시험을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get questions by exam
  app.get("/api/exams/:examId/questions", async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const questions = await storage.getQuestionsByExam(examId);
      return res.json(questions);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "문제를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Submit test
  app.post("/api/test/submit", async (req, res) => {
    try {
      const { studentId, studentName, examId, answers } = submitTestSchema.parse(req.body);
      
      const questions = await storage.getQuestionsByExam(examId);
      const exam = await storage.getExamById(examId);
      
      if (!exam) {
        return res.status(404).json({
          message: "시험을 찾을 수 없습니다.",
        });
      }

      const multipleChoiceQuestions = questions.filter(q => q.type === "객관식");
      const totalQuestions = multipleChoiceQuestions.length;
      const answeredQuestions = answers.length;
      
      let correctAnswers = 0;
      const unitMap = new Map<string, UnitResult>();

      // Initialize unit results
      multipleChoiceQuestions.forEach(q => {
        const key = `${q.category}|${q.unit}`;
        if (!unitMap.has(key)) {
          unitMap.set(key, {
            category: q.category,
            unit: q.unit,
            total: 0,
            correct: 0,
            wrong: 0,
            unanswered: 0,
            achievementRate: 0,
          });
        }
        const unitResult = unitMap.get(key)!;
        unitResult.total++;
      });

      // Process answers
      const details = multipleChoiceQuestions.map(question => {
        const studentAnswer = answers.find(a => a.questionNumber === question.questionNumber);
        let isCorrect = false;

        if (studentAnswer) {
          // Handle multiple answers
          if (question.isMultipleAnswer) {
            const correctAnswers = JSON.parse(question.answer) as string[];
            const studentAnswerList = studentAnswer.answer.split(',').map(a => a.trim()).sort();
            const correctAnswerList = correctAnswers.sort();
            isCorrect = JSON.stringify(studentAnswerList) === JSON.stringify(correctAnswerList);
          } else {
            isCorrect = studentAnswer.answer === question.answer;
          }

          if (isCorrect) {
            correctAnswers++;
          }
        }

        // Update unit results
        const key = `${question.category}|${question.unit}`;
        const unitResult = unitMap.get(key)!;
        
        if (studentAnswer) {
          if (isCorrect) {
            unitResult.correct++;
          } else {
            unitResult.wrong++;
          }
        } else {
          unitResult.unanswered++;
        }

        return {
          questionNumber: question.questionNumber,
          studentAnswer: studentAnswer?.answer || "",
          correctAnswer: question.answer,
          isCorrect,
          isMultipleAnswer: question.isMultipleAnswer,
        };
      });

      // Calculate achievement rates for units
      const unitResults: UnitResult[] = Array.from(unitMap.values()).map(unit => ({
        ...unit,
        achievementRate: unit.total > 0 
          ? Math.round((unit.correct / unit.total) * 100) 
          : 0,
      }));

      const achievementRate = totalQuestions > 0 
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

      const score = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

      const submission = await storage.createSubmission({
        studentId,
        studentName,
        examId,
        answers: JSON.stringify(answers),
        score,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        achievementRate,
        unitResults: JSON.stringify(unitResults),
      });

      return res.json({
        submissionId: submission.id,
        score,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        achievementRate,
        unitResults,
        details,
      });
    } catch (error: any) {
      console.error('Submit test error:', error);
      return res.status(400).json({
        message: error.message || "시험 제출 중 오류가 발생했습니다.",
      });
    }
  });

  // Get student submissions
  app.get("/api/submissions/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const submissions = await storage.getSubmissionsByStudent(studentId);
      
      // Enhance with exam details
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const exam = await storage.getExamById(submission.examId);
          return {
            ...submission,
            exam,
            unitResults: JSON.parse(submission.unitResults) as UnitResult[],
          };
        })
      );
      
      return res.json(enrichedSubmissions);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "제출 기록을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Initialize data from attached file
  app.post("/api/init-data", async (req, res) => {
    try {
      const existingSchools = await storage.getAllSchools();
      if (existingSchools.length > 0) {
        return res.json({
          message: "데이터가 이미 존재합니다.",
          schoolCount: existingSchools.length,
        });
      }

      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'attached_assets', 'Pasted--cite--1763097329757_1763097329758.txt');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "기출문제 파일을 찾을 수 없습니다.",
        });
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const result = parseExamData(content);

      // Create schools and exams
      for (const [schoolName, examData] of Object.entries(result)) {
        const school = await storage.createSchool({ name: schoolName });
        
        for (const [examKey, examQuestions] of Object.entries(examData)) {
          const [year, semester] = examKey.split('_');
          const exam = await storage.createExam({
            schoolId: school.id,
            schoolName: school.name,
            year: parseInt(year),
            semester,
            subject: "통합과학",
          });

          if (examQuestions.length > 0) {
            await storage.createManyQuestions(examQuestions.map(q => ({
              ...q,
              examId: exam.id,
            })));
          }
        }
      }

      const schools = await storage.getAllSchools();
      const questions = await storage.getAllQuestions();

      return res.json({
        message: "데이터 초기화 완료",
        schoolCount: schools.length,
        questionCount: questions.length,
      });
    } catch (error: any) {
      console.error('Init data error:', error);
      return res.status(500).json({
        message: error.message || "데이터 초기화 중 오류가 발생했습니다.",
      });
    }
  });

  // Admin endpoints
  const ADMIN_PASSWORD = "3721";

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (password === ADMIN_PASSWORD) {
        return res.json({ success: true });
      } else {
        return res.status(401).json({ success: false, message: "비밀번호가 올바르지 않습니다." });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      return res.json(students);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "학생 데이터를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  app.get("/api/admin/submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const exam = await storage.getExamById(submission.examId);
          return {
            ...submission,
            exam,
            unitResults: JSON.parse(submission.unitResults) as UnitResult[],
          };
        })
      );
      
      return res.json(enrichedSubmissions);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "제출 기록을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to parse exam data
function parseExamData(content: string): Record<string, Record<string, any[]>> {
  const result: Record<string, Record<string, any[]>> = {};
  const lines = content.split('\n');
  
  let currentSchool = '';
  let currentYear = 0;
  let currentSemester = '';
  let currentType = ''; // '선택형' or '서답형'
  
  const categoryMap: Record<string, string> = {
    '⚡️': '에너지',
    '🧪': '화학',
    '🌍': '생태계',
    '🌎': '지구',
    '🧬': '생명',
    '⚛️': '화학',
    '💡': '신소재',
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Parse school and year/semester
    const schoolMatch = line.match(/^### (\d+)\.\s+(.+?고등학교)\s+\((\d+)년\s+(.+?)\)$/);
    if (schoolMatch) {
      currentSchool = schoolMatch[2];
      currentYear = parseInt(schoolMatch[3]);
      currentSemester = schoolMatch[4];
      
      if (!result[currentSchool]) {
        result[currentSchool] = {};
      }
      const examKey = `${currentYear}_${currentSemester}`;
      if (!result[currentSchool][examKey]) {
        result[currentSchool][examKey] = [];
      }
      continue;
    }

    // Parse question type section
    if (line === '#### 선택형') {
      currentType = '객관식';
      continue;
    }
    if (line === '#### 서답형') {
      currentType = '주관식';
      continue;
    }

    // Parse questions
    if (currentSchool && currentType === '객관식') {
      const questionMatch = line.match(/^\*\s+(\d+)번\s+([⚡️🧪🌍🌎🧬⚛️💡])(.+?)\s+정답\s+(.+)$/);
      if (questionMatch) {
        const questionNumber = parseInt(questionMatch[1]);
        const categoryEmoji = questionMatch[2];
        const unitText = questionMatch[3];
        const answerText = questionMatch[4].trim();
        
        const category = categoryMap[categoryEmoji] || '기타';
        const unitMatch = unitText.match(/\(([^)]+)\)/);
        const unit = unitMatch ? unitMatch[1] : unitText.trim();
        
        // Handle multiple answers - normalize to sorted JSON arrays
        const isMultipleAnswer = answerText.includes(',') || answerText.includes('복수');
        let answer: string;
        
        if (isMultipleAnswer) {
          const answers = answerText
            .replace(/\(복수 정답\)/g, '')
            .split(',')
            .map(a => a.trim())
            .filter(a => a)
            .sort(); // Sort for consistent comparison
          answer = JSON.stringify(answers);
        } else {
          answer = answerText;
        }

        const examKey = `${currentYear}_${currentSemester}`;
        result[currentSchool][examKey].push({
          questionNumber,
          type: currentType,
          category,
          unit,
          answer,
          isMultipleAnswer,
        });
      }
    }

    // Handle subjective questions if needed
    if (currentSchool && currentType === '주관식') {
      const subjectiveMatch = line.match(/^\*\s+\*\*서답형\s+(\d+)번\*\*\s+([⚡️🧪🌍🌎🧬⚛️💡])(.+?)$/);
      if (subjectiveMatch) {
        // For now, we'll skip subjective questions
        // They can be added later if needed
        continue;
      }
    }
  }
  
  return result;
}
