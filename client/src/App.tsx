import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login";
import UnitTestPage from "@/pages/unit-test";
import ResultPage from "@/pages/result";
import ReportsPage from "@/pages/reports";
import UnitsPage from "@/pages/units";
import AdminLoginPage from "@/pages/admin-login";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/units" component={UnitsPage} />
      <Route path="/test/unit/:unit" component={UnitTestPage} />
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
