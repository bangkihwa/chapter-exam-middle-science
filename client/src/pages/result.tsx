import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Home, BarChart3, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ResultData {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  achievementRate: number;
  feedback: string;
  details: Array<{
    questionId: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  unit: string;
}

export default function ResultPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const resultData = sessionStorage.getItem("testResult");
    if (!resultData) {
      setLocation("/units");
      return;
    }
    setResult(JSON.parse(resultData));
  }, [setLocation]);

  if (!result) {
    return null;
  }

  const isPerfect = result.correctAnswers === result.totalQuestions;
  const isGood = result.achievementRate >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isPerfect ? "bg-yellow-500/20" : isGood ? "bg-green-500/20" : "bg-primary/10"
                }`}>
                  <Trophy className={`w-10 h-10 ${
                    isPerfect ? "text-yellow-600" : isGood ? "text-green-600" : "text-primary"
                  }`} />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold mb-2">
                  시험 완료!
                </CardTitle>
                <p className="text-muted-foreground">
                  {result.unit}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-card border">
                  <p className="text-sm text-muted-foreground mb-1">총 문제</p>
                  <p className="text-3xl font-bold font-mono">{result.totalQuestions}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-1">맞힌 문제</p>
                  <p className="text-3xl font-bold font-mono text-green-600">{result.correctAnswers}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-muted-foreground mb-1">틀린 문제</p>
                  <p className="text-3xl font-bold font-mono text-red-600">
                    {result.totalQuestions - result.correctAnswers}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">성취율</span>
                  <span className="text-2xl font-bold font-mono">{result.achievementRate}%</span>
                </div>
                <Progress value={result.achievementRate} className="h-3" />
              </div>

              {result.feedback && (
                <div className="p-4 rounded-lg bg-accent/50 border">
                  <p className="font-semibold mb-2">피드백</p>
                  <p className="text-sm text-muted-foreground">{result.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>상세 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.details?.map((detail, index) => (
                <div
                  key={detail.questionId}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                  data-testid={`result-item-${index}`}
                >
                  <div className="flex-shrink-0">
                    {detail.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">문제 번호</p>
                      <p className="font-mono font-semibold">{detail.questionId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">내 답</p>
                      <Badge variant={detail.isCorrect ? "default" : "destructive"} className="font-mono">
                        {detail.studentAnswer}번
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">정답</p>
                      <Badge variant="outline" className="font-mono border-green-600 text-green-700">
                        {detail.correctAnswer}번
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/units")}
              data-testid="button-home"
            >
              <Home className="w-4 h-4 mr-2" />
              단원 선택
            </Button>
            <Button
              className="flex-1"
              onClick={() => setLocation("/reports")}
              data-testid="button-reports"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              전체 성적 보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
