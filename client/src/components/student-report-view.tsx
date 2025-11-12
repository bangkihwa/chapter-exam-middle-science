import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Award, Calendar, Target, Sparkles, BookOpen, Brain, Zap, Star, Trophy, Eye, CheckCircle, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import type { TestResult } from "@shared/schema";

interface StudentReportViewProps {
  results: TestResult[];
  studentName?: string;
  studentId?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function StudentReportView({ results, studentName, studentId, showBackButton = false, onBack }: StudentReportViewProps) {
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  const sortedResults = [...results].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  // 선택된 시험 결과의 문제 데이터 가져오기
  const { data: questions } = useQuery<any[]>({
    queryKey: ['/api/questions/unit', selectedResult?.unit],
    enabled: !!selectedResult,
  });

  const getGradeInfo = (score: number) => {
    if (score >= 95) return { grade: "S", color: "bg-purple-600", message: "완벽합니다!" };
    if (score >= 90) return { grade: "A+", color: "bg-green-600", message: "매우 우수합니다!" };
    if (score >= 85) return { grade: "A", color: "bg-green-500", message: "우수합니다!" };
    if (score >= 80) return { grade: "B+", color: "bg-blue-600", message: "잘했습니다!" };
    if (score >= 75) return { grade: "B", color: "bg-blue-500", message: "좋습니다!" };
    if (score >= 70) return { grade: "C", color: "bg-yellow-600", message: "조금 더 노력하세요!" };
    return { grade: "D", color: "bg-red-600", message: "더 공부가 필요합니다!" };
  };

  const renderResultDetail = () => {
    if (!selectedResult || !questions) return null;

    const studentAnswers = JSON.parse(selectedResult.answers || "[]");
    const gradeInfo = getGradeInfo(selectedResult.achievementRate);

    // 오답 문제 필터링
    const wrongAnswers = studentAnswers.filter((ans: any) => {
      const question = questions.find(q => q.questionId === ans.questionId);
      return question && question.answer !== ans.answer;
    });

    return (
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              시험 결과 상세
            </DialogTitle>
            <DialogDescription>
              {selectedResult.unit} · {new Date(selectedResult.submittedAt).toLocaleString("ko-KR")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 점수 및 등급 */}
            <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl">
              <div className={`inline-block px-12 py-6 rounded-2xl text-white ${gradeInfo.color} shadow-xl mb-4`}>
                <div className="text-6xl font-bold mb-2">{selectedResult.achievementRate}점</div>
                <div className="text-4xl font-black tracking-wider">{gradeInfo.grade}</div>
              </div>
              <p className="text-xl font-semibold mt-4">{gradeInfo.message}</p>
              <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
                <div className="p-4 bg-card rounded-xl border">
                  <p className="text-sm text-muted-foreground mb-1">정답</p>
                  <p className="text-3xl font-bold text-green-600">{selectedResult.correctAnswers}</p>
                </div>
                <div className="p-4 bg-card rounded-xl border">
                  <p className="text-sm text-muted-foreground mb-1">오답</p>
                  <p className="text-3xl font-bold text-red-600">{wrongAnswers.length}</p>
                </div>
              </div>
            </div>

            {/* 피드백 */}
            {selectedResult.feedback && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    선생님 피드백
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{selectedResult.feedback}</p>
                </CardContent>
              </Card>
            )}

            {/* 오답 문제 */}
            {wrongAnswers.length > 0 && (
              <Card className="border-2 border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    틀린 문제 ({wrongAnswers.length}개)
                  </CardTitle>
                  <CardDescription>
                    다시 한 번 확인하고 복습하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wrongAnswers.map((ans: any, idx: number) => {
                      const question = questions.find(q => q.questionId === ans.questionId);
                      if (!question) return null;

                      return (
                        <div key={idx} className="p-4 rounded-xl bg-red-500/5 border-2 border-red-500/20">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-bold">문제 {question.questionId}번</h4>
                            <Badge variant="outline" className="border-red-600 text-red-700">
                              오답
                            </Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 mt-3">
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                정답
                              </p>
                              <p className="text-2xl font-bold text-green-700">{question.answer}번</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-red-600" />
                                내 답
                              </p>
                              <p className="text-2xl font-bold text-red-700">{ans.answer}번</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 정답 문제 */}
            {selectedResult.correctAnswers > 0 && (
              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    맞힌 문제 ({selectedResult.correctAnswers}개)
                  </CardTitle>
                  <CardDescription>
                    잘했습니다! 이 실력을 유지하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {studentAnswers
                      .filter((ans: any) => {
                        const question = questions.find(q => q.questionId === ans.questionId);
                        return question && question.answer === ans.answer;
                      })
                      .map((ans: any, idx: number) => (
                        <div
                          key={idx}
                          className="aspect-square flex items-center justify-center bg-green-500/10 border-2 border-green-500/30 rounded-lg font-bold text-green-700"
                        >
                          {ans.questionId}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const totalTests = sortedResults.length;
  const averageScore = totalTests > 0
    ? Math.round(sortedResults.reduce((sum, r) => sum + r.achievementRate, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...sortedResults.map(r => r.achievementRate))
    : 0;

  // 최근 3개와 이전 3개 비교 (성적 향상도)
  const recentAvg = sortedResults.length >= 3
    ? Math.round(sortedResults.slice(0, 3).reduce((sum, r) => sum + r.achievementRate, 0) / 3)
    : averageScore;
  const previousAvg = sortedResults.length >= 6
    ? Math.round(sortedResults.slice(3, 6).reduce((sum, r) => sum + r.achievementRate, 0) / 3)
    : averageScore;
  const improvement = recentAvg - previousAvg;

  // 단원별 데이터
  const unitData = sortedResults.reduce((acc, result) => {
    if (!acc[result.unit]) {
      acc[result.unit] = {
        unit: result.unit,
        count: 0,
        totalScore: 0,
        scores: [],
        results: [],
      };
    }
    acc[result.unit].count++;
    acc[result.unit].totalScore += result.achievementRate;
    acc[result.unit].scores.push(result.achievementRate);
    acc[result.unit].results.push(result);
    return acc;
  }, {} as Record<string, { unit: string; count: number; totalScore: number; scores: number[]; results: TestResult[] }>);

  const chartData = Object.values(unitData)
    .map(item => ({
      name: item.unit.length > 10 ? item.unit.substring(0, 10) + "..." : item.unit,
      fullName: item.unit,
      평균점수: Math.round(item.totalScore / item.count),
      응시횟수: item.count,
    }))
    .sort((a, b) => b.평균점수 - a.평균점수);

  // 강점/약점 단원
  const strongestUnit = chartData[0];
  const weakestUnit = chartData[chartData.length - 1];

  // 레이더 차트 데이터 (상위 6개 단원)
  const radarData = chartData.slice(0, 6).map(item => ({
    subject: item.name,
    score: item.평균점수,
  }));

  // 성적 분포 (파이 차트)
  const scoreDistribution = [
    { name: "90-100점", value: sortedResults.filter(r => r.achievementRate >= 90).length, color: "#10b981" },
    { name: "80-89점", value: sortedResults.filter(r => r.achievementRate >= 80 && r.achievementRate < 90).length, color: "#3b82f6" },
    { name: "70-79점", value: sortedResults.filter(r => r.achievementRate >= 70 && r.achievementRate < 80).length, color: "#f59e0b" },
    { name: "60-69점", value: sortedResults.filter(r => r.achievementRate >= 60 && r.achievementRate < 70).length, color: "#ef4444" },
    { name: "60점 미만", value: sortedResults.filter(r => r.achievementRate < 60).length, color: "#991b1b" },
  ].filter(item => item.value > 0);

  // 타임라인 데이터
  const timelineData = sortedResults.slice(0, 15).reverse().map((result, index) => ({
    name: `${index + 1}`,
    성취율: result.achievementRate,
    단원: result.unit,
    date: new Date(result.submittedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
  }));

  // 배지/업적 시스템
  const achievements = [];
  if (sortedResults.some(r => r.achievementRate === 100)) {
    achievements.push({ icon: Sparkles, name: "완벽주의자", description: "100점을 받았어요!", color: "text-yellow-600", bgColor: "bg-yellow-500/20" });
  }
  if (totalTests >= 10) {
    achievements.push({ icon: Target, name: "열심히 공부", description: "10회 이상 응시", color: "text-blue-600", bgColor: "bg-blue-500/20" });
  }
  if (averageScore >= 90) {
    achievements.push({ icon: Star, name: "최우등생", description: "평균 90점 이상", color: "text-purple-600", bgColor: "bg-purple-500/20" });
  }
  if (improvement > 10) {
    achievements.push({ icon: TrendingUp, name: "성장형 인재", description: "최근 성적 향상", color: "text-green-600", bgColor: "bg-green-500/20" });
  }
  if (sortedResults.length >= 5 && sortedResults.slice(0, 5).every(r => r.achievementRate >= 80)) {
    achievements.push({ icon: Zap, name: "연속 고득점", description: "최근 5회 80점 이상", color: "text-orange-600", bgColor: "bg-orange-500/20" });
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="mr-auto">
              뒤로
            </Button>
          )}
          <Brain className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">학습 성과 분석</h1>
        </div>
        {studentName && (
          <p className="text-lg text-muted-foreground">
            {studentName} {studentId && `(${studentId})`}
          </p>
        )}
      </div>

      {/* 주요 통계 */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-2 border-primary/20 shadow-lg hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 응시 횟수</CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-primary">{totalTests}</div>
            <p className="text-xs text-muted-foreground mt-2">누적 시험 응시</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 shadow-lg hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 성취율</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-blue-600">{averageScore}%</div>
            <Progress value={averageScore} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">전체 평균 점수</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 shadow-lg hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-green-600">{bestScore}%</div>
            <p className="text-xs text-muted-foreground mt-2">역대 최고 기록</p>
          </CardContent>
        </Card>

        <Card className={`border-2 shadow-lg hover-elevate ${
          improvement > 0 ? "border-green-500/20" : improvement < 0 ? "border-red-500/20" : "border-gray-500/20"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 향상도</CardTitle>
            {improvement > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : improvement < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : (
              <Target className="h-5 w-5 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold font-mono ${
              improvement > 0 ? "text-green-600" : improvement < 0 ? "text-red-600" : "text-gray-600"
            }`}>
              {improvement > 0 ? "+" : ""}{improvement}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {improvement > 0 ? "상승 중!" : improvement < 0 ? "하락 중..." : "유지 중"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="overall" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall">전체 성적 분석</TabsTrigger>
          <TabsTrigger value="units">단원별 성적표</TabsTrigger>
        </TabsList>

        {/* 전체 성적 분석 탭 */}
        <TabsContent value="overall" className="space-y-6">
          {/* 업적 배지 */}
          {achievements.length > 0 && (
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  획득한 업적
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {achievements.map((achievement, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 text-center ${achievement.bgColor} border-opacity-30 hover-elevate`}
                    >
                      <achievement.icon className={`w-8 h-8 mx-auto mb-2 ${achievement.color}`} />
                      <p className="font-semibold text-sm mb-1">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 강점/약점 분석 */}
          {chartData.length > 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-2 border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Star className="w-5 h-5" />
                    가장 강한 단원
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-green-500/10 rounded-xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <p className="text-2xl font-bold mb-2">{strongestUnit?.fullName}</p>
                    <Badge className="text-xl px-4 py-1 bg-green-600">
                      평균 {strongestUnit?.평균점수}점
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-3">
                      {strongestUnit?.응시횟수}회 응시 · 이 실력을 유지하세요!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Target className="w-5 h-5" />
                    보완이 필요한 단원
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-orange-500/10 rounded-xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-orange-600" />
                    <p className="text-2xl font-bold mb-2">{weakestUnit?.fullName}</p>
                    <Badge className="text-xl px-4 py-1 bg-orange-600">
                      평균 {weakestUnit?.평균점수}점
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-3">
                      {weakestUnit?.응시횟수}회 응시 · 집중 학습이 필요합니다
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 차트 섹션 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 레이더 차트 */}
            {radarData.length >= 3 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>단원별 역량 분석</CardTitle>
                  <CardDescription>
                    각 단원의 균형잡힌 이해도를 확인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" className="text-xs" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="평균 점수"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* 성적 분포 파이 차트 */}
            {scoreDistribution.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>성적 분포</CardTitle>
                  <CardDescription>
                    점수대별 시험 결과 비율
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 단원별 성취율 바 차트 */}
          {chartData.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>단원별 평균 성취율</CardTitle>
                <CardDescription>
                  각 단원의 평균 점수와 응시 횟수
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="평균점수" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 성적 추이 라인 차트 */}
          {timelineData.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>성적 변화 추이</CardTitle>
                <CardDescription>
                  최근 시험의 성취율 변화를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="성취율"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--chart-1))", r: 5 }}
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 단원별 성적표 탭 */}
        <TabsContent value="units" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                단원별 성적표
              </CardTitle>
              <CardDescription>
                각 단원별로 시험 결과를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.values(unitData)
                  .sort((a, b) => (b.totalScore / b.count) - (a.totalScore / a.count))
                  .map((unit) => {
                    const avgScore = Math.round(unit.totalScore / unit.count);
                    const gradeColor = avgScore >= 90 ? "text-green-600" :
                                      avgScore >= 80 ? "text-blue-600" :
                                      avgScore >= 70 ? "text-yellow-600" :
                                      avgScore >= 60 ? "text-orange-600" : "text-red-600";
                    const gradeBg = avgScore >= 90 ? "bg-green-500/10" :
                                   avgScore >= 80 ? "bg-blue-500/10" :
                                   avgScore >= 70 ? "bg-yellow-500/10" :
                                   avgScore >= 60 ? "bg-orange-500/10" : "bg-red-500/10";

                    return (
                      <div key={unit.unit} className={`p-6 rounded-xl border-2 ${gradeBg}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold">{unit.unit}</h3>
                          <div className="flex items-center gap-4">
                            <Badge className={`text-xl px-4 py-1 ${gradeBg} ${gradeColor}`}>
                              평균 {avgScore}점
                            </Badge>
                            <Badge variant="outline">
                              {unit.count}회 응시
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {unit.results
                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                            .map((result, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-card border hover-elevate cursor-pointer" onClick={() => setSelectedResult(result)}>
                              <div className="flex-1">
                                <Calendar className="w-4 h-4 inline mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                  {new Date(result.submittedAt).toLocaleString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {result.correctAnswers} / {result.totalQuestions} 정답
                                </span>
                                <Badge className={`font-mono ${
                                  result.achievementRate >= 90 ? "bg-green-600" :
                                  result.achievementRate >= 80 ? "bg-blue-600" :
                                  result.achievementRate >= 70 ? "bg-yellow-600" :
                                  result.achievementRate >= 60 ? "bg-orange-600" : "bg-red-600"
                                }`}>
                                  {result.achievementRate}%
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResult(result);
                                  }}
                                  data-testid={`button-view-detail-${idx}`}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  상세 보기
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 시험 결과 상세 모달 */}
      {renderResultDetail()}
    </div>
  );
}
