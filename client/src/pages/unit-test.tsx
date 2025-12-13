import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Send, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Question } from "@shared/schema";

export default function UnitTestPage() {
  const { unit } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const decodedUnit = unit ? decodeURIComponent(unit) : null;
  
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/units/${encodeURIComponent(decodedUnit || "")}/questions`],
    enabled: !!decodedUnit && !!student,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { studentId: string; studentName: string; unitName: string; answers: { questionNumber: number; answer: string }[] }) => {
      return await apiRequest("POST", "/api/unit-tests/submit", data);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/counts"] });
      sessionStorage.setItem("testResult", JSON.stringify(result));
      setLocation("/result");
    },
    onError: (error: any) => {
      toast({
        title: "제출 실패",
        description: error.message || "과제 제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const multipleChoiceQuestions = questions?.filter(q => q.type === "객관식") || [];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = multipleChoiceQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleAnswer = (questionNumber: number, option: string) => {
    const currentAnswer = answers[questionNumber] || "";
    const answerList = currentAnswer ? currentAnswer.split(',').map(a => a.trim()) : [];
    const optionIndex = answerList.indexOf(option);
    
    if (optionIndex >= 0) {
      answerList.splice(optionIndex, 1);
    } else {
      answerList.push(option);
    }
    
    if (answerList.length > 0) {
      setAnswers(prev => ({ ...prev, [questionNumber]: answerList.join(',') }));
    } else {
      const { [questionNumber]: _, ...rest } = answers;
      setAnswers(rest);
    }
  };

  const isOptionSelected = (questionNumber: number, option: string) => {
    const currentAnswer = answers[questionNumber] || "";
    const answerList = currentAnswer.split(',').map(a => a.trim());
    return answerList.includes(option);
  };

  const handleSubmit = () => {
    if (answeredCount === 0) {
      toast({
        title: "답안 없음",
        description: "최소 1개 이상의 문제에 답해주세요.",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      studentId: student.studentId,
      studentName: student.studentName,
      unitName: decodedUnit!,
      answers: Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
      })),
    };

    submitMutation.mutate(submitData);
  };

  if (!student || !decodedUnit) {
    return null;
  }

  if (questionsLoading) {
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
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/units")}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                단원 선택
              </Button>
              <div>
                <h1 className="text-sm font-bold">목동에이원과학학원</h1>
                <p className="text-xs font-semibold text-primary">프리미엄 학습관리 시스템</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {student.studentName}
              </Badge>
            </div>
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
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">부분 제출 가능</p>
                <p className="text-amber-800 dark:text-amber-200">
                  모든 문제를 풀지 않아도 제출할 수 있습니다. 답하지 않은 문제는 0점 처리됩니다.
                  복수 정답 문제는 여러 개를 선택할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold">OMR 답안지</h1>
                <p className="text-muted-foreground">
                  객관식 문제의 정답을 선택하세요
                </p>
              </div>

              <div className="space-y-6">
                {multipleChoiceQuestions.map((question) => (
                  <div
                    key={question.questionNumber}
                    className="flex items-center gap-4 py-3 border-b last:border-b-0"
                    data-testid={`question-row-${question.questionNumber}`}
                  >
                    <div className="w-12 text-center font-mono font-bold text-lg text-muted-foreground">
                      {question.questionNumber}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {["①", "②", "③", "④", "⑤"].map((option, idx) => (
                        <Button
                          key={option}
                          variant={isOptionSelected(question.questionNumber, option) ? "default" : "outline"}
                          size="sm"
                          className={`w-10 h-10 rounded-full font-bold text-lg ${
                            isOptionSelected(question.questionNumber, option)
                              ? ""
                              : "hover:bg-primary/10"
                          }`}
                          onClick={() => handleAnswer(question.questionNumber, option)}
                          data-testid={`button-answer-${question.questionNumber}-${idx + 1}`}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    {question.isMultipleAnswer && (
                      <Badge variant="secondary" className="text-xs">
                        복수정답
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="gap-2 px-8"
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  과제 제출하기
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
