import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, TrendingUp, Award, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
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
        <div className="container mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
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

  const unitData = sortedResults.reduce((acc, result) => {
    if (!acc[result.unit]) {
      acc[result.unit] = {
        unit: result.unit,
        count: 0,
        totalScore: 0,
      };
    }
    acc[result.unit].count++;
    acc[result.unit].totalScore += result.achievementRate;
    return acc;
  }, {} as Record<string, { unit: string; count: number; totalScore: number }>);

  const chartData = Object.values(unitData).map(item => ({
    name: item.unit.length > 10 ? item.unit.substring(0, 10) + "..." : item.unit,
    평균점수: Math.round(item.totalScore / item.count),
    응시횟수: item.count,
  }));

  const timelineData = sortedResults.slice(0, 10).reverse().map((result, index) => ({
    name: `${index + 1}회`,
    성취율: result.achievementRate,
    단원: result.unit,
  }));

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">성적 리포트</h1>
            <p className="text-muted-foreground">
              나의 학습 성과를 확인하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 응시 횟수</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{totalTests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  누적 시험 응시
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 성취율</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{averageScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  전체 평균
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-green-600">{bestScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  역대 최고
                </p>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>단원별 평균 성취율</CardTitle>
                <CardDescription>
                  각 단원의 평균 점수를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="평균점수" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {timelineData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>최근 성적 추이</CardTitle>
                <CardDescription>
                  최근 10회 시험의 성취율 변화
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="성취율"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>응시 이력</CardTitle>
              <CardDescription>
                모든 시험 결과를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    아직 응시한 시험이 없습니다
                  </p>
                ) : (
                  sortedResults.map((result, index) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                      data-testid={`history-item-${index}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold mb-1">{result.unit}</p>
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
                          variant={result.achievementRate >= 80 ? "default" : "secondary"}
                          className="mb-2 font-mono text-base"
                        >
                          {result.achievementRate}%
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {result.correctAnswers} / {result.totalQuestions}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
