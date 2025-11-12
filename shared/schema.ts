import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  studentName: text("student_name").notNull(),
  grade: text("grade").notNull(),
  phone: varchar("phone", { length: 20 }),
});

export const studentsRelations = relations(students, ({ many }) => ({
  testResults: many(testResults),
}));

// Questions table (answer key)
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionId: varchar("question_id", { length: 20 }).notNull().unique(),
  unit: text("unit").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  answer: text("answer").notNull(),
  textbook: text("textbook").notNull().default("물리학 프리미엄"),
});

// Test results table
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id", { length: 50 }).notNull(),
  studentName: text("student_name").notNull(),
  textbook: text("textbook").notNull(),
  unit: text("unit").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  achievementRate: integer("achievement_rate").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  feedback: text("feedback"),
  answers: text("answers").notNull(), // JSON string of student answers
});

export const testResultsRelations = relations(testResults, ({ one }) => ({
  student: one(students, {
    fields: [testResults.studentId],
    references: [students.studentId],
  }),
}));

// Settings table for app configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  submittedAt: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

// Additional schemas for API
export const studentAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});

export type StudentAnswer = z.infer<typeof studentAnswerSchema>;

export const submitTestSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  unit: z.string(),
  answers: z.array(studentAnswerSchema),
});

export type SubmitTest = z.infer<typeof submitTestSchema>;

export const loginSchema = z.object({
  studentId: z.string().min(1, "학생 ID를 입력해주세요"),
  studentName: z.string().min(1, "이름을 입력해주세요"),
});

export type Login = z.infer<typeof loginSchema>;

// Constants
export const units = [
  "돌림힘 평형과 안정성",
  "운동의 기술",
  "운동 법칙",
  "운동량&충격량",
  "역학적 에너지",
  "열과 에너지 & 열효율",
  "전기장과 전위차",
  "물질의 자성 & 전류의 자기작용",
  "전자기 유도",
  "빛과 물질의 이중성",
  "에너지 준위와 스펙트럼",
  "에너지띠와 반도체",
  "상대성 원리",
] as const;

export type Unit = typeof units[number];

export const TEXTBOOK_NAME = "물리학 프리미엄";
