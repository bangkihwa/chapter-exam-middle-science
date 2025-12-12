import { 
  schools, 
  exams, 
  questions, 
  students, 
  submissions, 
  settings,
  type School,
  type InsertSchool,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type Student,
  type InsertStudent,
  type Submission,
  type InsertSubmission,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // School operations
  getAllSchools(): Promise<School[]>;
  getSchoolById(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  
  // Exam operations
  getAllExams(): Promise<Exam[]>;
  getExamById(id: number): Promise<Exam | undefined>;
  getExamsBySchool(schoolId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  
  // Question operations
  getQuestionsByExam(examId: number): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createManyQuestions(questions: InsertQuestion[]): Promise<void>;
  
  // Student operations
  getStudentByCredentials(studentId: string, studentName: string): Promise<Student | undefined>;
  getStudentById(studentId: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  getSubmissionsByExam(examId: number): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  
  // Delete operations
  deleteAllSubmissions(): Promise<void>;
  deleteAllQuestions(): Promise<void>;
  deleteAllExams(): Promise<void>;
  deleteAllSchools(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // School operations
  async getAllSchools(): Promise<School[]> {
    return await db.select().from(schools);
  }

  async getSchoolById(id: number): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id));
    return school || undefined;
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await db
      .insert(schools)
      .values(insertSchool)
      .returning();
    return school;
  }

  // Exam operations
  async getAllExams(): Promise<Exam[]> {
    return await db.select().from(exams);
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, id));
    return exam || undefined;
  }

  async getExamsBySchool(schoolId: number): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .where(eq(exams.schoolId, schoolId));
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(insertExam)
      .returning();
    return exam;
  }

  // Question operations
  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(questions.questionNumber);
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

  // Submission operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByExam(examId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.examId, examId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt));
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

  // Delete operations
  async deleteAllSubmissions(): Promise<void> {
    await db.delete(submissions);
  }

  async deleteAllQuestions(): Promise<void> {
    await db.delete(questions);
  }

  async deleteAllExams(): Promise<void> {
    await db.delete(exams);
  }

  async deleteAllSchools(): Promise<void> {
    await db.delete(schools);
  }
}

export const storage = new DatabaseStorage();
