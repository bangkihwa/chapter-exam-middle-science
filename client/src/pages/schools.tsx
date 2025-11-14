import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, LogOut, Building2 } from "lucide-react";
import { useEffect } from "react";
import type { School } from "@shared/schema";

export default function SchoolsPage() {
  const [, setLocation] = useLocation();
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    enabled: !!student,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("student");
    setLocation("/");
  };

  const handleSchoolSelect = (schoolId: number) => {
    setLocation(`/exams/${schoolId}`);
  };

  if (!student) {
    return null;
  }

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
              <p className="text-sm text-muted-foreground">통합과학 기출문제</p>
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
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">학교 선택</h2>
            <p className="text-muted-foreground">
              기출문제를 풀 학교를 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-24 w-full" />
                </Card>
              ))
            ) : schools && schools.length > 0 ? (
              schools.map((school) => (
                <Card
                  key={school.id}
                  className="hover-elevate active-elevate-2 transition-all cursor-pointer group"
                  onClick={() => handleSchoolSelect(school.id)}
                  data-testid={`card-school-${school.id}`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl text-center leading-tight">
                      {school.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      data-testid={`button-select-school-${school.id}`}
                    >
                      기출문제 보기
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">등록된 학교가 없습니다.</p>
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
