import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Question, SubmitTest } from "@shared/schema";

export default function TestPage() {
  const { unit } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const decodedUnit = unit ? decodeURIComponent(unit) : "";
  
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions/unit", decodedUnit],
    enabled: !!decodedUnit && !!student,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitTest) => {
      return await apiRequest("POST", "/api/test/submit", data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      sessionStorage.setItem("testResult", JSON.stringify(result));
      setLocation("/result");
    },
    onError: (error: any) => {
      toast({
        title: "제출 실패",
        description: error.message || "시험 제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const multipleChoiceQuestions = questions?.filter(q => q.type === "객관식") || [];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = multipleChoiceQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) {
      toast({
        title: "답안 미완성",
        description: `${totalQuestions - answeredCount}개의 문제가 남아있습니다.`,
        variant: "destructive",
      });
      return;
    }

    const submitData: SubmitTest = {
      studentId: student.studentId,
      studentName: student.studentName,
      unit: decodedUnit,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    };

    submitMutation.mutate(submitData);
  };

  if (!student) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (multipleChoiceQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p>문제를 불러올 수 없습니다.</p>
            <Button onClick={() => setLocation("/units")}>단원 선택으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/units")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              단원 선택
            </Button>
            <Badge variant="outline" className="font-mono">
              {student.studentName}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{decodedUnit}</span>
              <span className="text-muted-foreground font-mono">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold">OMR 답안지</h1>
                <p className="text-muted-foreground">
                  객관식 문제의 정답을 선택하세요. (주관식 문항은 자동 정답 처리됩니다.)
                </p>
              </div>

              <div className="space-y-6">
                {Array.from({ length: Math.ceil(multipleChoiceQuestions.length / 2) }).map((_, rowIndex) => {
                  const leftIndex = rowIndex * 2;
                  const rightIndex = rowIndex * 2 + 1;
                  const leftQuestion = multipleChoiceQuestions[leftIndex];
                  const rightQuestion = multipleChoiceQuestions[rightIndex];

                  return (
                    <div key={rowIndex} className="grid md:grid-cols-2 gap-8">
                      {leftQuestion && (
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-lg min-w-[4rem]">
                            {leftQuestion.questionId}번
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((option) => (
                              <button
                                key={option}
                                onClick={() => handleAnswer(leftQuestion.questionId, option.toString())}
                                className={`w-12 h-12 rounded-full border-2 font-medium transition-all hover-elevate ${
                                  answers[leftQuestion.questionId] === option.toString()
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:border-primary/50"
                                }`}
                                data-testid={`answer-${leftQuestion.questionId}-${option}`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {rightQuestion && (
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-lg min-w-[4rem]">
                            {rightQuestion.questionId}번
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((option) => (
                              <button
                                key={option}
                                onClick={() => handleAnswer(rightQuestion.questionId, option.toString())}
                                className={`w-12 h-12 rounded-full border-2 font-medium transition-all hover-elevate ${
                                  answers[rightQuestion.questionId] === option.toString()
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:border-primary/50"
                                }`}
                                data-testid={`answer-${rightQuestion.questionId}-${option}`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || answeredCount < totalQuestions}
              className="px-12"
              data-testid="button-submit"
            >
              <Send className="w-5 h-5 mr-2" />
              {submitMutation.isPending ? "제출 중..." : "제출하기"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
