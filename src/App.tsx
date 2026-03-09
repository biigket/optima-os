import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LeadsPage from "@/pages/LeadsPage";
import CustomerCardPage from "@/pages/CustomerCardPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage";
import WeeklyPlanPage from "@/pages/WeeklyPlanPage";
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
import QuotationDetailPage from "@/pages/QuotationDetailPage";
import CustomerSignQuotationPage from "@/pages/CustomerSignQuotationPage";
import SalesOrdersPage from "@/pages/SalesOrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import InvoicesPage from "@/pages/InvoicesPage";
import PaymentsPage from "@/pages/PaymentsPage";
import Phase2Placeholder from "@/pages/Phase2Placeholder";
import NotFound from "@/pages/NotFound";
import MockLoginPage from "@/pages/MockLoginPage";
import CustomerRegisterPage from "@/pages/CustomerRegisterPage";
import QRCodePage from "@/pages/QRCodePage";
import { MockAuthProvider } from "@/hooks/useMockAuth";

const queryClient = new QueryClient();

const phase2Routes = [
  "/campaigns",
  "/promotions",
  "/kol",
  "/training",
  "/lms",
  "/ai-pipeline",
  "/ai-reorder",
  "/ai-marketing",
];

function AuthedAppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<CustomerCardPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
        <Route path="/weekly-plan" element={<WeeklyPlanPage />} />
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
        <Route path="/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/qr-register" element={<QRCodePage />} />
        {phase2Routes.map((path) => (
          <Route key={path} path={path} element={<Phase2Placeholder />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public customer signing page (no AppLayout) */}
      <Route path="/sign/quotation" element={<CustomerSignQuotationPage />} />

      {/* Main app */}
      <Route path="/*" element={<AuthedAppRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MockAuthProvider>
          <AppRoutes />
        </MockAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
