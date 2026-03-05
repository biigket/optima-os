import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import LeadsPage from "@/pages/LeadsPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import VisitCheckinPage from "@/pages/VisitCheckinPage";
import VisitReportsPage from "@/pages/VisitReportsPage";
import DemosPage from "@/pages/DemosPage";
import TasksPage from "@/pages/TasksPage";
import CalendarPage from "@/pages/CalendarPage";
import DevicesPage from "@/pages/DevicesPage";
import ConsumablesPage from "@/pages/ConsumablesPage";
import MaintenancePage from "@/pages/MaintenancePage";
import ForecastPage from "@/pages/ForecastPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import QuotationsPage from "@/pages/QuotationsPage";
import SalesOrdersPage from "@/pages/SalesOrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import InvoicesPage from "@/pages/InvoicesPage";
import Phase2Placeholder from "@/pages/Phase2Placeholder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const phase2Routes = [
  '/campaigns', '/promotions', '/kol',
  '/training', '/lms',
  '/ai-pipeline', '/ai-reorder', '/ai-marketing',
];

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/visit-checkin" element={<VisitCheckinPage />} />
        <Route path="/visit-reports" element={<VisitReportsPage />} />
        <Route path="/demos" element={<DemosPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/consumables" element={<ConsumablesPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        {phase2Routes.map(path => (
          <Route key={path} path={path} element={<Phase2Placeholder />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
