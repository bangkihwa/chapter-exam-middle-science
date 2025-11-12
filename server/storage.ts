import { students, questions, testResults, settings, type Student, type InsertStudent, type Question, type InsertQuestion, type TestResult, type InsertTestResult, type Setting, type InsertSetting } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Student operations
  getStudentByCredentials(studentId: string, studentName: string): Promise<Student | undefined>;
  getStudentById(studentId: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Question operations
  getQuestionsByUnit(unit: string): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createManyQuestions(questions: InsertQuestion[]): Promise<void>;
  
  // Test result operations
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getTestResultsByStudent(studentId: string): Promise<TestResult[]>;
  getTestResultsByUnit(unit: string): Promise<TestResult[]>;
  getAllTestResults(): Promise<TestResult[]>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
}

export class DatabaseStorage implements IStorage {
  // Student operations
  async getStudentByCredentials(studentId: string, studentName: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.studentId, studentId), eq(students.studentName, studentName)));
    return student || undefined;
  }

  async getStudentById(studentId: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.studentId, studentId));
    return student || undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  // Question operations
  async getQuestionsByUnit(unit: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.unit, unit));
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async createManyQuestions(insertQuestions: InsertQuestion[]): Promise<void> {
    if (insertQuestions.length > 0) {
      await db.insert(questions).values(insertQuestions);
    }
  }

  // Test result operations
  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const [result] = await db
      .insert(testResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getTestResultsByStudent(studentId: string): Promise<TestResult[]> {
    return await db
      .select()
      .from(testResults)
      .where(eq(testResults.studentId, studentId))
      .orderBy(desc(testResults.submittedAt));
  }

  async getTestResultsByUnit(unit: string): Promise<TestResult[]> {
    return await db
      .select()
      .from(testResults)
      .where(eq(testResults.unit, unit))
      .orderBy(desc(testResults.submittedAt));
  }

  async getAllTestResults(): Promise<TestResult[]> {
    return await db
      .select()
      .from(testResults)
      .orderBy(desc(testResults.submittedAt));
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return created;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
}

export const storage = new DatabaseStorage();
