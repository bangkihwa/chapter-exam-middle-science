import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Home, BarChart3, Trophy, Target, GraduationCap, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { UnitResult } from "@shared/schema";

interface ResultData {
  submissionId: number;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  achievementRate: number;
  unitResults: UnitResult[];
  details: Array<{
    questionNumber: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isMultipleAnswer: boolean;
  }>;
}

export default function ResultPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const resultData = sessionStorage.getItem("testResult");
    if (!resultData) {
      setLocation("/schools");
      return;
    }
    setResult(JSON.parse(resultData));
  }, [setLocation]);

  if (!result) {
    return null;
  }

  const isPerfect = result.correctAnswers === result.totalQuestions;
  const incorrectAnswers = result.answeredQuestions - result.correctAnswers;
  const unansweredQuestions = result.totalQuestions - result.answeredQuestions;
  
  const getGrade = (rate: number) => {
    if (rate === 100) return { grade: "S", color: "text-yellow-600", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-500" };
    if (rate >= 90) return { grade: "A+", color: "text-green-600", bgColor: "bg-green-500/20", borderColor: "border-green-500" };
    if (rate >= 80) return { grade: "A", color: "text-green-600", bgColor: "bg-green-500/20", borderColor: "border-green-500" };
    if (rate >= 70) return { grade: "B+", color: "text-blue-600", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" };
    if (rate >= 60) return { grade: "B", color: "text-blue-600", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" };
    if (rate >= 50) return { grade: "C", color: "text-orange-600", bgColor: "bg-orange-500/20", borderColor: "border-orange-500" };
    return { grade: "D", color: "text-red-600", bgColor: "bg-red-500/20", borderColor: "border-red-500" };
  };

  const gradeInfo = getGrade(result.achievementRate);

  const getStudentFeedback = (rate: number, correct: number, total: number, answered: number) => {
    if (rate === 100) {
      return {
        title: "완벽합니다!",
        message: `${total}문제를 모두 맞히셨습니다! 훌륭한 성적입니다.`,
        tips: ["이 실력을 유지하며 다음 시험도 도전해보세요!", "완벽한 이해도를 보여주셨어요!"]
      };
    } else if (rate >= 90) {
      return {
        title: "훌륭합니다!",
        message: `${answered}문제 중 ${correct}문제를 맞히셨습니다. 거의 완벽한 성적이에요!`,
        tips: ["틀린 문제만 복습하면 완벽해질 수 있어요!", "높은 성취도를 보여주셨습니다."]
      };
    } else if (rate >= 70) {
      return {
        title: "잘했습니다!",
        message: `${answered}문제 중 ${correct}문제를 맞히셨습니다. 핵심 개념을 잘 이해하고 있어요.`,
        tips: ["틀린 문제를 집중적으로 복습해보세요.", "조금만 더 노력하면 더 좋은 성적을 얻을 수 있어요!"]
      };
    } else if (rate >= 50) {
      return {
        title: "괜찮습니다!",
        message: `${answered}문제 중 ${correct}문제를 맞히셨습니다. 기본은 이해하고 있어요.`,
        tips: ["틀린 문제를 다시 풀어보며 개념을 정리하세요.", "교과서를 한 번 더 읽어보면 도움이 될 거예요."]
      };
    } else {
      return {
        title: "더 노력이 필요합니다!",
        message: `${answered}문제 중 ${correct}문제를 맞히셨습니다. 기초부터 다시 학습하세요.`,
        tips: ["선생님께 질문하고 개념을 확실히 이해하세요.", "천천히, 확실하게 기초부터 다시 학습하세요."]
      };
    }
  };

  const getTeacherFeedback = (unitResults: UnitResult[], totalRate: number) => {
    const weakUnits = unitResults.filter(u => u.achievementRate < 70 && u.total > 0);
    const strongUnits = unitResults.filter(u => u.achievementRate >= 90 && u.total > 0);
    
    const recommendations = [];
    
    if (weakUnits.length > 0) {
      recommendations.push({
        type: "weak",
        title: "보완이 필요한 단원",
        units: weakUnits.map(u => `${u.unit} (${u.achievementRate}%)`),
        action: "해당 단원의 기본 개념을 다시 설명하고 유사 문제를 풀어보세요."
      });
    }
    
    if (strongUnits.length > 0) {
      recommendations.push({
        type: "strong",
        title: "잘 이해한 단원",
        units: strongUnits.map(u => `${u.unit} (${u.achievementRate}%)`),
        action: "이 단원들은 심화 문제로 실력을 더 키울 수 있습니다."
      });
    }
    
    if (unansweredQuestions > 0) {
      recommendations.push({
        type: "unanswered",
        title: "미응답 문제",
        units: [`${unansweredQuestions}개 문제 미응답`],
        action: "시간 관리 능력을 향상시킬 필요가 있습니다."
      });
    }
    
    return recommendations;
  };

  const studentFeedback = getStudentFeedback(result.achievementRate, result.correctAnswers, result.totalQuestions, result.answeredQuestions);
  const teacherRecommendations = getTeacherFeedback(result.unitResults, result.achievementRate);

  const chartData = result.unitResults.map(unit => ({
    name: unit.unit,
    정답률: unit.achievementRate,
    맞힌문제: unit.correct,
    틀린문제: unit.wrong,
    미응답: unit.unanswered,
  }));

  const wrongQuestions = result.details
    .filter(d => !d.isCorrect && d.studentAnswer)
    .map(d => d.questionNumber)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <Card className={`border-2 shadow-2xl ${gradeInfo.borderColor}`}>
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${gradeInfo.bgColor} border-4 ${gradeInfo.borderColor}`}>
                  <Trophy className={`w-12 h-12 ${gradeInfo.color} mb-2`} />
                  <span className={`text-4xl font-bold ${gradeInfo.color}`}>
                    {gradeInfo.grade}
                  </span>
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold mb-2">
                  시험 결과
                </CardTitle>
                <div className="flex justify-center gap-4 text-lg">
                  <Badge variant="outline" className="text-base font-mono">
                    {result.achievementRate}점
                  </Badge>
                  <Badge variant="secondary" className="text-base">
                    {result.correctAnswers} / {result.answeredQuestions} 정답
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-500/10 rounded-lg border-2 border-green-500/30">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {result.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">정답</div>
                </div>

                <div className="text-center p-6 bg-red-500/10 rounded-lg border-2 border-red-500/30">
                  <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {incorrectAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">오답</div>
                </div>

                <div className="text-center p-6 bg-gray-500/10 rounded-lg border-2 border-gray-500/30">
                  <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-600 mb-1">
                    {unansweredQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">미응답</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">응답률</span>
                  <span className="text-muted-foreground">
                    {result.answeredQuestions} / {result.totalQuestions} ({Math.round((result.answeredQuestions / result.totalQuestions) * 100)}%)
                  </span>
                </div>
                <Progress 
                  value={(result.answeredQuestions / result.totalQuestions) * 100} 
                  className="h-3" 
                />
              </div>

              {wrongQuestions.length > 0 && (
                <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20">
                  <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    틀린 문제 번호
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {wrongQuestions.map(q => (
                      <Badge key={q} variant="destructive" className="text-base px-3 py-1">
                        {q}번
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" data-testid="tab-student-feedback">
                <User className="w-4 h-4 mr-2" />
                학생용 피드백
              </TabsTrigger>
              <TabsTrigger value="teacher" data-testid="tab-teacher-feedback">
                <GraduationCap className="w-4 h-4 mr-2" />
                선생님용 분석
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {studentFeedback.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">{studentFeedback.message}</p>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">학습 조언</h4>
                    <ul className="space-y-2">
                      {studentFeedback.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>단원별 성취도</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="정답률" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher" className="space-y-6 mt-6">
              {teacherRecommendations.map((rec, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {rec.type === "weak" && <XCircle className="w-5 h-5 text-red-600" />}
                      {rec.type === "strong" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {rec.type === "unanswered" && <Target className="w-5 h-5 text-gray-600" />}
                      {rec.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {rec.units.map((unit, j) => (
                        <Badge 
                          key={j} 
                          variant={rec.type === "weak" ? "destructive" : "default"}
                          className="text-sm"
                        >
                          {unit}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>지도 방안:</strong> {rec.action}
                    </p>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle>단원별 상세 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.unitResults.map((unit, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{unit.category}</Badge>
                            <span className="font-medium">{unit.unit}</span>
                          </div>
                          <Badge variant={unit.achievementRate >= 70 ? "default" : "destructive"}>
                            {unit.achievementRate}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div className="font-medium">{unit.total}</div>
                            <div className="text-xs text-muted-foreground">총문항</div>
                          </div>
                          <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                            <div className="font-medium text-green-700 dark:text-green-400">{unit.correct}</div>
                            <div className="text-xs text-muted-foreground">정답</div>
                          </div>
                          <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                            <div className="font-medium text-red-700 dark:text-red-400">{unit.wrong}</div>
                            <div className="text-xs text-muted-foreground">오답</div>
                          </div>
                          <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div className="font-medium">{unit.unanswered}</div>
                            <div className="text-xs text-muted-foreground">미응답</div>
                          </div>
                        </div>
                        <Progress value={unit.achievementRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/reports")}
              data-testid="button-view-reports"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              성적 기록 보기
            </Button>
            <Button
              size="lg"
              onClick={() => setLocation("/schools")}
              data-testid="button-home"
            >
              <Home className="w-5 h-5 mr-2" />
              학교 선택으로
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
