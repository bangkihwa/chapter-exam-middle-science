import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ChevronRight, LogOut, BarChart3 } from "lucide-react";
import { units, TEXTBOOK_NAME } from "@shared/schema";
import { useEffect } from "react";

export default function UnitsPage() {
  const [, setLocation] = useLocation();
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: questionCounts, isLoading } = useQuery({
    queryKey: ["/api/questions/counts"],
    enabled: !!student,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("student");
    setLocation("/");
  };

  const handleUnitSelect = (unit: string) => {
    setLocation(`/test/${encodeURIComponent(unit)}`);
  };

  const handleViewReports = () => {
    setLocation("/reports");
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
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">목동에이원과학학원</h1>
              <p className="text-sm text-muted-foreground">{TEXTBOOK_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{student.studentName}</p>
              <p className="text-xs text-muted-foreground font-mono">{student.studentId}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-view-reports"
              onClick={handleViewReports}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              성적 확인
            </Button>
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
            <h2 className="text-3xl font-bold">단원 선택</h2>
            <p className="text-muted-foreground">
              시험을 응시할 단원을 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit, index) => {
              const count = questionCounts?.[unit] || 0;
              
              return (
                <Card
                  key={unit}
                  className="hover-elevate active-elevate-2 transition-all cursor-pointer group"
                  onClick={() => handleUnitSelect(unit)}
                  data-testid={`card-unit-${index}`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {index + 1}단원
                      </Badge>
                      {isLoading ? (
                        <Skeleton className="h-5 w-16" />
                      ) : (
                        <Badge variant="outline" className="font-mono">
                          {count}문항
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl leading-tight">
                      {unit}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full group-hover:bg-primary/90"
                      data-testid={`button-start-${index}`}
                    >
                      시험 시작
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
