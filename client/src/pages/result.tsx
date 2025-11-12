import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Home, BarChart3, Trophy, Target, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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
  const incorrectAnswers = result.totalQuestions - result.correctAnswers;
  
  // 성적 등급 결정
  const getGrade = (rate: number) => {
    if (rate === 100) return { grade: "S", color: "text-yellow-600", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-500" };
    if (rate >= 90) return { grade: "A+", color: "text-green-600", bgColor: "bg-green-500/20", borderColor: "border-green-500" };
    if (rate >= 80) return { grade: "A", color: "text-green-600", bgColor: "bg-green-500/20", borderColor: "border-green-500" };
    if (rate >= 70) return { grade: "B+", color: "text-blue-600", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" };
    if (rate >= 60) return { grade: "B", color: "text-blue-600", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" };
    if (rate >= 50) return { grade: "C", color: "text-orange-600", bgColor: "bg-orange-500/20", borderColor: "border-orange-500" };
    return { grade: "D", color: "text-red-600", bgColor: "bg-red-500/20", borderColor: "border-red-500" };
  };

  const gradeInfo = getGrade(result.achievementRate);

  // 동적 피드백 메시지
  const getDetailedFeedback = (rate: number, correct: number, total: number) => {
    if (rate === 100) {
      return {
        title: "🎉 완벽한 성적입니다!",
        message: `${total}문제를 모두 맞히셨습니다! 뛰어난 이해력과 집중력을 보여주셨어요.`,
        tips: ["이 수준을 유지하며 다음 단원도 도전해보세요!", "완벽한 실력입니다. 자신감을 가지세요!"]
      };
    } else if (rate >= 90) {
      return {
        title: "🌟 훌륭한 성적입니다!",
        message: `${total}문제 중 ${correct}문제를 맞히셨습니다. 거의 완벽에 가까운 이해도를 보여주셨어요.`,
        tips: [`틀린 ${incorrectAnswers}문제만 복습하면 완벽해질 수 있어요!`, "이 단원은 거의 마스터하셨습니다!"]
      };
    } else if (rate >= 80) {
      return {
        title: "👍 잘했습니다!",
        message: `${total}문제 중 ${correct}문제를 맞히셨습니다. 핵심 개념을 잘 이해하고 계세요.`,
        tips: [`틀린 ${incorrectAnswers}문제를 집중 복습해보세요.`, "조금만 더 노력하면 A+ 등급이에요!"]
      };
    } else if (rate >= 70) {
      return {
        title: "📚 괜찮은 성적입니다!",
        message: `${total}문제 중 ${correct}문제를 맞히셨습니다. 기본 개념은 잘 알고 계세요.`,
        tips: [`틀린 ${incorrectAnswers}문제를 다시 풀어보세요.`, "개념을 한 번 더 정리하면 더 좋은 성적을 얻을 수 있어요!"]
      };
    } else if (rate >= 60) {
      return {
        title: "💪 조금 더 노력이 필요해요!",
        message: `${total}문제 중 ${correct}문제를 맞히셨습니다. 기초는 다졌지만 보완이 필요해요.`,
        tips: ["교과서의 기본 개념을 다시 읽어보세요.", "틀린 문제 유형을 파악하고 집중 학습하세요."]
      };
    } else {
      return {
        title: "📖 기초부터 다시 시작해요!",
        message: `${total}문제 중 ${correct}문제를 맞히셨습니다. 이 단원의 기본 개념을 다시 학습하세요.`,
        tips: ["선생님께 질문하거나 개념 강의를 다시 들어보세요.", "천천히, 확실하게 기초부터 다시 쌓아가세요."]
      };
    }
  };

  const feedbackData = getDetailedFeedback(result.achievementRate, result.correctAnswers, result.totalQuestions);

  // 파이 차트 데이터
  const chartData = [
    { name: "맞힌 문제", value: result.correctAnswers, color: "#10b981" },
    { name: "틀린 문제", value: incorrectAnswers, color: "#ef4444" }
  ];

  // 틀린 문제 번호 목록
  const wrongQuestions = result.details
    ?.filter(d => !d.isCorrect)
    .map(d => parseInt(d.questionId) || d.questionId)
    .sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* 성적 요약 카드 */}
          <Card className={`border-2 shadow-2xl ${gradeInfo.borderColor}`}>
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${gradeInfo.bgColor} border-4 ${gradeInfo.borderColor}`}>
                  {isPerfect ? (
                    <Sparkles className="w-16 h-16 text-yellow-600 mb-2" />
                  ) : (
                    <Trophy className="w-16 h-16 text-primary mb-2" />
                  )}
                  <span className={`text-4xl font-bold ${gradeInfo.color}`}>
                    {gradeInfo.grade}
                  </span>
                </div>
              </div>
              <div>
                <CardTitle className="text-4xl font-bold mb-3">
                  {feedbackData.title}
                </CardTitle>
                <p className="text-lg text-muted-foreground font-medium">
                  {result.unit}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* 통계 그리드 */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-6 rounded-xl bg-card border-2 hover-elevate">
                  <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground mb-1">총 문제</p>
                  <p className="text-4xl font-bold font-mono">{result.totalQuestions}</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-green-500/10 border-2 border-green-500/30 hover-elevate">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground mb-1">맞힌 문제</p>
                  <p className="text-4xl font-bold font-mono text-green-600">{result.correctAnswers}</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-red-500/10 border-2 border-red-500/30 hover-elevate">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="text-sm text-muted-foreground mb-1">틀린 문제</p>
                  <p className="text-4xl font-bold font-mono text-red-600">{incorrectAnswers}</p>
                </div>
                <div className={`text-center p-6 rounded-xl border-2 ${gradeInfo.bgColor} ${gradeInfo.borderColor} hover-elevate`}>
                  <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${gradeInfo.color}`} />
                  <p className="text-sm text-muted-foreground mb-1">성취율</p>
                  <p className={`text-4xl font-bold font-mono ${gradeInfo.color}`}>{result.achievementRate}%</p>
                </div>
              </div>

              {/* 성취율 프로그레스 바 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">성취도</span>
                  <Badge className={`text-lg px-4 py-1 ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                    {gradeInfo.grade} 등급
                  </Badge>
                </div>
                <Progress value={result.achievementRate} className="h-4" />
              </div>

              {/* 피드백 메시지 */}
              <div className={`p-6 rounded-xl ${gradeInfo.bgColor} border-2 ${gradeInfo.borderColor}`}>
                <p className="font-semibold text-lg mb-3">{feedbackData.message}</p>
                <Separator className="my-4" />
                <div className="space-y-2">
                  {feedbackData.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${gradeInfo.color}`} />
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 시각화 및 분석 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 파이 차트 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>정답 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value}문제 (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 틀린 문제 분석 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  복습이 필요한 문제
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wrongQuestions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      아래 문제들을 다시 풀어보고 개념을 복습하세요:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {wrongQuestions.map((qId, idx) => (
                        <Badge
                          key={idx}
                          variant="destructive"
                          className="text-base px-3 py-1 font-mono"
                        >
                          {qId}번
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-sm font-medium">
                        💡 학습 팁: 틀린 문제는 교과서에서 해당 개념을 찾아 다시 읽고, 
                        비슷한 유형의 문제를 더 풀어보세요!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <p className="text-lg font-semibold text-green-600">
                      모든 문제를 맞히셨습니다!
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      완벽한 이해도를 보여주셨어요! 🎉
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 상세 결과 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                문제별 상세 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {result.details?.map((detail, index) => (
                  <div
                    key={detail.questionId}
                    className={`p-4 rounded-lg border-2 text-center hover-elevate ${
                      detail.isCorrect
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                    data-testid={`result-item-${index}`}
                  >
                    <div className="flex justify-center mb-2">
                      {detail.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {detail.questionId}번
                    </p>
                    <div className="space-y-1">
                      <Badge
                        variant={detail.isCorrect ? "default" : "destructive"}
                        className="font-mono text-xs"
                      >
                        내 답: {detail.studentAnswer}
                      </Badge>
                      {!detail.isCorrect && (
                        <Badge
                          variant="outline"
                          className="font-mono text-xs border-green-600 text-green-700"
                        >
                          정답: {detail.correctAnswer}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/units")}
              data-testid="button-home"
            >
              <Home className="w-5 h-5 mr-2" />
              다른 단원 선택
            </Button>
            <Button
              size="lg"
              onClick={() => setLocation("/reports")}
              data-testid="button-reports"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              전체 성적표 보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
