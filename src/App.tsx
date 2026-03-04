import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AccountsPage from "@/pages/AccountsPage";
import AccountDetailPage from "@/pages/AccountDetailPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import WorkItemsPage from "@/pages/WorkItemsPage";
import CalendarPage from "@/pages/CalendarPage";
import InventoryPage from "@/pages/InventoryPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import ServicePage from "@/pages/ServicePage";
import FinancePage from "@/pages/FinancePage";
import MarketingPage from "@/pages/MarketingPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:accountId" element={<AccountDetailPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/work-items" element={<WorkItemsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/service" element={<ServicePage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
