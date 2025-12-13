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
  Zap, BookOpen, Home, GraduationCap, TrendingDown, Sparkles, AlertCircle, Clock
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import type { Submission, Exam, UnitResult } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

interface EnrichedSubmission extends Omit<Submission, 'unitResults'> {
  exam: Exam;
  unitResults: UnitResult[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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

  // 통계 계산
  const totalTests = submissions?.length || 0;
  const totalQuestions = submissions?.reduce((sum, s) => sum + s.totalQuestions, 0) || 0;
  const totalCorrect = submissions?.reduce((sum, s) => sum + s.correctAnswers, 0) || 0;
  const averageScore = totalTests > 0
    ? Math.round(submissions!.reduce((sum, s) => sum + s.achievementRate, 0) / totalTests)
    : 0;

  // 난이도별 분류
  const highScores = submissions?.filter(s => s.achievementRate >= 70).length || 0;
  const mediumScores = submissions?.filter(s => s.achievementRate >= 50 && s.achievementRate < 70).length || 0;
  const lowScores = submissions?.filter(s => s.achievementRate < 50).length || 0;

  const highPercentage = totalTests > 0 ? Math.round((highScores / totalTests) * 100) : 0;
  const mediumPercentage = totalTests > 0 ? Math.round((mediumScores / totalTests) * 100) : 0;
  const lowPercentage = totalTests > 0 ? Math.round((lowScores / totalTests) * 100) : 0;

  // 단원별 통계
  const unitStats: Record<string, { total: number; correct: number; tests: number; lastSubmittedAt?: string }> = {};
  submissions?.forEach(sub => {
    sub.unitResults?.forEach(unit => {
      if (!unitStats[unit.unit]) {
        unitStats[unit.unit] = { total: 0, correct: 0, tests: 0, lastSubmittedAt: sub.submittedAt };
      }
      unitStats[unit.unit].total += unit.total;
      unitStats[unit.unit].correct += unit.correct;
      unitStats[unit.unit].tests += 1;
      // 가장 최근 응시 시간으로 업데이트
      if (!unitStats[unit.unit].lastSubmittedAt || new Date(sub.submittedAt) > new Date(unitStats[unit.unit].lastSubmittedAt!)) {
        unitStats[unit.unit].lastSubmittedAt = sub.submittedAt;
      }
    });
  });

  const unitChartData = Object.entries(unitStats)
    .map(([unit, stats]) => ({
      name: unit.length > 10 ? unit.substring(0, 10) + '...' : unit,
      fullName: unit,
      정답률: Math.round((stats.correct / stats.total) * 100),
      시험횟수: stats.tests,
    }))
    .sort((a, b) => b.정답률 - a.정답률)
    .slice(0, 8);

  // 난이도 파이 차트 데이터
  const difficultyData = [
    { name: '하 (기본)', value: highScores, percentage: highPercentage, color: '#10b981' },
    { name: '중 (보통)', value: mediumScores, percentage: mediumPercentage, color: '#f59e0b' },
    { name: '상 (어려움)', value: lowScores, percentage: lowPercentage, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // 시간별 성적 추이
  const timelineData = submissions?.slice().reverse().map((sub, idx) => ({
    name: `${idx + 1}차`,
    fullName: `${format(new Date(sub.submittedAt), 'M월 d일', { locale: ko })}`,
    점수: sub.achievementRate,
    정답수: sub.correctAnswers,
  })) || [];

  // 카테고리별 통계
  const categoryStats: Record<string, { total: number; correct: number }> = {};
  submissions?.forEach(sub => {
    sub.unitResults?.forEach(unit => {
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
        <div className="space-y-6">
          {/* Hero Section */}
          <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-gray-800 dark:to-accent/10">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${overallGrade.bg} border-4 ${overallGrade.border} shadow-xl`}>
                  <Trophy className={`w-12 h-12 ${overallGrade.color} mb-1`} />
                  <span className={`text-4xl font-bold ${overallGrade.color}`}>
                    {overallGrade.grade}
                  </span>
                  <span className={`text-xs ${overallGrade.color} mt-1`}>
                    {overallGrade.desc}
                  </span>
                </div>
              </div>
              <CardTitle className="text-4xl font-bold mb-3">
                {student.grade} | 체계적 시험 분석 및 대비 전략 리포트
              </CardTitle>
              <CardDescription className="text-lg">
                총 문항 수: <span className="font-bold text-foreground">{totalQuestions}문항</span> |
                객관식: <span className="font-bold text-foreground">{totalQuestions}문항</span> |
                전체 난이도: <span className={`font-bold ${overallGrade.color}`}>{overallGrade.desc}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* 주요 통계 그리드 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border-2 border-blue-500/30 hover-elevate">
                  <BarChart3 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-600 mb-1">{totalTests}</div>
                  <div className="text-sm text-muted-foreground font-medium">시험 본 단원 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border-2 border-green-500/30 hover-elevate">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-600 mb-1">{totalCorrect}</div>
                  <div className="text-sm text-muted-foreground font-medium">총 정답 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border-2 border-purple-500/30 hover-elevate">
                  <FileText className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-600 mb-1">{totalQuestions}</div>
                  <div className="text-sm text-muted-foreground font-medium">시험 본 총 문항 수</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border-2 border-orange-500/30 hover-elevate">
                  <Target className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-600 mb-1">{averageScore}%</div>
                  <div className="text-sm text-muted-foreground font-medium">전체 난이도</div>
                </div>
              </div>

              {/* 전체 난이도 분포 */}
              <div className="p-6 bg-card/50 rounded-xl border-2">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  전체 난이도 분포
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        하 (기본) - {highScores}문항
                      </span>
                      <span className="font-mono font-bold text-green-600">{highPercentage}%</span>
                    </div>
                    <Progress value={highPercentage} className="h-3 bg-green-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        중 (보통) - {mediumScores}문항
                      </span>
                      <span className="font-mono font-bold text-orange-600">{mediumPercentage}%</span>
                    </div>
                    <Progress value={mediumPercentage} className="h-3 bg-orange-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        상 (어려움) - {lowScores}문항
                      </span>
                      <span className="font-mono font-bold text-red-600">{lowPercentage}%</span>
                    </div>
                    <Progress value={lowPercentage} className="h-3 bg-red-100" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 시험 구성 분석 */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                시험 구성 분석
              </CardTitle>
              <CardDescription>
                단원별, 문제 유형별, 출제 경향을 시각적으로 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 단원별 출제 비중 */}
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    단원별 출제 비중
                  </h3>
                  {difficultyData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={difficultyData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name.split(' ')[0]} ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {difficultyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-20">데이터가 없습니다</p>
                  )}
                </div>

                {/* 문제 유형별 분포 */}
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    문제 유형별 분포
                  </h3>
                  {categoryChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryChartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="정답률" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-20">데이터가 없습니다</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 출제 의도별 분석 & 오답 유형 분석 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 출제 의도별 분석 */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  출제 의도별 분석
                </CardTitle>
                <CardDescription>
                  각 단원의 이해도를 측정합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unitChartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={unitChartData} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
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
                        <Bar dataKey="정답률" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                          {unitChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.정답률 >= 70 ? '#10b981' : entry.정답률 >= 50 ? '#f59e0b' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-20">데이터가 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* 오답 유형 분석 */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  오답 유형 분석
                </CardTitle>
                <CardDescription>
                  틀린 문제가 많은 단원을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wrongByUnit.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wrongByUnit} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="오답수" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-20">데이터가 없습니다</p>
                )}
              </CardContent>
            </Card>
          </div>

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

                      <Progress value={rate} className="h-3" />
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
