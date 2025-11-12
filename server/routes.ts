import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, submitTestSchema, TEXTBOOK_NAME, units } from "@shared/schema";
import { writeResultToSheet, readStudentsFromSheet, readResultsFromSheet, readQuestionStats } from "./googleSheets";

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

  // Get questions by unit
  app.get("/api/questions/unit/:unit", async (req, res) => {
    try {
      const unit = decodeURIComponent(req.params.unit);
      const questions = await storage.getQuestionsByUnit(unit);
      return res.json(questions);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "문제를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get question counts by unit
  app.get("/api/questions/counts", async (req, res) => {
    try {
      const allQuestions = await storage.getAllQuestions();
      const counts: Record<string, number> = {};
      
      allQuestions.forEach(q => {
        if (q.type === "객관식") {
          counts[q.unit] = (counts[q.unit] || 0) + 1;
        }
      });
      
      return res.json(counts);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "문제 개수를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Submit test
  app.post("/api/test/submit", async (req, res) => {
    try {
      const { studentId, studentName, unit, answers } = submitTestSchema.parse(req.body);
      
      const questions = await storage.getQuestionsByUnit(unit);
      const multipleChoiceQuestions = questions.filter(q => q.type === "객관식");
      
      let correctAnswers = 0;
      const details = multipleChoiceQuestions.map(question => {
        const studentAnswer = answers.find(a => a.questionId === question.questionId);
        const isCorrect = studentAnswer && studentAnswer.answer === question.answer;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        // 정답 정보를 답안 객체에 추가 (구글 시트 집계용)
        if (studentAnswer) {
          studentAnswer.correctAnswer = question.answer;
        }
        
        return {
          questionId: question.questionId,
          studentAnswer: studentAnswer?.answer || "",
          correctAnswer: question.answer,
          isCorrect,
        };
      });

      const totalQuestions = multipleChoiceQuestions.length;
      const achievementRate = totalQuestions > 0 
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

      let feedback = "";
      if (achievementRate === 100) {
        feedback = "완벽합니다! 모든 문제를 정확히 풀었습니다.";
      } else if (achievementRate >= 90) {
        feedback = "매우 잘했습니다! 조금만 더 노력하면 완벽할 거예요.";
      } else if (achievementRate >= 80) {
        feedback = "잘했습니다! 틀린 문제를 다시 한번 복습해보세요.";
      } else if (achievementRate >= 70) {
        feedback = "좋습니다! 부족한 부분을 보완하면 더 좋은 결과를 얻을 수 있어요.";
      } else if (achievementRate >= 60) {
        feedback = "조금 더 노력이 필요합니다. 기본 개념을 다시 복습해보세요.";
      } else {
        feedback = "기초부터 다시 학습하는 것을 권장합니다.";
      }

      const result = await storage.createTestResult({
        studentId,
        studentName,
        textbook: TEXTBOOK_NAME,
        unit,
        achievementRate,
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        feedback,
        answers: JSON.stringify(answers),
      });

      // Try to write to Google Sheets (optional, doesn't fail if unsuccessful)
      const dbSetting = await storage.getSetting("GOOGLE_SPREADSHEET_ID");
      const spreadsheetId = dbSetting?.value || process.env.GOOGLE_SPREADSHEET_ID;
      let sheetWriteSuccess = false;
      let sheetError = null;
      
      if (spreadsheetId) {
        try {
          await writeResultToSheet(spreadsheetId, result);
          sheetWriteSuccess = true;
          console.log(`✅ Successfully wrote to Google Sheets for ${studentId}`);
        } catch (err: any) {
          sheetError = err.message;
          console.error(`❌ Failed to write to Google Sheets for ${studentId}:`, err.message);
        }
      } else {
        console.warn('⚠️ GOOGLE_SPREADSHEET_ID not configured - skipping sheet write');
      }

      return res.json({
        score: correctAnswers,
        totalQuestions,
        correctAnswers,
        achievementRate,
        feedback,
        details,
        unit,
        sheetWriteSuccess,
        sheetError,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "시험 제출 중 오류가 발생했습니다.",
      });
    }
  });

  // Get student results
  app.get("/api/results/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const results = await storage.getTestResultsByStudent(studentId);
      return res.json(results);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "성적을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Sync students from Google Sheets
  app.post("/api/sync-students", async (req, res) => {
    try {
      const dbSetting = await storage.getSetting("GOOGLE_SPREADSHEET_ID");
      const spreadsheetId = dbSetting?.value || process.env.GOOGLE_SPREADSHEET_ID;
      
      if (!spreadsheetId) {
        return res.status(400).json({
          message: "GOOGLE_SPREADSHEET_ID가 설정되지 않았습니다. 관리자 페이지에서 구글 시트 ID를 설정해주세요.",
        });
      }

      const studentsFromSheet = await readStudentsFromSheet(spreadsheetId);
      
      if (studentsFromSheet.length === 0) {
        return res.json({
          message: "구글 시트에서 학생 정보를 찾을 수 없습니다.",
          added: 0,
          skipped: 0,
        });
      }

      let added = 0;
      let skipped = 0;

      for (const student of studentsFromSheet) {
        if (!student.studentId || !student.studentName) {
          skipped++;
          continue;
        }

        const existing = await storage.getStudentById(student.studentId);
        if (!existing) {
          await storage.createStudent({
            studentId: student.studentId,
            studentName: student.studentName,
            grade: student.grade || '',
            phone: student.phone || '',
          });
          added++;
        } else {
          skipped++;
        }
      }

      return res.json({
        message: `구글 시트 동기화 완료: ${added}명 추가, ${skipped}명 건너뜀`,
        added,
        skipped,
        total: studentsFromSheet.length,
      });
    } catch (error: any) {
      console.error('Sync students error:', error);
      return res.status(500).json({
        message: error.message || "학생 동기화 중 오류가 발생했습니다.",
      });
    }
  });

  // Initialize sample data endpoint (for development/testing)
  app.post("/api/init-data", async (req, res) => {
    try {
      // Check if questions already exist
      const existingQuestions = await storage.getAllQuestions();
      if (existingQuestions.length > 0) {
        return res.json({
          message: "데이터가 이미 존재합니다.",
          questionCount: existingQuestions.length,
        });
      }

      // Parse the CSV data from the attached file
      const fs = await import('fs');
      const path = await import('path');
      
      const csvPath = path.join(process.cwd(), 'attached_assets', 'Pasted---1762844187289_1762844187289.txt');
      
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({
          message: "답안 파일을 찾을 수 없습니다.",
        });
      }

      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n');
      
      // Find the start of CSV data (starts with "문제ID,단원명,유형,정답")
      let startIndex = lines.findIndex(line => line.includes('문제ID,단원명,유형,정답'));
      
      if (startIndex === -1) {
        return res.status(400).json({
          message: "CSV 데이터 시작점을 찾을 수 없습니다.",
        });
      }

      const questions = [];
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 4) {
          questions.push({
            questionId: parts[0].trim(),
            unit: parts[1].trim(),
            type: parts[2].trim(),
            answer: parts[3].trim().replace(/^"/, '').replace(/"$/, ''),
            textbook: TEXTBOOK_NAME,
          });
        }
      }

      if (questions.length > 0) {
        await storage.createManyQuestions(questions);
      }

      return res.json({
        message: "데이터 초기화 완료",
        questionCount: questions.length,
      });
    } catch (error: any) {
      console.error('Init data error:', error);
      return res.status(500).json({
        message: error.message || "데이터 초기화 중 오류가 발생했습니다.",
      });
    }
  });

  // Admin API endpoints
  const ADMIN_PASSWORD = "3721";

  // Admin login
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

  // Get all test results from Google Sheets (admin only)
  app.get("/api/admin/all-results", async (req, res) => {
    try {
      const dbSetting = await storage.getSetting("GOOGLE_SPREADSHEET_ID");
      const spreadsheetId = dbSetting?.value || process.env.GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        return res.status(400).json({
          message: "GOOGLE_SPREADSHEET_ID가 설정되지 않았습니다.",
        });
      }

      const resultsFromSheet = await readResultsFromSheet(spreadsheetId);
      return res.json(resultsFromSheet);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "성적 데이터를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get unit statistics with wrong answer analysis from Google Sheets (admin only)
  app.get("/api/admin/unit-stats/:unit", async (req, res) => {
    try {
      const { unit } = req.params;
      const decodedUnit = decodeURIComponent(unit);
      
      const dbSetting = await storage.getSetting("GOOGLE_SPREADSHEET_ID");
      const spreadsheetId = dbSetting?.value || process.env.GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        return res.status(400).json({
          message: "GOOGLE_SPREADSHEET_ID가 설정되지 않았습니다.",
        });
      }

      // Get aggregated question statistics from Google Sheets
      console.log(`[Admin Stats] Reading question stats for unit: ${decodedUnit}`);
      const questionStatsFromSheet = await readQuestionStats(spreadsheetId, decodedUnit);
      
      // Count unique students (approximate - based on total attempts)
      const totalAttempts = questionStatsFromSheet.reduce((sum, stat) => sum + stat.totalAttempts, 0);
      const avgAttemptsPerQuestion = questionStatsFromSheet.length > 0 
        ? totalAttempts / questionStatsFromSheet.length 
        : 0;
      const estimatedStudents = Math.round(avgAttemptsPerQuestion);
      
      // Format for frontend
      const questionStats = questionStatsFromSheet.map(stat => ({
        questionId: stat.questionId,
        correctAnswer: stat.correctAnswer,
        totalAttempts: stat.totalAttempts,
        wrongAttempts: stat.wrongAttempts,
        answerDistribution: stat.answerDistribution,
        wrongRate: stat.totalAttempts > 0 
          ? Math.round((stat.wrongAttempts / stat.totalAttempts) * 100)
          : 0,
      }));

      // Sort by wrong rate (highest first)
      questionStats.sort((a, b) => b.wrongRate - a.wrongRate);

      console.log(`[Admin Stats] Found ${questionStats.length} questions with stats`);

      return res.json({
        unit: decodedUnit,
        totalQuestions: questionStats.length,
        totalStudents: estimatedStudents,
        questionStats,
      });
    } catch (error: any) {
      console.error(`[Admin Stats] Error:`, error);
      return res.status(500).json({
        message: error.message || "통계 데이터를 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Get all students (admin only)
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

  // Get Google Sheets ID setting (admin only)
  app.get("/api/admin/settings/spreadsheet-id", async (req, res) => {
    try {
      const setting = await storage.getSetting("GOOGLE_SPREADSHEET_ID");
      const envSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      
      return res.json({
        value: setting?.value || envSpreadsheetId || "",
        source: setting?.value ? "database" : (envSpreadsheetId ? "environment" : "none"),
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "설정을 불러오는 중 오류가 발생했습니다.",
      });
    }
  });

  // Set Google Sheets ID setting (admin only)
  app.post("/api/admin/settings/spreadsheet-id", async (req, res) => {
    try {
      const { value } = req.body;
      
      if (!value || typeof value !== "string") {
        return res.status(400).json({
          message: "유효한 구글 시트 ID를 입력해주세요.",
        });
      }

      await storage.setSetting("GOOGLE_SPREADSHEET_ID", value.trim());
      
      return res.json({
        success: true,
        message: "구글 시트 ID가 저장되었습니다.",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "설정을 저장하는 중 오류가 발생했습니다.",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
