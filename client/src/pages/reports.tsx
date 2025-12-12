import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { Submission, Exam, UnitResult } from "@shared/schema";

interface EnrichedSubmission extends Omit<Submission, 'unitResults'> {
  exam: Exam;
  unitResults: UnitResult[];
}

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
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/schools")}
                data-testid="button-back-to-schools"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                학교 선택
              </Button>
              <div>
                <h1 className="text-sm font-bold">목동에이원과학학원</h1>
                <p className="text-xs font-semibold text-primary">프리미엄 학습관리 시스템</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{student.studentName}</p>
              <p className="text-xs text-muted-foreground font-mono">{student.studentId}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">성적 기록</h1>
            <p className="text-muted-foreground">
              지금까지 제출한 모든 시험 결과를 확인할 수 있습니다
            </p>
          </div>

          {submissions && submissions.length > 0 ? (
            <div className="grid gap-6">
              {submissions.map((submission) => {
                const date = new Date(submission.submittedAt);
                const getGradeColor = (rate: number) => {
                  if (rate >= 90) return "text-green-600 bg-green-500/20 border-green-500";
                  if (rate >= 70) return "text-blue-600 bg-blue-500/20 border-blue-500";
                  if (rate >= 50) return "text-orange-600 bg-orange-500/20 border-orange-500";
                  return "text-red-600 bg-red-500/20 border-red-500";
                };

                return (
                  <Card key={submission.id} className="hover-elevate transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {submission.exam.schoolName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {submission.exam.year}년 {submission.exam.semester} · {format(date, 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                        <div className={`text-center p-4 rounded-lg border-2 ${getGradeColor(submission.achievementRate)}`}>
                          <div className="text-3xl font-bold">
                            {submission.achievementRate}
                          </div>
                          <div className="text-xs">점</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{submission.correctAnswers}</div>
                          <div className="text-xs text-muted-foreground">정답</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{submission.answeredQuestions}</div>
                          <div className="text-xs text-muted-foreground">응답</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{submission.totalQuestions}</div>
                          <div className="text-xs text-muted-foreground">전체</div>
                        </div>
                      </div>

                      {submission.unitResults && submission.unitResults.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            단원별 성취도
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {submission.unitResults.map((unit, i) => (
                              <Badge
                                key={i}
                                variant={unit.achievementRate >= 70 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {unit.unit}: {unit.achievementRate}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">
                  아직 제출한 시험이 없습니다
                </p>
                <Button onClick={() => setLocation("/schools")} data-testid="button-start-test">
                  시험 시작하기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
