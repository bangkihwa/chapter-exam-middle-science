import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Send, BookOpen } from "lucide-react";
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
  const currentQuestion = multipleChoiceQuestions[currentQuestionIndex];

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = multipleChoiceQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleAnswer = (answer: string) => {
    if (currentQuestion) {
      setAnswers(prev => ({ ...prev, [currentQuestion.questionId]: answer }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < multipleChoiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
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
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
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

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="lg:hidden">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">문제 번호</h3>
              <div className="grid grid-cols-5 gap-2">
                {multipleChoiceQuestions.map((q, index) => {
                  const isAnswered = !!answers[q.questionId];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <Button
                      key={q.questionId}
                      variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                      size="sm"
                      className="h-10 font-mono"
                      onClick={() => handleQuestionNavigation(index)}
                      data-testid={`button-nav-${index}`}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            <Card className="hidden lg:block h-fit sticky top-24">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">문제 번호</h3>
                <div className="grid grid-cols-5 gap-2">
                  {multipleChoiceQuestions.map((q, index) => {
                    const isAnswered = !!answers[q.questionId];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={q.questionId}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        className="h-10 font-mono"
                        onClick={() => handleQuestionNavigation(index)}
                        data-testid={`button-nav-${index}`}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
            <Card>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-3 font-mono">
                      문제 {currentQuestion.questionId}
                    </Badge>
                    <h2 className="text-2xl font-bold">
                      {currentQuestionIndex + 1}번 문제
                    </h2>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {currentQuestionIndex + 1} / {totalQuestions}
                  </Badge>
                </div>

                <RadioGroup
                  value={answers[currentQuestion.questionId] || ""}
                  onValueChange={handleAnswer}
                  className="space-y-4"
                >
                  {[1, 2, 3, 4, 5].map((option) => (
                    <div
                      key={option}
                      className="flex items-center space-x-3 rounded-lg border p-4 hover-elevate cursor-pointer"
                      onClick={() => handleAnswer(option.toString())}
                    >
                      <RadioGroupItem
                        value={option.toString()}
                        id={`option-${option}`}
                        data-testid={`radio-option-${option}`}
                      />
                      <Label
                        htmlFor={`option-${option}`}
                        className="flex-1 cursor-pointer text-lg font-medium"
                      >
                        {option}번
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                이전
              </Button>

              {currentQuestionIndex === multipleChoiceQuestions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || answeredCount < totalQuestions}
                  className="px-8"
                  data-testid="button-submit"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "제출 중..." : "제출하기"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === multipleChoiceQuestions.length - 1}
                  data-testid="button-next"
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
