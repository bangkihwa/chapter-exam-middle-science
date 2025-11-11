import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import type { Login } from "@shared/schema";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: Login) => {
      return await apiRequest<{ success: boolean; student: any }>(
        "POST",
        "/api/auth/login",
        data
      );
    },
    onSuccess: (data) => {
      if (data.success) {
        sessionStorage.setItem("student", JSON.stringify(data.student));
        queryClient.invalidateQueries();
        toast({
          title: "로그인 성공",
          description: `${data.student.studentName}님, 환영합니다!`,
        });
        setLocation("/units");
      }
    },
    onError: (error: any) => {
      toast({
        title: "로그인 실패",
        description: error.message || "학생 ID와 이름을 확인해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId.trim() || !formData.studentName.trim()) {
      toast({
        title: "입력 오류",
        description: "학생 ID와 이름을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-9 h-9 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">목동에이원과학학원</CardTitle>
            <CardDescription className="text-base">
              물리학 프리미엄 OMR 채점 시스템
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-base font-medium">
                  학생 ID
                </Label>
                <Input
                  id="studentId"
                  data-testid="input-student-id"
                  type="text"
                  placeholder="예: h01001"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  className="h-12 text-base"
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentName" className="text-base font-medium">
                  이름
                </Label>
                <Input
                  id="studentName"
                  data-testid="input-student-name"
                  type="text"
                  placeholder="예: 홍길동"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className="h-12 text-base"
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-12 text-base font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
