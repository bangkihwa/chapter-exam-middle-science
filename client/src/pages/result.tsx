import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, XCircle, Home, BarChart3, Trophy, Target, GraduationCap,
  User, TrendingUp, Award, Zap, AlertCircle, BookOpen, Star, Brain,
  ChevronRight, Activity, FileText, Clock, PieChart as PieChartIcon, X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Cell
} from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import type { UnitResult } from "@shared/schema";
import ExamAnalysis from "@/components/exam-analysis";

interface ResultData {
  submissionId: number;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  achievementRate: number;
  unitResults: UnitResult[];
  examId: number;
  submittedAt: string;
  details: Array<{
    questionNumber: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isMultipleAnswer: boolean;
  }>;
}

interface UnitStats {
  category: string;
  unit: string;
  average: number;
  highest: number;
  studentCount: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#a855f7', '#eab308', '#14b8a6', '#ec4899'];

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

  // Fetch unit statistics
  const { data: unitStats } = useQuery<UnitStats[]>({
    queryKey: result ? [`/api/exams/${result.examId}/unit-stats`] : [],
    enabled: !!result,
  });

  if (!result) {
    return null;
  }

  const isPerfect = result.correctAnswers === result.answeredQuestions;
  const incorrectAnswers = result.answeredQuestions - result.correctAnswers;
  const unansweredQuestions = result.totalQuestions - result.answeredQuestions;

  const getGrade = (rate: number) => {
    if (rate === 100) return {
      grade: "S",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500",
      desc: "완벽"
    };
    if (rate >= 90) return {
      grade: "A+",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500",
      desc: "우수"
    };
    if (rate >= 80) return {
      grade: "A",
      color: "text-green-600 dark:text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500",
      desc: "우수"
    };
    if (rate >= 70) return {
      grade: "B+",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500",
      desc: "양호"
    };
    if (rate >= 60) return {
      grade: "B",
      color: "text-blue-600 dark:text-blue-500",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500",
      desc: "양호"
    };
    if (rate >= 50) return {
      grade: "C",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500",
      desc: "보통"
    };
    return {
      grade: "D",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500",
      desc: "노력필요"
    };
  };

  const gradeInfo = getGrade(result.achievementRate);

  const getDetailedStudentFeedback = (rate: number, unitResults: UnitResult[]) => {
    const strongUnits = unitResults.filter(u => u.achievementRate >= 80 && u.total > 0);
    const weakUnits = unitResults.filter(u => u.achievementRate < 60 && u.total > 0);
    const moderateUnits = unitResults.filter(u => u.achievementRate >= 60 && u.achievementRate < 80 && u.total > 0);

    let mainMessage = "";
    let encouragement = "";
    let specificAdvice: string[] = [];

    if (rate === 100) {
      mainMessage = "완벽한 성적입니다! 모든 문제를 정확하게 풀었어요.";
      encouragement = "탁월한 이해력과 문제 해결 능력을 보여주셨습니다. 이 실력을 계속 유지하세요!";
      specificAdvice = [
        "심화 문제나 올림피아드 문제에 도전해보세요",
        "다른 학생들에게 개념을 설명해주며 리더십을 발휘해보세요",
        "관련 과학 도서나 논문을 읽어 지식의 폭을 넓혀보세요"
      ];
    } else if (rate >= 90) {
      mainMessage = "우수한 성적입니다! 대부분의 개념을 완벽하게 이해하고 있어요.";
      encouragement = "거의 완벽에 가까운 실력입니다. 조금만 더 집중하면 만점도 가능해요!";
      specificAdvice = [
        "틀린 문제의 개념을 정확히 복습하세요",
        "유사한 유형의 문제를 추가로 풀어보세요",
        "실수를 줄이기 위해 문제를 꼼꼼히 읽는 습관을 기르세요"
      ];
    } else if (rate >= 70) {
      mainMessage = "잘했습니다! 핵심 개념을 잘 이해하고 있어요.";
      encouragement = "기본기가 탄탄합니다. 조금 더 노력하면 더 좋은 성적을 얻을 수 있어요!";
      specificAdvice = [
        "틀린 문제는 반드시 다시 풀어보세요",
        "개념 노트를 만들어 정리하는 습관을 가지세요",
        "선생님께 질문하여 부족한 부분을 보완하세요"
      ];
    } else if (rate >= 50) {
      mainMessage = "기본 개념은 이해하고 있어요. 조금 더 노력이 필요합니다.";
      encouragement = "포기하지 마세요! 꾸준히 공부하면 실력이 향상될 거예요.";
      specificAdvice = [
        "교과서를 정독하며 기본 개념을 확실히 이해하세요",
        "핵심 용어와 공식을 정리하여 암기하세요",
        "기출 문제를 반복해서 풀며 유형에 익숙해지세요"
      ];
    } else {
      mainMessage = "기초부터 차근차근 다시 학습해봐요.";
      encouragement = "어려워도 포기하지 마세요. 선생님과 함께 천천히 배워나가면 됩니다.";
      specificAdvice = [
        "선생님께 기초부터 다시 설명을 들으세요",
        "교과서의 예제 문제부터 차근차근 풀어보세요",
        "틀린 문제를 오답노트에 정리하고 반복 학습하세요"
      ];
    }

    return {
      mainMessage,
      encouragement,
      specificAdvice,
      strongUnits,
      weakUnits,
      moderateUnits
    };
  };

  const getTeacherGuidance = (unitResults: UnitResult[], totalRate: number) => {
    const weakUnits = unitResults.filter(u => u.achievementRate < 70 && u.total > 0);
    const strongUnits = unitResults.filter(u => u.achievementRate >= 90 && u.total > 0);
    const moderateUnits = unitResults.filter(u => u.achievementRate >= 70 && u.achievementRate < 90 && u.total > 0);

    const guidance = [];

    if (totalRate >= 90) {
      guidance.push({
        type: "excellent",
        icon: Trophy,
        title: "종합 평가: 우수",
        content: "학생이 전반적인 개념을 매우 잘 이해하고 있습니다.",
        action: "심화 학습 자료를 제공하여 더 깊은 탐구 활동을 유도하세요."
      });
    } else if (totalRate >= 70) {
      guidance.push({
        type: "good",
        icon: CheckCircle2,
        title: "종합 평가: 양호",
        content: "핵심 개념은 이해하고 있으나 일부 보완이 필요합니다.",
        action: "틀린 문제 위주로 개념을 재설명하고 유사 문제를 제공하세요."
      });
    } else if (totalRate >= 50) {
      guidance.push({
        type: "needs-improvement",
        icon: AlertCircle,
        title: "종합 평가: 보완 필요",
        content: "기본 개념 이해도가 부족합니다.",
        action: "기초 개념부터 차근차근 재교육이 필요합니다. 1:1 면담을 권장합니다."
      });
    } else {
      guidance.push({
        type: "critical",
        icon: XCircle,
        title: "종합 평가: 긴급 개입 필요",
        content: "학습 결손이 심각합니다. 즉각적인 지도가 필요합니다.",
        action: "학부모 상담과 함께 개별 맞춤 학습 계획을 수립하세요."
      });
    }

    if (strongUnits.length > 0) {
      guidance.push({
        type: "strength",
        icon: Star,
        title: `우수 단원 (${strongUnits.length}개)`,
        content: strongUnits.map(u => `${u.unit} (${u.achievementRate}%)`).join(", "),
        action: "이 단원들과 연계된 심화 활동이나 프로젝트 학습을 진행하세요."
      });
    }

    if (moderateUnits.length > 0) {
      guidance.push({
        type: "moderate",
        icon: Activity,
        title: `보완 가능 단원 (${moderateUnits.length}개)`,
        content: moderateUnits.map(u => `${u.unit} (${u.achievementRate}%)`).join(", "),
        action: "개념 정리 시간을 갖고, 추가 연습 문제를 제공하세요."
      });
    }

    if (weakUnits.length > 0) {
      guidance.push({
        type: "weak",
        icon: AlertCircle,
        title: `집중 지도 필요 단원 (${weakUnits.length}개)`,
        content: weakUnits.map(u => `${u.unit} (${u.achievementRate}%)`).join(", "),
        action: "기본 개념부터 재교육하고, 시각 자료와 실험을 활용한 구체적 설명이 필요합니다."
      });
    }

    if (unansweredQuestions > 0) {
      guidance.push({
        type: "time",
        icon: Target,
        title: "시험 범위 외 문제",
        content: `${unansweredQuestions}개 문제가 시험 범위에 포함되지 않았습니다.`,
        action: "학생에게 시험 범위를 명확히 안내했는지 확인하세요."
      });
    }

    return guidance;
  };

  // Filter out units with no answered questions
  const answeredUnitResults = result.unitResults.filter(unit => {
    const answered = unit.correct + unit.wrong;
    return answered > 0;
  });

  const studentFeedback = getDetailedStudentFeedback(result.achievementRate, answeredUnitResults);
  const teacherGuidance = getTeacherGuidance(answeredUnitResults, result.achievementRate);

  const shortenUnitName = (name: string, maxLen: number = 6): string => {
    const withoutParens = name.replace(/\s*\([^)]*\)/g, '');
    if (withoutParens.length <= maxLen) return withoutParens;
    return withoutParens.substring(0, maxLen) + '...';
  };

  const chartData = answeredUnitResults.map(unit => ({
    name: shortenUnitName(unit.unit),
    fullName: unit.unit,
    나의성적: unit.achievementRate,
    평균: unitStats?.find(s => s.category === unit.category && s.unit === unit.unit)?.average || 0,
    최고점: unitStats?.find(s => s.category === unit.category && s.unit === unit.unit)?.highest || 0,
  }));

  const radarData = answeredUnitResults.map(unit => ({
    unit: shortenUnitName(unit.unit, 5),
    fullName: unit.unit,
    value: unit.achievementRate,
    fullMark: 100,
  }));

  const wrongQuestions = (result.details || [])
    .filter(d => !d.isCorrect && d.studentAnswer)
    .map(d => d.questionNumber)
    .sort((a, b) => a - b);

  const unansweredList = (result.details || [])
    .filter(d => !d.studentAnswer)
    .map(d => d.questionNumber)
    .sort((a, b) => a - b);

  // 난이도별 분류 계산
  const highScores = answeredUnitResults.filter(u => u.achievementRate >= 70).length;
  const mediumScores = answeredUnitResults.filter(u => u.achievementRate >= 50 && u.achievementRate < 70).length;
  const lowScores = answeredUnitResults.filter(u => u.achievementRate < 50).length;
  const totalUnits = answeredUnitResults.length;
  const highPercentage = totalUnits > 0 ? Math.round((highScores / totalUnits) * 100) : 0;
  const mediumPercentage = totalUnits > 0 ? Math.round((mediumScores / totalUnits) * 100) : 0;
  const lowPercentage = totalUnits > 0 ? Math.round((lowScores / totalUnits) * 100) : 0;

  // 단원별 출제 분포 데이터
  const unitDistribution = answeredUnitResults
    .map((unit, index) => ({
      name: shortenUnitName(unit.unit, 8),
      fullName: unit.unit,
      문항수: unit.total,
      비중: result.totalQuestions > 0 ? Math.round((unit.total / result.totalQuestions) * 1000) / 10 : 0,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.문항수 - a.문항수);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Hero Section - 스크린샷 스타일 */}
          <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${gradeInfo.bgColor} border-4 ${gradeInfo.borderColor} shadow-xl`}>
                  <Trophy className={`w-10 h-10 ${gradeInfo.color} mb-1`} />
                  <span className={`text-4xl font-bold ${gradeInfo.color}`}>
                    {gradeInfo.grade}
                  </span>
                  <span className={`text-xs ${gradeInfo.color} mt-1`}>
                    {gradeInfo.desc}
                  </span>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-3">
                통합과학 | 체계적 시험 분석 및 대비 전략 리포트
              </CardTitle>
              <CardDescription className="text-base">
                총 문항 수: <span className="font-bold text-foreground">{result.totalQuestions}문항</span> |
                객관식: <span className="font-bold text-foreground">{result.totalQuestions}문항</span> |
                전체 난이도: <span className={`font-bold ${gradeInfo.color}`}>{gradeInfo.desc}</span>
              </CardDescription>
              {result.submittedAt && (
                <Badge variant="outline" className="mt-3 text-sm px-4 py-2">
                  <Clock className="w-4 h-4 mr-2" />
                  {format(toZonedTime(new Date(result.submittedAt), 'Asia/Seoul'), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                </Badge>
              )}
            </CardHeader>

            <CardContent>
              {/* 주요 통계 그리드 - 스크린샷 스타일 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <BarChart3 className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-600 mb-1">{answeredUnitResults.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">시험 본 단원 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-600 mb-1">{result.correctAnswers}</div>
                  <div className="text-sm text-muted-foreground font-medium">총 정답 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <FileText className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-600 mb-1">{result.totalQuestions}</div>
                  <div className="text-sm text-muted-foreground font-medium">시험 본 총 문항 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <Target className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-600 mb-1">{result.achievementRate}%</div>
                  <div className="text-sm text-muted-foreground font-medium">전체 난이도</div>
                </div>
              </div>

              {/* 전체 난이도 분포 - 스크린샷 스타일 */}
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border shadow-sm mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  전체 난이도 분포
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        하 (기본) - {highScores}문항
                      </span>
                      <span className="font-mono font-bold text-green-600">{highPercentage}%</span>
                    </div>
                    <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(highPercentage, 100)}%` }}
                      />
                      <div
                        className="absolute top-0 h-full bg-green-400 rounded-full"
                        style={{ left: `${Math.min(highPercentage, 100)}%`, width: `${highPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        중 (보통) - {mediumScores}문항
                      </span>
                      <span className="font-mono font-bold text-orange-600">{mediumPercentage}%</span>
                    </div>
                    <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(mediumPercentage * 1.5, 100)}%` }}
                      />
                      <div
                        className="absolute top-0 h-full bg-orange-300 rounded-full"
                        style={{ left: `${Math.min(mediumPercentage * 1.5, 100)}%`, width: `${mediumPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        상 (어려움) - {lowScores}문항
                      </span>
                      <span className="font-mono font-bold text-red-600">{lowPercentage}%</span>
                    </div>
                    <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(lowPercentage * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 통계 그리드 - 정답/오답/범위외 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border">
                  <div className="text-2xl font-bold">{result.totalQuestions}</div>
                  <div className="text-xs text-muted-foreground">총 문항</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                  <div className="text-xs text-muted-foreground">정답</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                  <div className="text-xs text-muted-foreground">오답</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border">
                  <div className="text-2xl font-bold">{unansweredQuestions}</div>
                  <div className="text-xs text-muted-foreground">범위 외</div>
                </div>
              </div>

              {/* 응답률 프로그레스 */}
              <div className="space-y-3 p-4 bg-card/50 rounded-xl border mb-6">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    문제 응답률
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {result.answeredQuestions} / {result.totalQuestions} ({Math.round((result.answeredQuestions / result.totalQuestions) * 100)}%)
                  </span>
                </div>
                <Progress
                  value={(result.answeredQuestions / result.totalQuestions) * 100}
                  className="h-3"
                />
              </div>

              {/* 틀린 문제 & 시험범위 외 */}
              <div className="grid md:grid-cols-2 gap-4">
                {wrongQuestions.length > 0 && result.details && result.details.length > 0 && (
                  <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2 text-lg">
                      <XCircle className="w-5 h-5" />
                      틀린 문제 ({wrongQuestions.length}개)
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.details
                        .filter(d => !d.isCorrect && d.studentAnswer)
                        .map(d => (
                          <div key={d.questionNumber} className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-base">{d.questionNumber}번</span>
                              {d.isMultipleAnswer && (
                                <Badge variant="outline" className="text-xs">복수정답</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">내 답안: </span>
                                <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                                  {d.studentAnswer}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">정답: </span>
                                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                  {d.correctAnswer}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {unansweredList.length > 0 && (
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-400 mb-3 flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5" />
                      시험범위 외 문제 ({unansweredList.length}개)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {unansweredList.map(q => (
                        <Badge key={q} variant="secondary" className="text-base px-3 py-1 font-mono">
                          {q}번
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14">
              <TabsTrigger value="student" data-testid="tab-student-feedback" className="text-lg">
                <User className="w-5 h-5 mr-2" />
                학생용 분석
              </TabsTrigger>
              <TabsTrigger value="exam-analysis" data-testid="tab-exam-analysis" className="text-lg">
                <PieChartIcon className="w-5 h-5 mr-2" />
                출제 분석
              </TabsTrigger>
              <TabsTrigger value="teacher" data-testid="tab-teacher-feedback" className="text-lg">
                <GraduationCap className="w-5 h-5 mr-2" />
                선생님용 지도안
              </TabsTrigger>
            </TabsList>

            {/* 학생용 탭 */}
            <TabsContent value="student" className="space-y-6 mt-6">
              {/* 종합 피드백 */}
              <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    종합 평가
                  </CardTitle>
                  <CardDescription className="text-base">
                    당신의 시험 결과에 대한 상세 분석입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <p className="text-xl font-semibold mb-3">{studentFeedback.mainMessage}</p>
                    <p className="text-lg text-muted-foreground">{studentFeedback.encouragement}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      맞춤 학습 조언
                    </h4>
                    <div className="grid gap-3">
                      {studentFeedback.specificAdvice.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {i + 1}
                          </div>
                          <span className="text-base pt-1">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {studentFeedback.strongUnits.length > 0 && (
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-900">
                      <h4 className="font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        우수한 단원 ({studentFeedback.strongUnits.length}개)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {studentFeedback.strongUnits.map((unit, i) => (
                          <Badge key={i} className="bg-green-600 hover:bg-green-700 text-base px-3 py-1">
                            {unit.unit} {unit.achievementRate}%
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        이 단원들은 완벽하게 이해하고 있어요!
                      </p>
                    </div>
                  )}

                  {studentFeedback.weakUnits.length > 0 && (
                    <div className="p-5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl border border-orange-200 dark:border-orange-900">
                      <h4 className="font-bold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        복습이 필요한 단원 ({studentFeedback.weakUnits.length}개)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {studentFeedback.weakUnits.map((unit, i) => (
                          <Badge key={i} variant="destructive" className="text-base px-3 py-1">
                            {unit.unit} {unit.achievementRate}%
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        이 단원들을 집중적으로 복습하면 성적이 크게 향상될 거예요!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 단원별 출제 분포 - 새로운 스타일 */}
              <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    단원별 출제 분포
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-4">단원별 문항 수 및 비중</h4>
                    {unitDistribution.length > 0 ? (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={unitDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                              dataKey="name"
                              angle={-35}
                              textAnchor="end"
                              height={80}
                              tick={{ fontSize: 11 }}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-background border rounded-lg shadow-lg p-3">
                                      <p className="font-semibold text-sm">{data.fullName}</p>
                                      <p className="text-sm text-muted-foreground">{data.문항수}문항 ({data.비중}%)</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="문항수" radius={[8, 8, 0, 0]}>
                              {unitDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-20">데이터가 없습니다</p>
                    )}
                  </div>

                  {/* 출제 경향 분석 */}
                  {unitDistribution.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-900">
                      <h4 className="font-bold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                        <span className="text-lg">⭐</span> 출제 경향 분석
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {unitDistribution.slice(0, 3).map((unit, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-yellow-600">•</span>
                            <span>
                              <strong className="text-yellow-700 dark:text-yellow-400">{unit.fullName}</strong>
                              {i === 0 ? '이' : '와'} 전체의 {unit.비중}%로 {i === 0 ? '가장 많이' : ''} 출제 ({unit.문항수}문항)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 레이더 차트 - 새로운 스타일 */}
              <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-cyan-500 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    영역별 밸런스 분석
                  </CardTitle>
                  <CardDescription>
                    각 단원의 균형 잡힌 학습 정도를 시각화했습니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis
                          dataKey="unit"
                          tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                        />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="나의 성취도"
                          dataKey="value"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              return payload[0].payload.fullName;
                            }
                            return label;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 단원별 상세 분석 - 새로운 스타일 */}
              <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    단원별 상세 분석
                  </CardTitle>
                  <CardDescription>
                    각 단원의 세부 성적과 전체 통계를 확인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {answeredUnitResults.map((unit, i) => {
                      const stats = unitStats?.find(s => s.unit === unit.unit);
                      const myScore = unit.achievementRate;
                      const avgScore = stats?.average || 0;
                      const highScore = stats?.highest || 0;

                      const isAboveAvg = myScore >= avgScore;
                      const gradeInfo = getGrade(myScore);

                      return (
                        <div key={i} className="p-5 rounded-xl border-2 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-base px-3 py-1">
                                {unit.category}
                              </Badge>
                              <span className="font-bold text-lg">{unit.unit}</span>
                            </div>
                            <Badge
                              className={`text-lg px-4 py-2 font-mono ${gradeInfo.bgColor} ${gradeInfo.color} border ${gradeInfo.borderColor}`}
                            >
                              {unit.achievementRate}%
                            </Badge>
                          </div>

                          {/* 성적 비교 */}
                          {stats && (
                            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">나의 성적</div>
                                  <div className={`text-xl font-bold ${isAboveAvg ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {myScore}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">전체 평균</div>
                                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {avgScore}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">최고 성적</div>
                                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {highScore}%
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-center text-muted-foreground">
                                {isAboveAvg
                                  ? "평균보다 높은 성적이에요!"
                                  : "평균보다 조금 더 노력이 필요해요!"}
                              </div>
                            </div>
                          )}

                          {/* 문제 통계 */}
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <div className="font-bold text-lg">{unit.total}</div>
                              <div className="text-xs text-muted-foreground">총 문항</div>
                            </div>
                            <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="font-bold text-lg text-green-700 dark:text-green-400">{unit.correct}</div>
                              <div className="text-xs text-muted-foreground">정답</div>
                            </div>
                            <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="font-bold text-lg text-red-700 dark:text-red-400">{unit.wrong}</div>
                              <div className="text-xs text-muted-foreground">오답</div>
                            </div>
                            <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <div className="font-bold text-lg">{unit.unanswered}</div>
                              <div className="text-xs text-muted-foreground">범위 외</div>
                            </div>
                          </div>

                          <Progress value={unit.achievementRate} className="h-3 mt-4" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 출제 분석 탭 */}
            <TabsContent value="exam-analysis" className="space-y-6 mt-6">
              <ExamAnalysis
                unitResults={result.unitResults}
                details={result.details || []}
                totalQuestions={result.totalQuestions}
                correctAnswers={result.correctAnswers}
              />
            </TabsContent>

            {/* 선생님용 탭 */}
            <TabsContent value="teacher" className="space-y-6 mt-6">
              {/* 종합 지도안 */}
              {teacherGuidance.map((guide, i) => (
                <Card key={i} className="border-2 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 border-b">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <guide.icon className="w-6 h-6" />
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-5 bg-muted/50 rounded-xl">
                      <p className="text-lg mb-2 font-medium">관찰 내용</p>
                      <p className="text-base text-muted-foreground">{guide.content}</p>
                    </div>
                    <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                      <p className="text-lg mb-2 font-medium flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-primary" />
                        추천 지도 방안
                      </p>
                      <p className="text-base">{guide.action}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 단원별 상세 지도 가이드 */}
              <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    단원별 지도 가이드
                  </CardTitle>
                  <CardDescription>
                    각 단원에 대한 맞춤형 교육 방안
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {answeredUnitResults.map((unit, i) => {
                      const stats = unitStats?.find(s => s.unit === unit.unit);
                      let teachingTips: string[] = [];
                      let urgency = "";

                      if (unit.achievementRate >= 90) {
                        urgency = "심화";
                        teachingTips = [
                          "심화 문제와 응용 문제를 제공하세요",
                          "실험 설계나 프로젝트 활동을 진행하세요",
                          "다른 학생의 멘토 역할을 맡겨보세요"
                        ];
                      } else if (unit.achievementRate >= 70) {
                        urgency = "보완";
                        teachingTips = [
                          "틀린 문제 위주로 개념을 재정리하세요",
                          "유사 문제를 추가로 제공하세요",
                          "소그룹 활동으로 개념을 강화하세요"
                        ];
                      } else if (unit.achievementRate >= 50) {
                        urgency = "집중";
                        teachingTips = [
                          "기본 개념부터 차근차근 재설명하세요",
                          "시각 자료와 실험을 활용하세요",
                          "1:1 보충 학습을 진행하세요"
                        ];
                      } else {
                        urgency = "긴급";
                        teachingTips = [
                          "학부모 상담이 필요합니다",
                          "개별 맞춤 학습 계획을 수립하세요",
                          "기초부터 완전히 재교육하세요"
                        ];
                      }

                      return (
                        <div
                          key={i}
                          className={`p-5 rounded-xl border-2 ${
                            unit.achievementRate >= 90 ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' :
                            unit.achievementRate >= 70 ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800' :
                            unit.achievementRate >= 50 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800' :
                            'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-base px-3 py-1">
                                {unit.category}
                              </Badge>
                              <span className="font-bold text-lg">{unit.unit}</span>
                              <Badge variant={
                                urgency === "심화" ? "default" :
                                urgency === "보완" ? "secondary" :
                                urgency === "집중" ? "outline" :
                                "destructive"
                              }>
                                {urgency} 필요
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{unit.achievementRate}%</div>
                              {stats && (
                                <div className="text-xs text-muted-foreground">
                                  평균: {stats.average}% | 최고: {stats.highest}%
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="font-semibold text-sm">지도 방안:</p>
                            {teachingTips.map((tip, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm pl-4">
                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                            <div className="text-center p-2 bg-background/50 rounded">
                              <div className="font-semibold">{unit.total}</div>
                              <div className="text-muted-foreground">총</div>
                            </div>
                            <div className="text-center p-2 bg-background/50 rounded">
                              <div className="font-semibold text-green-600 dark:text-green-400">{unit.correct}</div>
                              <div className="text-muted-foreground">정답</div>
                            </div>
                            <div className="text-center p-2 bg-background/50 rounded">
                              <div className="font-semibold text-red-600 dark:text-red-400">{unit.wrong}</div>
                              <div className="text-muted-foreground">오답</div>
                            </div>
                            <div className="text-center p-2 bg-background/50 rounded">
                              <div className="font-semibold">{unit.unanswered}</div>
                              <div className="text-muted-foreground">범위외</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pb-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/reports")}
              data-testid="button-view-reports"
              className="text-lg px-6 py-6"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              전체 성적 기록
            </Button>
            <Button
              size="lg"
              onClick={() => setLocation("/units")}
              data-testid="button-home"
              className="text-lg px-6 py-6"
            >
              <Home className="w-5 h-5 mr-2" />
              단원 선택으로
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
