import { pgTable, text, varchar, integer, timestamp, serial, boolean, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Exams table (학교별 시험 정보)
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  schoolName: text("school_name").notNull(),
  year: integer("year").notNull(),
  semester: text("semester").notNull(), // "2학기 중간", "2학기 기말" 등
  subject: text("subject").notNull().default("통합과학"),
});

// Questions table (문항별 정답 정보)
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  questionNumber: integer("question_number").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "객관식" or "주관식"
  category: text("category").notNull(), // "에너지", "화학", "생태계" 등
  unit: text("unit").notNull(), // "전자기 유도", "산화-환원" 등
  answer: text("answer").notNull(), // 단일 정답 또는 복수 정답 (JSON array)
  isMultipleAnswer: boolean("is_multiple_answer").notNull().default(false),
}, (table) => ({
  uniqueQuestionPerExam: uniqueIndex("unique_question_per_exam").on(table.examId, table.questionNumber),
}));

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  studentName: text("student_name").notNull(),
  grade: text("grade").notNull(),
  phone: varchar("phone", { length: 20 }),
});

// Submissions table (학생 답안 제출 기록)
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id", { length: 50 }).notNull(),
  studentName: text("student_name").notNull(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  answers: text("answers").notNull(), // JSON string of student answers
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answeredQuestions: integer("answered_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  achievementRate: integer("achievement_rate").notNull(),
  unitResults: text("unit_results").notNull(), // JSON string of unit-wise results
});

// Settings table for app configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations - defined after all tables are declared
export const schoolsRelations = relations(schools, ({ many }) => ({
  exams: many(exams),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  school: one(schools, {
    fields: [exams.schoolId],
    references: [schools.id],
  }),
  questions: many(questions),
  submissions: many(submissions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  student: one(students, {
    fields: [submissions.studentId],
    references: [students.studentId],
  }),
  exam: one(exams, {
    fields: [submissions.examId],
    references: [exams.id],
  }),
}));

// Insert schemas
export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Additional schemas for API
export const studentAnswerSchema = z.object({
  questionNumber: z.number(),
  answer: z.string(),
});

export type StudentAnswer = z.infer<typeof studentAnswerSchema>;

export const submitTestSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  examId: z.number(),
  answers: z.array(studentAnswerSchema),
});

export type SubmitTest = z.infer<typeof submitTestSchema>;

export const loginSchema = z.object({
  studentId: z.string().min(1, "학생 ID를 입력해주세요"),
  studentName: z.string().min(1, "이름을 입력해주세요"),
});

export type Login = z.infer<typeof loginSchema>;

// Constants - 통합과학 단원 분류
export const categories = [
  "에너지",
  "화학", 
  "생태계",
  "지구",
  "생명",
  "신소재",
] as const;

export type Category = typeof categories[number];

export const units = [
  // 에너지
  "전자기 유도",
  "발전",
  "전력 수송",
  "전력 손실",
  "에너지 효율",
  // 화학
  "산화-환원",
  "산-염기",
  "원소 주기성",
  "화학 결합",
  // 생태계
  "생태계 구성",
  "생태계 평형",
  "진화와 변이",
  "생물 다양성",
  // 지구
  "지구 시스템",
  "지권 변동",
  "지질 시대",
  "대기 순환",
  "지권과 에너지",
  "지권",
  // 생명
  "생명체 구성 물질",
  "물질대사",
  "유전 정보",
  "물질",
  // 신소재
  "반도체",
  "초전도체",
  "신소재",
] as const;

export type Unit = typeof units[number];

export const SUBJECT_NAME = "통합과학";

// Unit result interface for detailed feedback
export interface UnitResult {
  category: string;
  unit: string;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  achievementRate: number;
}
