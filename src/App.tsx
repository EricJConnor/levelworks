
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { DataProvider } from "@/contexts/DataContext";
import { InvoiceProvider } from "@/contexts/InvoiceContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { EstimateView } from "./pages/EstimateView";
import PublicEstimateView from "./pages/PublicEstimateView";
import PublicInvoiceView from "./pages/PublicInvoiceView";
import Dashboard from "./pages/Dashboard";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <DataProvider>
          <InvoiceProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/app" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/estimate/:id" element={<EstimateView />} />
                  <Route path="/view-estimate/:token" element={<PublicEstimateView />} />
                  <Route path="/view-invoice/:token" element={<PublicInvoiceView />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </InvoiceProvider>
        </DataProvider>
      </ProfileProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
