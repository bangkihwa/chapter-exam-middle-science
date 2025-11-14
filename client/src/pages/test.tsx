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
import type { Question, Exam, SubmitTest } from "@shared/schema";

export default function TestPage() {
  const { examId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const examIdNum = examId ? parseInt(examId) : null;
  
  const studentData = sessionStorage.getItem("student");
  const student = studentData ? JSON.parse(studentData) : null;

  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!student) {
      setLocation("/");
    }
  }, [student, setLocation]);

  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${examIdNum}`],
    enabled: !!examIdNum && !!student,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/exams/${examIdNum}/questions`],
    enabled: !!examIdNum && !!student,
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

  const handleAnswer = (questionNumber: number, option: string) => {
    const currentAnswer = answers[questionNumber] || "";
    
    // Toggle option in comma-separated list for multiple answers
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

    const submitData: SubmitTest = {
      studentId: student.studentId,
      studentName: student.studentName,
      examId: examIdNum!,
      answers: Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
      })),
    };

    submitMutation.mutate(submitData);
  };

  if (!student || !examIdNum) {
    return null;
  }

  if (examLoading || questionsLoading) {
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
            <Button onClick={() => setLocation("/schools")}>학교 선택으로 돌아가기</Button>
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
                onClick={() => setLocation(`/exams/${exam?.schoolId}`)}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                시험 선택
              </Button>
              <div>
                <h1 className="text-sm font-bold">목동에이원과학학원</h1>
                <p className="text-xs font-semibold text-primary">프리미엄내신관리 시스템</p>
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
              <span className="font-medium">
                {exam?.schoolName} {exam?.year}년 {exam?.semester}
              </span>
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
                {Array.from({ length: Math.ceil(multipleChoiceQuestions.length / 2) }).map((_, rowIndex) => {
                  const leftIndex = rowIndex * 2;
                  const rightIndex = rowIndex * 2 + 1;
                  const leftQuestion = multipleChoiceQuestions[leftIndex];
                  const rightQuestion = multipleChoiceQuestions[rightIndex];

                  return (
                    <div key={rowIndex} className="grid md:grid-cols-2 gap-8">
                      {leftQuestion && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-bold text-lg text-foreground">
                              {leftQuestion.questionNumber}번
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {leftQuestion.category}
                            </Badge>
                            <span className="text-xs">{leftQuestion.unit}</span>
                          </div>
                          <div className="flex gap-2">
                            {['①', '②', '③', '④', '⑤'].map((option, idx) => {
                              const optionValue = (idx + 1).toString();
                              const isSelected = isOptionSelected(leftQuestion.questionNumber, option);
                              return (
                                <button
                                  key={option}
                                  onClick={() => handleAnswer(leftQuestion.questionNumber, option)}
                                  className={`w-12 h-12 rounded-full border-2 font-medium transition-all hover-elevate ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  data-testid={`answer-${leftQuestion.questionNumber}-${optionValue}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {rightQuestion && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-bold text-lg text-foreground">
                              {rightQuestion.questionNumber}번
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {rightQuestion.category}
                            </Badge>
                            <span className="text-xs">{rightQuestion.unit}</span>
                          </div>
                          <div className="flex gap-2">
                            {['①', '②', '③', '④', '⑤'].map((option, idx) => {
                              const optionValue = (idx + 1).toString();
                              const isSelected = isOptionSelected(rightQuestion.questionNumber, option);
                              return (
                                <button
                                  key={option}
                                  onClick={() => handleAnswer(rightQuestion.questionNumber, option)}
                                  className={`w-12 h-12 rounded-full border-2 font-medium transition-all hover-elevate ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  data-testid={`answer-${rightQuestion.questionNumber}-${optionValue}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
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
              disabled={submitMutation.isPending || answeredCount === 0}
              className="px-12"
              data-testid="button-submit"
            >
              <Send className="w-5 h-5 mr-2" />
              {submitMutation.isPending ? "제출 중..." : `제출하기 (${answeredCount}/${totalQuestions})`}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
