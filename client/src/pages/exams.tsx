import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, LogOut, ChevronLeft, FileText, Calendar } from "lucide-react";
import { useEffect } from "react";
import type { Exam } from "@shared/schema";

export default function ExamsPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const schoolId = params.schoolId ? parseInt(params.schoolId) : null;
  
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: [`/api/schools/${schoolId}/exams`],
    enabled: !!student && !!schoolId,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("student");
    setLocation("/");
  };

  const handleBack = () => {
    setLocation("/schools");
  };

  const handleExamSelect = (examId: number) => {
    setLocation(`/test/${examId}`);
  };

  if (!student || !schoolId) {
    return null;
  }

  const schoolName = exams?.[0]?.schoolName || "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">목동에이원과학학원</h1>
              <p className="text-xs font-semibold text-primary">프리미엄 학습관리 시스템</p>
              {schoolName && <p className="text-xs text-muted-foreground">{schoolName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{student.studentName}</p>
              <p className="text-xs text-muted-foreground font-mono">{student.studentId}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-logout"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/units")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              단원 선택
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">시험 선택</h2>
            <p className="text-muted-foreground">
              풀고 싶은 기출문제를 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))
            ) : exams && exams.length > 0 ? (
              exams.map((exam) => (
                <Card
                  key={exam.id}
                  className="hover-elevate active-elevate-2 transition-all cursor-pointer group"
                  onClick={() => handleExamSelect(exam.id)}
                  data-testid={`card-exam-${exam.id}`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-lg text-center leading-tight">
                      {exam.year}년 {exam.semester}
                    </CardTitle>
                    <CardDescription className="text-center">
                      <Badge variant="secondary">{exam.subject}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      data-testid={`button-start-exam-${exam.id}`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      시험 시작
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">등록된 시험이 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  관리자에게 문의해주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
