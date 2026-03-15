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
import ConsumablesPage from "@/pages/ConsumablesPage";
import MaintenancePage from "@/pages/MaintenancePage";
import ServiceTicketDetailPage from "@/pages/ServiceTicketDetailPage";
import ForecastPage from "@/pages/ForecastPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import QuotationsPage from "@/pages/QuotationsPage";
import QuotationDetailPage from "@/pages/QuotationDetailPage";
import CustomerSignQuotationPage from "@/pages/CustomerSignQuotationPage";
import InventoryPage from "@/pages/InventoryPage";
import PaymentsPage from "@/pages/PaymentsPage";
import PaymentDetailPage from "@/pages/PaymentDetailPage";

import NotFound from "@/pages/NotFound";
import MockLoginPage from "@/pages/MockLoginPage";
import CustomerRegisterPage from "@/pages/CustomerRegisterPage";
import QRCodePage from "@/pages/QRCodePage";
import QcStockPage from "@/pages/QcStockPage";
import QcStockDetailPage from "@/pages/QcStockDetailPage";
import Trica3DDetailPage from "@/pages/Trica3DDetailPage";
import QuattroDetailPage from "@/pages/QuattroDetailPage";
import CartridgeDetailPage from "@/pages/CartridgeDetailPage";
import PicohiDetailPage from "@/pages/PicohiDetailPage";
import FreezeroDetailPage from "@/pages/FreezeroDetailPage";
import InstallBasePage from "@/pages/InstallBasePage";
import InstallBaseDetailPage from "@/pages/InstallBaseDetailPage";
import PaymentResultPage from "@/pages/PaymentResultPage";
import { MockAuthProvider } from "@/hooks/useMockAuth";

const queryClient = new QueryClient();


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
        <Route path="/install-base" element={<InstallBasePage />} />
        <Route path="/install-base/:id" element={<InstallBaseDetailPage />} />
        <Route path="/consumables" element={<ConsumablesPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/maintenance/:id" element={<ServiceTicketDetailPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/payments/:quotationId" element={<PaymentDetailPage />} />
        <Route path="/qr-register" element={<QRCodePage />} />
        <Route path="/qc-stock" element={<QcStockPage />} />
        <Route path="/qc-stock/:id" element={<QcStockDetailPage />} />
        <Route path="/qc-stock/trica3d/:id" element={<Trica3DDetailPage />} />
        <Route path="/qc-stock/quattro/:id" element={<QuattroDetailPage />} />
        <Route path="/qc-stock/cartridge/:id" element={<CartridgeDetailPage />} />
        <Route path="/qc-stock/picohi/:id" element={<PicohiDetailPage />} />
        <Route path="/qc-stock/freezero/:id" element={<FreezeroDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages (no AppLayout) */}
      <Route path="/sign/quotation" element={<CustomerSignQuotationPage />} />
      <Route path="/register" element={<CustomerRegisterPage />} />
      <Route path="/payment-result" element={<PaymentResultPage />} />

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