import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, TrendingUp, TrendingDown, Award, Calendar, Target, Sparkles, BookOpen, Brain, Zap, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { TestResult } from "@shared/schema";

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: results, isLoading } = useQuery<TestResult[]>({
    queryKey: ["/api/results", student?.studentId],
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

  const sortedResults = [...(results || [])].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const totalTests = sortedResults.length;
  const averageScore = totalTests > 0
    ? Math.round(sortedResults.reduce((sum, r) => sum + r.achievementRate, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...sortedResults.map(r => r.achievementRate))
    : 0;
  const worstScore = totalTests > 0
    ? Math.min(...sortedResults.map(r => r.achievementRate))
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
      };
    }
    acc[result.unit].count++;
    acc[result.unit].totalScore += result.achievementRate;
    acc[result.unit].scores.push(result.achievementRate);
    return acc;
  }, {} as Record<string, { unit: string; count: number; totalScore: number; scores: number[] }>);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/units")}
              data-testid="button-back-to-units"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              단원 선택
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{student.studentName}</p>
              <p className="text-xs text-muted-foreground font-mono">{student.studentId}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Brain className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">학습 성과 분석</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              체계적인 데이터 분석으로 학습 전략을 최적화하세요
            </p>
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
                <p className="text-xs text-muted-foreground mt-2">
                  누적 시험 응시
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  전체 평균 점수
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 shadow-lg hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
                <Award className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-mono text-green-600">{bestScore}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  역대 최고 기록
                </p>
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
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold mb-1">{data.fullName}</p>
                              <p className="text-sm text-primary">평균: {data.평균점수}점</p>
                              <p className="text-sm text-muted-foreground">응시: {data.응시횟수}회</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
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
                    <XAxis dataKey="name" label={{ value: "시험 회차", position: "insideBottom", offset: -5 }} />
                    <YAxis domain={[0, 100]} label={{ value: "성취율 (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold mb-1">{data.단원}</p>
                              <p className="text-sm text-primary">성취율: {data.성취율}%</p>
                              <p className="text-xs text-muted-foreground">{data.date}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="성취율"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--chart-1))", r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 응시 이력 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                전체 응시 이력
              </CardTitle>
              <CardDescription>
                모든 시험 결과를 시간순으로 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedResults.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold text-muted-foreground">
                      아직 응시한 시험이 없습니다
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      단원을 선택하고 첫 시험을 시작해보세요!
                    </p>
                  </div>
                ) : (
                  sortedResults.map((result, index) => {
                    const isRecent = index < 3;
                    const gradeColor = result.achievementRate >= 90 ? "text-green-600" :
                                      result.achievementRate >= 80 ? "text-blue-600" :
                                      result.achievementRate >= 70 ? "text-yellow-600" :
                                      result.achievementRate >= 60 ? "text-orange-600" : "text-red-600";
                    const gradeBg = result.achievementRate >= 90 ? "bg-green-500/10" :
                                   result.achievementRate >= 80 ? "bg-blue-500/10" :
                                   result.achievementRate >= 70 ? "bg-yellow-500/10" :
                                   result.achievementRate >= 60 ? "bg-orange-500/10" : "bg-red-500/10";

                    return (
                      <div
                        key={result.id}
                        className={`flex items-center gap-4 p-5 rounded-xl border-2 hover-elevate ${
                          isRecent ? "border-primary/30 bg-primary/5" : ""
                        }`}
                        data-testid={`history-item-${index}`}
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${gradeBg}`}>
                          <span className={`text-2xl font-bold ${gradeColor}`}>
                            {result.achievementRate}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg">{result.unit}</p>
                            {isRecent && <Badge variant="secondary" className="text-xs">최근</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.submittedAt).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`mb-2 font-mono text-lg px-3 py-1 ${gradeBg} ${gradeColor}`}
                          >
                            {result.achievementRate}%
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {result.correctAnswers} / {result.totalQuestions} 정답
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
