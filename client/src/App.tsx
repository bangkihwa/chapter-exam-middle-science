import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login";
import SchoolsPage from "@/pages/schools";
import ExamsPage from "@/pages/exams";
import TestPage from "@/pages/test";
import ResultPage from "@/pages/result";
import ReportsPage from "@/pages/reports";
import AdminLoginPage from "@/pages/admin-login";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/schools" component={SchoolsPage} />
      <Route path="/exams/:schoolId" component={ExamsPage} />
      <Route path="/test/:examId" component={TestPage} />
      <Route path="/result" component={ResultPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
