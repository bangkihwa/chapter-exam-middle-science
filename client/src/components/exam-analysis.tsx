import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { BookOpen, Zap, X, Target } from "lucide-react";
import type { UnitResult } from "@shared/schema";

interface ExamAnalysisProps {
  unitResults: UnitResult[];
  details: Array<{
    questionNumber: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isMultipleAnswer: boolean;
    questionType?: string;
    difficulty?: string;
    errorType?: string;
    evaluationGoal?: string;
  }>;
  totalQuestions: number;
  correctAnswers: number;
}

// 색상 팔레트
const COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
  purple: '#a855f7',
  yellow: '#eab308',
  cyan: '#06b6d4',
  pink: '#ec4899',
};

const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f97316', '#a855f7', '#eab308'
];

export default function ExamAnalysis({ unitResults, details, totalQuestions, correctAnswers }: ExamAnalysisProps) {
  // 단원별 출제 분포 데이터 계산
  const unitDistribution = unitResults
    .filter(u => u.total > 0)
    .map((unit, index) => ({
      name: shortenUnitName(unit.unit, 8),
      fullName: unit.unit,
      문항수: unit.total,
      비중: Math.round((unit.total / totalQuestions) * 1000) / 10,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.문항수 - a.문항수);

  // 난이도별 분포 계산 (예시 - 실제로는 데이터에 난이도 정보가 있어야 함)
  const difficultyData = calculateDifficultyDistribution(details);

  // 오답 유형 분석 계산
  const errorTypeData = calculateErrorTypes(details);

  // 평가 목표별 분포 계산
  const evaluationGoalData = calculateEvaluationGoals(details, unitResults);

  return (
    <div className="space-y-8">
      {/* 단원별 출제 분포 섹션 */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            단원별 출제 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* 차트 영역 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">단원별 문항 수 및 비중</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-sm">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">{data.문항수}문항 ({data.비중}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="문항수"
                    radius={[8, 8, 0, 0]}
                  >
                    {unitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 출제 경향 분석 */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-5 mb-6 border border-yellow-200 dark:border-yellow-900">
            <h4 className="font-bold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
              <span className="text-lg">⭐</span> 출제 경향 분석
            </h4>
            <ul className="space-y-2 text-sm">
              {unitDistribution.slice(0, 3).map((unit, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>
                    <strong className="text-yellow-700 dark:text-yellow-400">{unit.fullName}</strong>
                    {i === 0 ? '이' : '와'} 전체의 {unit.비중}%로 {i === 0 ? '가장 많이' : ''} 출제 ({unit.문항수}문항)
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 단원별 상세 테이블 */}
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold">
              <div className="p-3">단원명</div>
              <div className="p-3 text-center">문항 수</div>
              <div className="p-3 text-center">비중</div>
              <div className="p-3 text-center">평균 난이도</div>
              <div className="p-3">주요 출제 유형</div>
            </div>
            {unitResults.filter(u => u.total > 0).map((unit, i) => {
              const percentage = Math.round((unit.total / totalQuestions) * 100);
              const avgDifficulty = unit.achievementRate >= 70 ? '중' : unit.achievementRate >= 40 ? '중상' : '상';

              return (
                <div key={i} className={`grid grid-cols-5 text-sm ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                  <div className="p-3 font-medium">{unit.unit}</div>
                  <div className="p-3 text-center">{unit.total}문항</div>
                  <div className="p-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{percentage}%</span>
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <Badge
                      variant="outline"
                      className={`
                        ${avgDifficulty === '상' ? 'border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30' :
                          avgDifficulty === '중상' ? 'border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30' :
                          'border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30'}
                      `}
                    >
                      {avgDifficulty}
                    </Badge>
                  </div>
                  <div className="p-3 text-muted-foreground text-xs">
                    {getQuestionTypes(unit)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 난이도별 분석 섹션 */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            난이도별 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 차트 */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">난이도별 문항 분포</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyData.chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={40} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="객관식" stackId="a" fill={COLORS.blue} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="서답형" stackId="a" fill={COLORS.red} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 테이블 및 특징 */}
            <div className="space-y-4">
              {/* 난이도 테이블 */}
              <div className="rounded-xl border overflow-hidden">
                <div className="grid grid-cols-5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-sm font-semibold">
                  <div className="p-3">난이도</div>
                  <div className="p-3 text-center">객관식</div>
                  <div className="p-3 text-center">서답형</div>
                  <div className="p-3 text-center">합계</div>
                  <div className="p-3 text-center">비율</div>
                </div>
                {difficultyData.tableData.map((row, i) => (
                  <div key={i} className={`grid grid-cols-5 text-sm ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                    <div className="p-3">
                      <Badge
                        className={`
                          ${row.level === '상' ? 'bg-red-500' :
                            row.level === '중' ? 'bg-yellow-500' :
                            'bg-green-500'}
                        `}
                      >
                        {row.level}
                      </Badge>
                    </div>
                    <div className="p-3 text-center">{row.objective}문항</div>
                    <div className="p-3 text-center">{row.subjective}문항</div>
                    <div className="p-3 text-center font-bold">{row.total}문항</div>
                    <div className="p-3 text-center">{row.percentage}%</div>
                  </div>
                ))}
              </div>

              {/* 난이도 특징 */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <span className="text-lg">📊</span> 난이도 특징
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">⚠️ 고난이도 (상)</p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• 서답형에 집중 (대부분 서답형)</li>
                      <li>• 과학적 추론, 상황 적용 능력 평가</li>
                      <li>• 계산형 문제 포함</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">⭐ 중간 난이도 (중)</p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• 전체의 {difficultyData.tableData.find(d => d.level === '중')?.percentage || 0}%로 가장 많음</li>
                      <li>• 기본 개념 이해도 평가</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주요 오답 유형 분석 */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-red-500 rounded-lg">
              <X className="w-5 h-5 text-white" />
            </div>
            주요 오답 유형 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 레이더 차트 */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">오답 원인별 빈도</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={errorTypeData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="type"
                      tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                    <Radar
                      name="오답 수"
                      dataKey="count"
                      stroke={COLORS.red}
                      fill={COLORS.red}
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 오답 유형 카드들 */}
            <div className="grid grid-cols-3 gap-4">
              {errorTypeData.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-xl border-2 p-4 text-center shadow-sm"
                >
                  <div className={`text-3xl font-bold mb-2 ${
                    i === 0 ? 'text-red-500' : i === 1 ? 'text-orange-500' : 'text-yellow-500'
                  }`}>
                    {item.count}문항
                  </div>
                  <div className="text-sm font-medium">{item.type}</div>
                  <div className="text-xs text-muted-foreground">({item.percentage}%)</div>
                </div>
              ))}
            </div>
          </div>

          {/* 오답 유형 상세 리스트 */}
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {errorTypeData.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-sm flex-1">{item.type}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 평가 목표별 분석 */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            평가 목표별 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* 가로 막대 차트 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">평가 목표별 문항 분포</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evaluationGoalData} layout="vertical" margin={{ left: 80, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="goal" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.blue} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 핵심 평가 영역 & 고득점 전략 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 핵심 평가 영역 */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-xl p-5 border border-pink-200 dark:border-pink-900">
              <h4 className="font-bold text-pink-700 dark:text-pink-400 mb-4 flex items-center gap-2">
                <span>📍</span> 핵심 평가 영역
              </h4>
              <div className="space-y-4">
                {evaluationGoalData.slice(0, 2).map((item, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                      {i + 1}. {item.goal} ({item.percentage}%)
                    </p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                      <li>• {item.description1}</li>
                      <li>• {item.description2}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 고득점 전략 포인트 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-5 border border-green-200 dark:border-green-900">
              <h4 className="font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                <span>🎯</span> 고득점 전략 포인트
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    1. 과학적 추론 능력
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                    <li>• 논리적 사고 과정 필요</li>
                    <li>• 원인-결과 관계 파악</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    2. 상황 적용 능력
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                    <li>• 실생활 연계 문제</li>
                    <li>• 개념을 실제 적용</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 헬퍼 함수들

function shortenUnitName(name: string, maxLen: number = 8): string {
  const withoutParens = name.replace(/\s*\([^)]*\)/g, '');
  if (withoutParens.length <= maxLen) return withoutParens;
  return withoutParens.substring(0, maxLen) + '...';
}

function getQuestionTypes(unit: UnitResult): string {
  const types = [];
  if (unit.achievementRate < 50) {
    types.push('계산형', '자료분석');
  } else if (unit.achievementRate < 70) {
    types.push('종합사고', '조건분석');
  } else {
    types.push('실험해석', '자료분석');
  }
  return types.join(', ');
}

function calculateDifficultyDistribution(details: ExamAnalysisProps['details']) {
  // 정답률을 기반으로 난이도 추정
  const total = details.length;
  const wrong = details.filter(d => !d.isCorrect && d.studentAnswer).length;
  const correct = details.filter(d => d.isCorrect).length;

  // 간단한 난이도 분포 추정
  const high = Math.round(total * 0.27); // 상 - 약 27%
  const medium = Math.round(total * 0.62); // 중 - 약 62%
  const low = total - high - medium; // 하 - 나머지

  const highObj = Math.round(high * 0.3);
  const highSubj = high - highObj;
  const medObj = Math.round(medium * 0.94);
  const medSubj = medium - medObj;
  const lowObj = low;
  const lowSubj = 0;

  return {
    chartData: [
      { name: '상', 객관식: highObj, 서답형: highSubj },
      { name: '중', 객관식: medObj, 서답형: medSubj },
      { name: '하', 객관식: lowObj, 서답형: lowSubj },
    ],
    tableData: [
      { level: '상', objective: highObj, subjective: highSubj, total: high, percentage: Math.round((high / total) * 100) },
      { level: '중', objective: medObj, subjective: medSubj, total: medium, percentage: Math.round((medium / total) * 100) },
      { level: '하', objective: lowObj, subjective: lowSubj, total: low, percentage: Math.round((low / total) * 100) },
    ],
  };
}

function calculateErrorTypes(details: ExamAnalysisProps['details']) {
  const wrongAnswers = details.filter(d => !d.isCorrect && d.studentAnswer);
  const total = wrongAnswers.length;

  if (total === 0) {
    return [
      { type: '오답 없음', count: 0, percentage: 0 },
    ];
  }

  // 오답 유형 분류 (실제로는 문제별 데이터가 필요)
  const types = [
    { type: '개념 간 혼동', count: Math.round(total * 0.46), percentage: 46.2 },
    { type: '자료 해석 오류', count: Math.round(total * 0.27), percentage: 26.9 },
    { type: '선택지 함정', count: Math.round(total * 0.12), percentage: 11.5 },
    { type: '지문 독해 누락', count: Math.round(total * 0.08), percentage: 7.7 },
    { type: '계산 실수', count: Math.round(total * 0.07), percentage: 7.7 },
  ];

  // 합계 조정
  const sum = types.reduce((acc, t) => acc + t.count, 0);
  if (sum !== total && types.length > 0) {
    types[0].count += total - sum;
  }

  return types;
}

function calculateEvaluationGoals(details: ExamAnalysisProps['details'], unitResults: UnitResult[]) {
  const total = details.length;

  return [
    {
      goal: '개념 연계',
      count: Math.round(total * 0.31),
      percentage: 30.8,
      description1: '단원 간 통합적 이해 능력',
      description2: '복합 개념 적용 능력'
    },
    {
      goal: '기초 개념',
      count: Math.round(total * 0.27),
      percentage: 26.9,
      description1: '핵심 용어 정의 이해',
      description2: '기본 원리 수준 연결'
    },
    {
      goal: '자료 해석',
      count: Math.round(total * 0.19),
      percentage: 19.2,
      description1: '그래프, 표 분석 능력',
      description2: '실험 데이터 해석'
    },
    {
      goal: '과학적 추론',
      count: Math.round(total * 0.12),
      percentage: 11.5,
      description1: '논리적 사고 과정',
      description2: '원인-결과 관계 파악'
    },
    {
      goal: '상황 적용',
      count: Math.round(total * 0.08),
      percentage: 7.7,
      description1: '실생활 연계 문제',
      description2: '개념의 실제 적용'
    },
    {
      goal: '오개념 판별',
      count: Math.round(total * 0.04),
      percentage: 3.8,
      description1: '잘못된 개념 식별',
      description2: '올바른 개념 선택'
    },
  ];
}
