import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, BarChart3, AlertCircle, TrendingDown, LogOut, Search, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Student } from "@shared/schema";
import { units } from "@shared/schema";

interface SheetResult {
  studentId: string;
  studentName: string;
  textbook: string;
  unit: string;
  submittedAt: string;
  achievementRate: number;
  feedback: string;
}

interface QuestionStat {
  questionId: string;
  correctAnswer: string;
  totalAttempts: number;
  wrongAttempts: number;
  answerDistribution: Record<string, number>;
  wrongRate: number;
}

interface UnitStats {
  unit: string;
  totalQuestions: number;
  totalStudents: number;
  questionStats: QuestionStat[];
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [selectedUnit, setSelectedUnit] = useState(units[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("admin");
    if (!isAdmin) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: allResults, isLoading: resultsLoading } = useQuery<SheetResult[]>({
    queryKey: ["/api/admin/all-results"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const { data: unitStats, isLoading: statsLoading } = useQuery<UnitStats>({
    queryKey: ["/api/admin/unit-stats", selectedUnit],
    enabled: !!selectedUnit,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("admin");
    setLocation("/admin/login");
  };

  if (resultsLoading || studentsLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl space-y-6">
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

  const totalTests = allResults?.length || 0;
  const totalStudents = students?.length || 0;
  const averageScore = totalTests > 0
    ? Math.round(allResults!.reduce((sum, r) => sum + r.achievementRate, 0) / totalTests)
    : 0;

  // 학생 검색 필터
  const filteredStudents = students?.filter(student =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // 선택된 학생의 모든 성적
  const selectedStudentResults = selectedStudent
    ? allResults?.filter(r => r.studentId === selectedStudent.studentId) || []
    : [];

  const selectedStudentAvg = selectedStudentResults.length > 0
    ? Math.round(selectedStudentResults.reduce((sum, r) => sum + r.achievementRate, 0) / selectedStudentResults.length)
    : 0;

  // 학생별 통계 (검색 결과용)
  const studentStats = filteredStudents.map(student => {
    const studentResults = allResults?.filter(r => r.studentId === student.studentId) || [];
    const avgScore = studentResults.length > 0
      ? Math.round(studentResults.reduce((sum, r) => sum + r.achievementRate, 0) / studentResults.length)
      : 0;
    
    return {
      ...student,
      totalTests: studentResults.length,
      averageScore: avgScore,
      bestScore: studentResults.length > 0 ? Math.max(...studentResults.map(r => r.achievementRate)) : 0,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">관리자 대시보드</h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* 전체 통계 */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 shadow-lg hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 학생 수</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-mono text-primary">{totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-2">등록된 학생</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/20 shadow-lg hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 응시 횟수</CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-mono text-blue-600">{totalTests}</div>
                <p className="text-xs text-muted-foreground mt-2">전체 시험 응시</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 shadow-lg hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 평균 성취율</CardTitle>
                <TrendingDown className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-mono text-green-600">{averageScore}%</div>
                <Progress value={averageScore} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* 탭 메뉴 */}
          <Tabs defaultValue="students" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students">학생 검색 및 성적</TabsTrigger>
              <TabsTrigger value="questions">단원별 오답 분석</TabsTrigger>
            </TabsList>

            {/* 학생 검색 및 성적 */}
            <TabsContent value="students" className="space-y-4">
              {/* 검색 바 */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-6 h-6" />
                    학생 검색
                  </CardTitle>
                  <CardDescription>
                    학생 이름 또는 ID를 검색하여 성적을 확인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="학생 이름 또는 ID로 검색..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedStudent(null);
                    }}
                    className="text-lg"
                    data-testid="input-student-search"
                  />
                </CardContent>
              </Card>

              {/* 검색 결과 (검색어가 있을 때만 표시) */}
              {!selectedStudent && searchQuery && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>
                      검색 결과 ({studentStats.length}명)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {studentStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          검색 결과가 없습니다
                        </p>
                      ) : (
                        studentStats.map((student, index) => {
                          const gradeColor = student.averageScore >= 90 ? "text-green-600" :
                                            student.averageScore >= 80 ? "text-blue-600" :
                                            student.averageScore >= 70 ? "text-yellow-600" :
                                            student.averageScore >= 60 ? "text-orange-600" : "text-red-600";
                          const gradeBg = student.averageScore >= 90 ? "bg-green-500/10" :
                                         student.averageScore >= 80 ? "bg-blue-500/10" :
                                         student.averageScore >= 70 ? "bg-yellow-500/10" :
                                         student.averageScore >= 60 ? "bg-orange-500/10" : "bg-red-500/10";

                          return (
                            <Button
                              key={student.studentId}
                              variant="outline"
                              className="w-full justify-start p-4 h-auto hover-elevate"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <div className="flex items-center gap-4 w-full">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 font-bold text-primary flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 grid md:grid-cols-4 gap-4 text-left">
                                  <div>
                                    <p className="text-sm text-muted-foreground">이름</p>
                                    <p className="font-semibold">{student.studentName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">학생 ID</p>
                                    <p className="font-mono text-sm">{student.studentId}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">응시 횟수</p>
                                    <p className="font-semibold">{student.totalTests}회</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">평균 성취율</p>
                                    <Badge className={`${gradeBg} ${gradeColor} font-mono text-base`}>
                                      {student.averageScore}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 검색 안내 메시지 (검색어가 없고 학생도 선택하지 않았을 때) */}
              {!selectedStudent && !searchQuery && (
                <Card className="shadow-lg">
                  <CardContent className="py-16 text-center">
                    <Search className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-30" />
                    <h3 className="text-2xl font-bold mb-3">학생을 검색하세요</h3>
                    <p className="text-muted-foreground text-lg">
                      위의 검색창에 학생 이름 또는 ID를 입력하여<br />
                      개별 학생의 성적을 확인할 수 있습니다
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 선택된 학생의 상세 성적 */}
              {selectedStudent && (
                <>
                  <Card className="shadow-lg border-2 border-primary/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-2">{selectedStudent.studentName} 학생 성적표</CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span>학생 ID: {selectedStudent.studentId}</span>
                            <span>총 {selectedStudentResults.length}회 응시</span>
                            <Badge className="text-base">평균 {selectedStudentAvg}%</Badge>
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedStudent(null)}
                        >
                          목록으로
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedStudentResults.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            응시 기록이 없습니다
                          </p>
                        ) : (
                          selectedStudentResults.map((result, index) => {
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
                                key={index}
                                className={`flex items-center gap-4 p-5 rounded-xl border-2 ${gradeBg}`}
                              >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${gradeBg} border-2`}>
                                  <span className={`text-2xl font-bold ${gradeColor}`}>
                                    {result.achievementRate}
                                  </span>
                                </div>
                                <div className="flex-1 grid md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">단원</p>
                                    <p className="font-bold">{result.unit}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">응시 일시</p>
                                    <p className="text-sm flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {result.submittedAt}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">피드백</p>
                                    <p className="text-sm">{result.feedback}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* 단원별 오답 분석 */}
            <TabsContent value="questions" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>단원 선택</CardTitle>
                  <CardDescription>
                    분석할 단원을 선택하세요 (데이터베이스 기반)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {units.map((unit) => (
                      <Button
                        key={unit}
                        variant={selectedUnit === unit ? "default" : "outline"}
                        onClick={() => setSelectedUnit(unit)}
                        className="h-auto py-3 text-sm"
                      >
                        {unit}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {statsLoading ? (
                <Skeleton className="h-96" />
              ) : unitStats && unitStats.questionStats.length > 0 ? (
                <Card className="shadow-lg border-2 border-red-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                      {selectedUnit} - 오답률 분석
                    </CardTitle>
                    <CardDescription>
                      총 {unitStats.totalStudents}명이 응시한 {unitStats.totalQuestions}문제 중 오답률이 높은 순서
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {unitStats.questionStats.map((stat, index) => (
                        <div
                          key={stat.questionId}
                          className={`p-5 rounded-xl border-2 ${
                            stat.wrongRate >= 70 ? "bg-red-500/10 border-red-500/30" :
                            stat.wrongRate >= 50 ? "bg-orange-500/10 border-orange-500/30" :
                            stat.wrongRate >= 30 ? "bg-yellow-500/10 border-yellow-500/30" :
                            "bg-green-500/10 border-green-500/30"
                          }`}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`flex items-center justify-center w-16 h-16 rounded-full font-bold text-2xl ${
                              stat.wrongRate >= 70 ? "bg-red-600 text-white" :
                              stat.wrongRate >= 50 ? "bg-orange-600 text-white" :
                              stat.wrongRate >= 30 ? "bg-yellow-600 text-white" :
                              "bg-green-600 text-white"
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold">{stat.questionId}번</h3>
                                <Badge variant="outline" className="text-lg px-3 py-1 border-2 border-green-600 text-green-700">
                                  정답: {stat.correctAnswer}번
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">총 응시</p>
                                  <p className="text-xl font-bold">{stat.totalAttempts}명</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">오답 학생</p>
                                  <p className="text-xl font-bold text-red-600">{stat.wrongAttempts}명</p>
                                </div>
                              </div>
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">오답률</span>
                                  <span className="text-xl font-bold">{stat.wrongRate}%</span>
                                </div>
                                <Progress value={stat.wrongRate} className="h-3" />
                              </div>
                              <div className="pt-3 border-t">
                                <p className="text-sm font-semibold mb-2">학생 답안 분포:</p>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 2, 3, 4, 5].map((option) => {
                                    const count = stat.answerDistribution[option.toString()] || 0;
                                    const isCorrect = option.toString() === stat.correctAnswer;
                                    return (
                                      <div
                                        key={option}
                                        className={`p-3 rounded-lg text-center ${
                                          isCorrect
                                            ? "bg-green-600 text-white border-2 border-green-700"
                                            : count > 0
                                            ? "bg-red-500/20 border-2 border-red-500/50"
                                            : "bg-muted border"
                                        }`}
                                      >
                                        <p className="text-xs mb-1">{option}번</p>
                                        <p className="text-lg font-bold">{count}명</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold text-muted-foreground">
                      {selectedUnit}에 대한 응시 기록이 없습니다
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
