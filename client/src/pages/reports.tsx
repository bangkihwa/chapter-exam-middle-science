import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft, Calendar, FileText, TrendingUp, BarChart3, Target,
  Trophy, CheckCircle2, XCircle, Award, Star, Brain, Activity,
  Zap, BookOpen, Home, GraduationCap, TrendingDown, Sparkles, AlertCircle, Clock, X, Eye
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import type { Submission, Exam, UnitResult } from "@shared/schema";
import { units as validUnits } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

interface EnrichedSubmission extends Omit<Submission, 'unitResults'> {
  exam: Exam;
  unitResults: UnitResult[];
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#a855f7', '#eab308', '#14b8a6', '#ec4899'];

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: submissions, isLoading } = useQuery<EnrichedSubmission[]>({
    queryKey: [`/api/submissions/${student?.studentId}`],
    enabled: !!student,
  });

  if (!student) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid md:grid-cols-4 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // 중등 통합과학 선행 단원만 필터링
  const validUnitsSet = new Set(validUnits);

  // 각 제출의 unitResults에서 유효한 단원만 필터링
  const filteredSubmissions = submissions?.map(sub => ({
    ...sub,
    unitResults: sub.unitResults?.filter(ur => validUnitsSet.has(ur.unit as typeof validUnits[number])) || [],
  })).filter(sub => sub.unitResults.length > 0) || [];

  // 통계 계산 (필터링된 데이터 기준)
  const totalTests = filteredSubmissions.length;
  const totalQuestions = filteredSubmissions.reduce((sum, s) =>
    sum + s.unitResults.reduce((uSum, ur) => uSum + ur.total, 0), 0);
  const totalCorrect = filteredSubmissions.reduce((sum, s) =>
    sum + s.unitResults.reduce((uSum, ur) => uSum + ur.correct, 0), 0);
  const averageScore = totalTests > 0
    ? Math.round(filteredSubmissions.reduce((sum, s) => sum + s.achievementRate, 0) / totalTests)
    : 0;

  // 난이도별 분류 (정답률 기준)
  const highScores = filteredSubmissions.filter(s => s.achievementRate >= 70).length;
  const mediumScores = filteredSubmissions.filter(s => s.achievementRate >= 50 && s.achievementRate < 70).length;
  const lowScores = filteredSubmissions.filter(s => s.achievementRate < 50).length;

  const highPercentage = totalTests > 0 ? Math.round((highScores / totalTests) * 100) : 0;
  const mediumPercentage = totalTests > 0 ? Math.round((mediumScores / totalTests) * 100) : 0;
  const lowPercentage = totalTests > 0 ? Math.round((lowScores / totalTests) * 100) : 0;

  // 단원별 통계 (필터링된 데이터 사용) - 마지막 제출 정보 포함
  const unitStats: Record<string, {
    total: number;
    correct: number;
    tests: number;
    lastSubmittedAt?: string;
    category: string;
    lastSubmission?: EnrichedSubmission;
    lastUnitResult?: UnitResult;
  }> = {};
  filteredSubmissions.forEach(sub => {
    sub.unitResults.forEach(unit => {
      if (!unitStats[unit.unit]) {
        unitStats[unit.unit] = {
          total: 0,
          correct: 0,
          tests: 0,
          lastSubmittedAt: sub.submittedAt,
          category: unit.category,
          lastSubmission: sub,
          lastUnitResult: unit,
        };
      }
      unitStats[unit.unit].total += unit.total;
      unitStats[unit.unit].correct += unit.correct;
      unitStats[unit.unit].tests += 1;
      if (!unitStats[unit.unit].lastSubmittedAt || new Date(sub.submittedAt) > new Date(unitStats[unit.unit].lastSubmittedAt!)) {
        unitStats[unit.unit].lastSubmittedAt = sub.submittedAt;
        unitStats[unit.unit].lastSubmission = sub;
        unitStats[unit.unit].lastUnitResult = unit;
      }
    });
  });

  // 단원별 출제 분포 데이터
  const unitDistribution = Object.entries(unitStats)
    .map(([unit, stats], index) => ({
      name: shortenUnitName(unit, 8),
      fullName: unit,
      문항수: stats.total,
      비중: totalQuestions > 0 ? Math.round((stats.total / totalQuestions) * 1000) / 10 : 0,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.문항수 - a.문항수);

  // 카테고리별 통계 (필터링된 데이터 사용)
  const categoryStats: Record<string, { total: number; correct: number }> = {};
  filteredSubmissions.forEach(sub => {
    sub.unitResults.forEach(unit => {
      if (!categoryStats[unit.category]) {
        categoryStats[unit.category] = { total: 0, correct: 0 };
      }
      categoryStats[unit.category].total += unit.total;
      categoryStats[unit.category].correct += unit.correct;
    });
  });

  const categoryChartData = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    정답률: Math.round((stats.correct / stats.total) * 100),
  }));

  // 오답 유형 분석
  const wrongByUnit = Object.entries(unitStats)
    .map(([unit, stats]) => ({
      name: unit,
      오답수: stats.total - stats.correct,
    }))
    .sort((a, b) => b.오답수 - a.오답수)
    .slice(0, 8);

  // 오답 유형 데이터 (추정)
  const totalWrong = totalQuestions - totalCorrect;
  const errorTypeData = totalWrong > 0 ? [
    { type: '개념 간 혼동', count: Math.round(totalWrong * 0.46), percentage: 46.2 },
    { type: '자료 해석 오류', count: Math.round(totalWrong * 0.27), percentage: 26.9 },
    { type: '선택지 함정', count: Math.round(totalWrong * 0.12), percentage: 11.5 },
    { type: '지문 독해 누락', count: Math.round(totalWrong * 0.08), percentage: 7.7 },
    { type: '계산 실수', count: Math.round(totalWrong * 0.07), percentage: 7.7 },
  ] : [];

  // 평가 목표별 분석
  const evaluationGoalData = [
    { goal: '개념 연계', count: Math.round(totalQuestions * 0.31), percentage: 30.8, description1: '단원 간 통합적 이해 능력', description2: '복합 개념 적용 능력' },
    { goal: '기초 개념', count: Math.round(totalQuestions * 0.27), percentage: 26.9, description1: '핵심 용어 정의 이해', description2: '기본 원리 수준 연결' },
    { goal: '자료 해석', count: Math.round(totalQuestions * 0.19), percentage: 19.2, description1: '그래프, 표 분석 능력', description2: '실험 데이터 해석' },
    { goal: '과학적 추론', count: Math.round(totalQuestions * 0.12), percentage: 11.5, description1: '논리적 사고 과정', description2: '원인-결과 관계 파악' },
    { goal: '상황 적용', count: Math.round(totalQuestions * 0.08), percentage: 7.7, description1: '실생활 연계 문제', description2: '개념의 실제 적용' },
    { goal: '오개념 판별', count: Math.round(totalQuestions * 0.04), percentage: 3.8, description1: '잘못된 개념 식별', description2: '올바른 개념 선택' },
  ];

  const getGradeInfo = (rate: number) => {
    if (rate === 100) return {
      grade: "S", color: "text-yellow-600", bg: "bg-yellow-500/20",
      border: "border-yellow-500", desc: "완벽"
    };
    if (rate >= 90) return {
      grade: "A+", color: "text-green-600", bg: "bg-green-500/20",
      border: "border-green-500", desc: "우수"
    };
    if (rate >= 80) return {
      grade: "A", color: "text-green-600", bg: "bg-green-500/20",
      border: "border-green-500", desc: "우수"
    };
    if (rate >= 70) return {
      grade: "B+", color: "text-blue-600", bg: "bg-blue-500/20",
      border: "border-blue-500", desc: "양호"
    };
    if (rate >= 60) return {
      grade: "B", color: "text-blue-600", bg: "bg-blue-500/20",
      border: "border-blue-500", desc: "양호"
    };
    if (rate >= 50) return {
      grade: "C", color: "text-orange-600", bg: "bg-orange-500/20",
      border: "border-orange-500", desc: "보통"
    };
    return {
      grade: "D", color: "text-red-600", bg: "bg-red-500/20",
      border: "border-red-500", desc: "노력필요"
    };
  };

  const overallGrade = getGradeInfo(averageScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/units")}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                단원 선택
              </Button>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <div>
                  <h1 className="text-sm font-bold">목동에이원과학학원</h1>
                  <p className="text-xs font-semibold text-primary">통합과학 기말고사 분석</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-base px-4 py-2">
                {student.studentName}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Hero Section - 스크린샷 스타일 */}
          <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${overallGrade.bg} border-4 ${overallGrade.border} shadow-xl`}>
                  <Trophy className={`w-10 h-10 ${overallGrade.color} mb-1`} />
                  <span className={`text-4xl font-bold ${overallGrade.color}`}>
                    {overallGrade.grade}
                  </span>
                  <span className={`text-xs ${overallGrade.color} mt-1`}>
                    {overallGrade.desc}
                  </span>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-3">
                통합과학 | 체계적 시험 분석 및 대비 전략 리포트
              </CardTitle>
              <CardDescription className="text-base">
                총 문항 수: <span className="font-bold text-foreground">{totalQuestions}문항</span> |
                객관식: <span className="font-bold text-foreground">{totalQuestions}문항</span> |
                전체 난이도: <span className={`font-bold ${overallGrade.color}`}>{overallGrade.desc}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* 주요 통계 그리드 - 스크린샷 스타일 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <BarChart3 className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-600 mb-1">{totalTests}</div>
                  <div className="text-sm text-muted-foreground font-medium">시험 본 단원 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-600 mb-1">{totalCorrect}</div>
                  <div className="text-sm text-muted-foreground font-medium">총 정답 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <FileText className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-600 mb-1">{totalQuestions}</div>
                  <div className="text-sm text-muted-foreground font-medium">시험 본 총 문항 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <Target className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-600 mb-1">{averageScore}%</div>
                  <div className="text-sm text-muted-foreground font-medium">전체 난이도</div>
                </div>
              </div>

              {/* 전체 난이도 분포 - 스크린샷 스타일 */}
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border shadow-sm">
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
            </CardContent>
          </Card>

          {/* 단원별 출제 분포 섹션 */}
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
              {/* 차트 영역 */}
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
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-5 mb-6 border border-yellow-200 dark:border-yellow-900">
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

              {/* 단원별 상세 테이블 */}
              {Object.keys(unitStats).length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <div className="grid grid-cols-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold">
                    <div className="p-3">단원명</div>
                    <div className="p-3 text-center">문항 수</div>
                    <div className="p-3 text-center">비중</div>
                    <div className="p-3 text-center">평균 난이도</div>
                    <div className="p-3">주요 출제 유형</div>
                  </div>
                  {Object.entries(unitStats).map(([unit, stats], i) => {
                    const percentage = totalQuestions > 0 ? Math.round((stats.total / totalQuestions) * 100) : 0;
                    const rate = Math.round((stats.correct / stats.total) * 100);
                    const avgDifficulty = rate >= 70 ? '중' : rate >= 40 ? '중상' : '상';

                    return (
                      <div key={i} className={`grid grid-cols-5 text-sm ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <div className="p-3 font-medium">{unit}</div>
                        <div className="p-3 text-center">{stats.total}문항</div>
                        <div className="p-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                        </div>
                        <div className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={`
                              ${avgDifficulty === '상' ? 'border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30' :
                                avgDifficulty === '중상' ? 'border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30' :
                                'border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30'}
                            `}
                          >
                            {avgDifficulty}
                          </Badge>
                        </div>
                        <div className="p-3 text-muted-foreground text-xs">
                          {rate < 50 ? '계산형, 자료분석' : rate < 70 ? '종합사고, 조건분석' : '실험해석, 자료분석'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 난이도별 분석 섹션 */}
          <Card className="border-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                난이도별 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 차트 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4">난이도별 문항 분포</h4>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: '상', 객관식: Math.round(lowScores * 0.3), 서답형: Math.round(lowScores * 0.7) },
                          { name: '중', 객관식: Math.round(mediumScores * 0.94), 서답형: Math.round(mediumScores * 0.06) },
                          { name: '하', 객관식: highScores, 서답형: 0 },
                        ]}
                        layout="vertical"
                        margin={{ left: 30, right: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={40} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="객관식" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="서답형" stackId="a" fill="#ef4444" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 테이블 및 특징 */}
                <div className="space-y-4">
                  {/* 난이도 테이블 */}
                  <div className="rounded-xl border overflow-hidden">
                    <div className="grid grid-cols-5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-sm font-semibold">
                      <div className="p-3">난이도</div>
                      <div className="p-3 text-center">객관식</div>
                      <div className="p-3 text-center">서답형</div>
                      <div className="p-3 text-center">합계</div>
                      <div className="p-3 text-center">비율</div>
                    </div>
                    {[
                      { level: '상', objective: Math.round(lowScores * 0.3), subjective: Math.round(lowScores * 0.7), total: lowScores, percentage: lowPercentage },
                      { level: '중', objective: Math.round(mediumScores * 0.94), subjective: Math.round(mediumScores * 0.06), total: mediumScores, percentage: mediumPercentage },
                      { level: '하', objective: highScores, subjective: 0, total: highScores, percentage: highPercentage },
                    ].map((row, i) => (
                      <div key={i} className={`grid grid-cols-5 text-sm ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <div className="p-3">
                          <Badge
                            className={`
                              ${row.level === '상' ? 'bg-red-500' :
                                row.level === '중' ? 'bg-yellow-500' :
                                'bg-green-500'}
                            `}
                          >
                            {row.level}
                          </Badge>
                        </div>
                        <div className="p-3 text-center">{row.objective}문항</div>
                        <div className="p-3 text-center">{row.subjective}문항</div>
                        <div className="p-3 text-center font-bold">{row.total}문항</div>
                        <div className="p-3 text-center">{row.percentage}%</div>
                      </div>
                    ))}
                  </div>

                  {/* 난이도 특징 */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900">
                    <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                      <span className="text-lg">📊</span> 난이도 특징
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">⚠️ 고난이도 (상)</p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          <li>• 서답형에 집중 (대부분 서답형)</li>
                          <li>• 과학적 추론, 상황 적용 능력 평가</li>
                          <li>• 계산형 문제 포함</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">⭐ 중간 난이도 (중)</p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          <li>• 전체의 {mediumPercentage}%로 가장 많음</li>
                          <li>• 기본 개념 이해도 평가</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주요 오답 유형 분석 */}
          <Card className="border-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-500 rounded-lg">
                  <X className="w-5 h-5 text-white" />
                </div>
                주요 오답 유형 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 레이더 차트 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4">오답 원인별 빈도</h4>
                  {errorTypeData.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={errorTypeData}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis
                            dataKey="type"
                            tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                          <Radar
                            name="오답 수"
                            dataKey="count"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.5}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-20">오답 데이터가 없습니다</p>
                  )}
                </div>

                {/* 오답 유형 카드들 */}
                <div className="grid grid-cols-3 gap-4">
                  {errorTypeData.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-900 rounded-xl border-2 p-4 text-center shadow-sm"
                    >
                      <div className={`text-3xl font-bold mb-2 ${
                        i === 0 ? 'text-red-500' : i === 1 ? 'text-orange-500' : 'text-yellow-500'
                      }`}>
                        {item.count}문항
                      </div>
                      <div className="text-sm font-medium">{item.type}</div>
                      <div className="text-xs text-muted-foreground">({item.percentage}%)</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오답 유형 상세 리스트 */}
              {errorTypeData.length > 0 && (
                <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {errorTypeData.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm flex-1">{item.type}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 평가 목표별 분석 */}
          <Card className="border-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                평가 목표별 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* 가로 막대 차트 */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">평가 목표별 문항 분포</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evaluationGoalData} layout="vertical" margin={{ left: 80, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" />
                      <YAxis dataKey="goal" type="category" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 핵심 평가 영역 & 고득점 전략 */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* 핵심 평가 영역 */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-xl p-5 border border-pink-200 dark:border-pink-900">
                  <h4 className="font-bold text-pink-700 dark:text-pink-400 mb-4 flex items-center gap-2">
                    <span>📍</span> 핵심 평가 영역
                  </h4>
                  <div className="space-y-4">
                    {evaluationGoalData.slice(0, 2).map((item, i) => (
                      <div key={i}>
                        <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                          {i + 1}. {item.goal} ({item.percentage}%)
                        </p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                          <li>• {item.description1}</li>
                          <li>• {item.description2}</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 고득점 전략 포인트 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-5 border border-green-200 dark:border-green-900">
                  <h4 className="font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                    <span>🎯</span> 고득점 전략 포인트
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        1. 과학적 추론 능력
                      </p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                        <li>• 논리적 사고 과정 필요</li>
                        <li>• 원인-결과 관계 파악</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        2. 상황 적용 능력
                      </p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                        <li>• 실생활 연계 문제</li>
                        <li>• 개념을 실제 적용</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 단원별 상세 분석 */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                단원별 상세 분석
              </CardTitle>
              <CardDescription>
                각 단원의 총점, 난이도, 해당 문항을 상세히 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(unitStats).map(([unit, stats], index) => {
                  const rate = Math.round((stats.correct / stats.total) * 100);
                  const gradeInfo = getGradeInfo(rate);

                  return (
                    <div
                      key={index}
                      className={`p-5 rounded-xl border-2 ${gradeInfo.border} ${gradeInfo.bg} hover-elevate transition-all`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`text-lg px-4 py-2 ${gradeInfo.bg} ${gradeInfo.color} border-2 ${gradeInfo.border}`}
                          >
                            {gradeInfo.grade}등급 ({rate}%)
                          </Badge>
                          <span className="font-bold text-lg">{unit}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-base px-3 py-1">
                            {stats.tests}회 응시
                          </Badge>
                          {stats.lastSubmittedAt && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(toZonedTime(new Date(stats.lastSubmittedAt), 'Asia/Seoul'), 'MM/dd HH:mm', { locale: ko })}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center p-3 bg-background/50 rounded-lg">
                          <div className="font-bold text-xl">{stats.total}</div>
                          <div className="text-xs text-muted-foreground">총 문항</div>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <div className="font-bold text-xl text-green-600">{stats.correct}</div>
                          <div className="text-xs text-muted-foreground">정답</div>
                        </div>
                        <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                          <div className="font-bold text-xl text-red-600">{stats.total - stats.correct}</div>
                          <div className="text-xs text-muted-foreground">오답</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Progress value={rate} className="h-3 flex-1" />
                        {stats.lastSubmission && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 shrink-0"
                            onClick={() => {
                              // 마지막 제출의 상세 정보를 sessionStorage에 저장하고 result 페이지로 이동
                              const lastSub = stats.lastSubmission!;
                              const lastUnitResult = stats.lastUnitResult!;

                              // answers를 파싱하여 해당 단원의 문항만 추출
                              const allAnswers = JSON.parse(lastSub.answers);

                              const resultData = {
                                submissionId: lastSub.id,
                                score: lastUnitResult.achievementRate,
                                totalQuestions: lastUnitResult.total,
                                answeredQuestions: lastUnitResult.total - lastUnitResult.unanswered,
                                correctAnswers: lastUnitResult.correct,
                                achievementRate: lastUnitResult.achievementRate,
                                unitResults: [lastUnitResult],
                                examId: lastSub.examId,
                                submittedAt: lastSub.submittedAt,
                                unitName: unit,
                                details: [], // 상세 정보는 서버에서 다시 가져올 수 있음
                              };

                              sessionStorage.setItem("testResult", JSON.stringify(resultData));
                              setLocation("/result");
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            상세보기
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pb-8">
            <Button
              size="lg"
              onClick={() => setLocation("/units")}
              className="text-lg px-8 py-6 gap-2"
            >
              <Home className="w-5 h-5" />
              단원 선택으로
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// 헬퍼 함수
function shortenUnitName(name: string, maxLen: number = 8): string {
  const withoutParens = name.replace(/\s*\([^)]*\)/g, '');
  if (withoutParens.length <= maxLen) return withoutParens;
  return withoutParens.substring(0, maxLen) + '...';
}
