import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, submitTestSchema, type UnitResult } from "@shared/schema";
import { readExamDataFromSheet, writeExamDataToSheet, writeStudentResultToSheet, readResultsFromSheet, readAllResultsFromSheet } from "./googleSheets";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const SPREADSHEET_ID = "1Mi70D_RLWqSCqmlCl2t_yUfdiByF1ExXkLrn7SQcv7k";

// Multer 설정 - OMR 이미지 업로드용
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다"));
    }
  },
});

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

  // OMR 이미지 스캔 엔드포인트
  app.post("/api/omr/scan", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "이미지 파일이 업로드되지 않았습니다",
        });
      }

      const examId = req.body.examId ? parseInt(req.body.examId) : null;
      let totalQuestions = 30; // 기본값

      // 시험 ID가 제공된 경우 실제 문제 수 확인
      if (examId) {
        const questions = await storage.getQuestionsByExam(examId);
        const multipleChoiceQuestions = questions.filter(q => q.type === "객관식");
        totalQuestions = multipleChoiceQuestions.length;
      }

      const imagePath = req.file.path;

      // Python 스크립트 실행
      const pythonProcess = spawn("python3", [
        path.join(process.cwd(), "server", "omr_process.py"),
        imagePath,
        totalQuestions.toString(),
      ]);

      let outputData = "";
      let errorData = "";

      pythonProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      // Python 프로세스 실행 에러 처리
      pythonProcess.on("error", (error) => {
        console.error("Python 프로세스 실행 실패:", error);
        
        // 임시 파일 삭제
        fs.unlink(imagePath, (err) => {
          if (err) console.error("임시 파일 삭제 실패:", err);
        });

        return res.status(500).json({
          success: false,
          message: "OMR 처리 프로그램을 실행할 수 없습니다",
          error: error.message,
        });
      });

      pythonProcess.on("close", (code) => {
        // 임시 파일 삭제
        fs.unlink(imagePath, (err) => {
          if (err) console.error("임시 파일 삭제 실패:", err);
        });

        if (code !== 0) {
          console.error("Python 스크립트 오류:", errorData);
          return res.status(500).json({
            success: false,
            message: "OMR 이미지 처리 중 오류가 발생했습니다",
            error: errorData,
          });
        }

        try {
          const result = JSON.parse(outputData);
          
          if (!result.success) {
            return res.status(400).json({
              success: false,
              message: result.message || "OMR 인식에 실패했습니다",
              error: result.error,
            });
          }

          // 답안 형식 변환: {1: "2", 2: "3,4"} -> [{questionNumber: 1, answer: "2"}, ...]
          const answers = Object.entries(result.answers).map(([questionNumber, answer]) => ({
            questionNumber: parseInt(questionNumber),
            answer: answer as string,
          }));

          return res.json({
            success: true,
            answers,
            message: result.message,
          });
        } catch (parseError: any) {
          console.error("JSON 파싱 오류:", parseError);
          return res.status(500).json({
            success: false,
            message: "결과 처리 중 오류가 발생했습니다",
            error: parseError.message,
          });
        }
      });
    } catch (error: any) {
      // 에러 발생 시 업로드된 파일 삭제
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("파일 삭제 실패:", err);
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "OMR 스캔 중 오류가 발생했습니다",
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
          // Parse correct answer from database (handle both JSON array and plain string formats)
          let correctAnswerArray: string[];
          try {
            // Try parsing as JSON array first (e.g., ["③"])
            correctAnswerArray = JSON.parse(question.answer) as string[];
          } catch {
            // If parsing fails, treat as plain string (e.g., "③")
            correctAnswerArray = [question.answer];
          }
          
          // Handle multiple answers
          if (question.isMultipleAnswer) {
            const studentAnswerList = studentAnswer.answer.split(',').map(a => a.trim()).sort();
            const correctAnswerList = correctAnswerArray.sort();
            isCorrect = JSON.stringify(studentAnswerList) === JSON.stringify(correctAnswerList);
          } else {
            // Single answer: compare first element of correct answer array with student answer
            isCorrect = correctAnswerArray[0] === studentAnswer.answer;
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

      // Calculate achievement rates for units (based on answered questions only)
      const unitResults: UnitResult[] = Array.from(unitMap.values()).map(unit => {
        const unitAnswered = unit.correct + unit.wrong;
        return {
          ...unit,
          achievementRate: unitAnswered > 0 
            ? Math.round((unit.correct * 100) / unitAnswered) 
            : 0,
        };
      });

      // Calculate overall achievement rate and score (based on answered questions only)
      const achievementRate = answeredQuestions > 0 
        ? Math.round((correctAnswers * 100) / answeredQuestions)
        : 0;

      const score = answeredQuestions > 0
        ? Math.round((correctAnswers * 100) / answeredQuestions)
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

      // Write result to Google Sheets (시트2, 시트3)
      let googleSheetsSuccess = false;
      let googleSheetsError = null;
      
      try {
        await writeStudentResultToSheet(SPREADSHEET_ID, {
          studentId,
          studentName,
          exam,
          score,
          achievementRate,
          unitResults,
          submittedAt: submission.submittedAt,
        });
        console.log('✅ Wrote student result to Google Sheets (시트2, 시트3)');
        googleSheetsSuccess = true;
      } catch (sheetError: any) {
        console.error('❌ Failed to write to Google Sheets:', sheetError);
        googleSheetsError = sheetError.message || '구글 시트 연동 실패';
        // Continue even if Google Sheets fails
      }

      return res.json({
        submissionId: submission.id,
        examId,
        score,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        achievementRate,
        unitResults,
        details,
        googleSheets: {
          success: googleSheetsSuccess,
          error: googleSheetsError,
        },
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

  // Get unit statistics for an exam (평균 및 최고 성적)
  app.get("/api/exams/:examId/unit-stats", async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const submissions = await storage.getSubmissionsByExam(examId);
      
      if (submissions.length === 0) {
        return res.json([]);
      }

      // Parse all unit results
      const allUnitResults = submissions.flatMap(sub => 
        JSON.parse(sub.unitResults) as UnitResult[]
      );

      // Group by category and unit
      const unitMap = new Map<string, { 
        category: string; 
        unit: string; 
        scores: number[];
      }>();

      allUnitResults.forEach(unitResult => {
        const key = `${unitResult.category}|${unitResult.unit}`;
        if (!unitMap.has(key)) {
          unitMap.set(key, {
            category: unitResult.category,
            unit: unitResult.unit,
            scores: []
          });
        }
        unitMap.get(key)!.scores.push(unitResult.achievementRate);
      });

      // Calculate statistics
      const stats = Array.from(unitMap.values()).map(({ category, unit, scores }) => {
        const average = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
        const highest = scores.length > 0 ? Math.max(...scores) : 0;
        
        return {
          category,
          unit,
          average,
          highest,
          studentCount: scores.length
        };
      });

      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "단원별 통계를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Initialize data from attached files
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
      
      // Parse all exam files (excluding duplicates)
      const files = [
        'Pasted--cite--1763097329757_1763097329758.txt',  // 목동 기출
        'Pasted---1763098921528_1763098921529.txt',       // 강서양천 2023-2학기 기말
        'Pasted--cite--1763100057184_1763100057185.txt',  // 2024-2학기 중간 (NEW)
      ];

      let combinedResult: Record<string, Record<string, any[]>> = {};

      for (const fileName of files) {
        const filePath = path.join(process.cwd(), 'attached_assets', fileName);
        
        if (!fs.existsSync(filePath)) {
          console.log(`파일을 찾을 수 없습니다: ${fileName}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const result = parseExamData(content);

        // Merge results
        for (const [schoolName, examData] of Object.entries(result)) {
          if (!combinedResult[schoolName]) {
            combinedResult[schoolName] = {};
          }
          for (const [examKey, examQuestions] of Object.entries(examData)) {
            if (!combinedResult[schoolName][examKey]) {
              combinedResult[schoolName][examKey] = [];
            }
            combinedResult[schoolName][examKey].push(...examQuestions);
          }
        }
      }

      // Create schools and exams
      for (const [schoolName, examData] of Object.entries(combinedResult)) {
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

  // Upload current data to Google Sheets
  app.post("/api/upload-to-sheets", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({
          message: "스프레드시트 ID가 필요합니다.",
        });
      }

      console.log(`Uploading data to Google Sheets: ${spreadsheetId}`);

      const allExams = await storage.getAllExams();
      const exportData: any[] = [];

      for (const exam of allExams) {
        const questions = await storage.getQuestionsByExam(exam.id);
        
        for (const question of questions) {
          // Parse answer if it's JSON (multiple answers)
          let answer = question.answer;
          let isMultipleAnswer = question.isMultipleAnswer;
          
          if (question.isMultipleAnswer) {
            try {
              const parsed = JSON.parse(question.answer);
              if (Array.isArray(parsed)) {
                answer = parsed.join(',');
              }
            } catch {
              // If parsing fails, use as is
            }
          }

          exportData.push({
            schoolName: exam.schoolName,
            year: exam.year,
            semester: exam.semester,
            questionNumber: question.questionNumber,
            category: question.category,
            unit: question.unit,
            answer,
            isMultipleAnswer,
          });
        }
      }

      await writeExamDataToSheet(spreadsheetId, exportData);

      return res.json({
        message: "구글 시트 업로드 완료",
        questionCount: exportData.length,
      });
    } catch (error: any) {
      console.error('Upload to sheets error:', error);
      return res.status(500).json({
        message: error.message || "구글 시트 업로드 중 오류가 발생했습니다.",
      });
    }
  });

  // Load data from Google Sheets
  app.post("/api/load-from-sheets", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({
          message: "스프레드시트 ID가 필요합니다.",
        });
      }

      console.log(`Loading exam data from Google Sheets: ${spreadsheetId}`);
      
      const sheetData = await readExamDataFromSheet(spreadsheetId);
      
      console.log(`Found ${sheetData.length} questions in Google Sheets`);

      // Group by school and exam
      const examMap = new Map<string, Map<string, any[]>>();
      
      for (const row of sheetData) {
        if (!row.schoolName || !row.year || !row.semester) {
          continue;
        }

        const schoolKey = row.schoolName;
        const examKey = `${row.year}_${row.semester}`;
        
        if (!examMap.has(schoolKey)) {
          examMap.set(schoolKey, new Map());
        }
        
        const schoolExams = examMap.get(schoolKey)!;
        if (!schoolExams.has(examKey)) {
          schoolExams.set(examKey, []);
        }

        // Normalize answer format for multiple answers
        let answer = row.answer;
        if (row.isMultipleAnswer) {
          const answers = answer.split(',').map((a: string) => a.trim()).filter((a: string) => a).sort();
          answer = JSON.stringify(answers);
        }
        
        schoolExams.get(examKey)!.push({
          questionNumber: row.questionNumber,
          type: '객관식',
          category: row.category,
          unit: row.unit,
          answer,
          isMultipleAnswer: row.isMultipleAnswer,
        });
      }

      // Create schools and exams
      let schoolCount = 0;
      let questionCount = 0;

      for (const [schoolName, examData] of Array.from(examMap.entries())) {
        // Check if school already exists
        let school = (await storage.getAllSchools()).find(s => s.name === schoolName);
        
        if (!school) {
          school = await storage.createSchool({ name: schoolName });
          schoolCount++;
        }
        
        for (const [examKey, examQuestions] of Array.from(examData.entries())) {
          const [year, semester] = examKey.split('_');
          
          // Check if exam already exists
          const existingExams = await storage.getExamsBySchool(school.id);
          let exam = existingExams.find(e => 
            e.year === parseInt(year) && e.semester === semester
          );
          
          if (!exam) {
            exam = await storage.createExam({
              schoolId: school.id,
              schoolName: school.name,
              year: parseInt(year),
              semester,
              subject: "통합과학",
            });
          }

          if (examQuestions.length > 0) {
            await storage.createManyQuestions(examQuestions.map((q: any) => ({
              ...q,
              examId: exam.id,
            })));
            questionCount += examQuestions.length;
          }
        }
      }

      const schools = await storage.getAllSchools();
      const questions = await storage.getAllQuestions();

      return res.json({
        message: "구글 시트 데이터 로드 완료",
        schoolCount: schools.length,
        newSchools: schoolCount,
        questionCount: questions.length,
        newQuestions: questionCount,
      });
    } catch (error: any) {
      console.error('Load from sheets error:', error);
      return res.status(500).json({
        message: error.message || "구글 시트 데이터 로드 중 오류가 발생했습니다.",
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

  app.get("/api/admin/all-results", async (req, res) => {
    try {
      const setting = await storage.getSetting("spreadsheet-id");
      const spreadsheetId = setting?.value;
      
      if (!spreadsheetId) {
        return res.json([]);
      }

      console.log(`[Admin] Reading results from Google Sheets (시트3)...`);
      const results = await readAllResultsFromSheet(spreadsheetId);
      console.log(`[Admin] Found ${results.length} results in 시트3`);
      
      const formattedResults = results.map(result => ({
        studentId: result.studentId,
        studentName: result.studentName,
        textbook: result.exam,
        unit: result.unit,
        submittedAt: result.submittedAt,
        achievementRate: result.achievementRate,
        feedback: '',
      }));
      
      return res.json(formattedResults);
    } catch (error: any) {
      console.error('Error reading results from Google Sheets:', error);
      return res.status(500).json({
        message: error.message || "구글 시트에서 성적을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get spreadsheet ID setting
  app.get("/api/admin/settings/spreadsheet-id", async (req, res) => {
    try {
      const setting = await storage.getSetting("spreadsheet-id");
      return res.json({ value: setting?.value || "" });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "설정을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Update spreadsheet ID setting
  app.post("/api/admin/settings/spreadsheet-id", async (req, res) => {
    try {
      const { value } = req.body;
      
      if (!value || typeof value !== "string") {
        return res.status(400).json({
          message: "구글 시트 ID를 입력해주세요.",
        });
      }

      await storage.setSetting("spreadsheet-id", value);
      
      return res.json({ 
        success: true,
        value,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "설정 저장 중 오류가 발생했습니다.",
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
