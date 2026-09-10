
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/i18n";
import { DataProvider } from "@/contexts/DataContext";
import { InvoiceProvider } from "@/contexts/InvoiceContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { trackPageView } from "@/lib/pixel";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { EstimateView } from "./pages/EstimateView";
import PublicEstimateView from "./pages/PublicEstimateView";
import PublicInvoiceView from "./pages/PublicInvoiceView";
import PublicJobView from "./pages/PublicJobView";
import PublicUpdateView from "./pages/PublicUpdateView";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Terms from "./pages/Terms";
import Card from "./pages/Card";
import Privacy from "./pages/Privacy";
import AnnualPage from "./pages/AnnualPage";
import AnnualSuccess from "./pages/AnnualSuccess";
import ResetPassword from "./pages/ResetPassword";
import StripeConnectCallback from "./pages/StripeConnectCallback";
import { guideRoutes } from "./pages/GuidePage";

const queryClient = new QueryClient();

// Meta Pixel doesn't get a fresh PageView on SPA route changes for free -
// this fires one on mount and again on every path/query change.
function PixelPageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView();
  }, [location.pathname, location.search]);
  return null;
}

const App = () => (
  <ThemeProvider defaultTheme="light">
    <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <DataProvider>
          <InvoiceProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PixelPageViewTracker />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  {/* The Spanish homepage. Prerendered to real Spanish HTML at
                      build time (scripts/prerender-es.mjs); this route is what
                      takes over once the bundle loads. */}
                  <Route path="/es" element={<LandingPage />} />
                  {/* The $49-a-year launch page every ad lands on, and its Spanish twin. */}
                  {guideRoutes()}
                  <Route path="/annual" element={<AnnualPage />} />
                  <Route path="/es/annual" element={<AnnualPage />} />
                  <Route path="/annual/success" element={<AnnualSuccess />} />
                  <Route path="/es/annual/success" element={<AnnualSuccess />} />
                  <Route path="/app" element={<Index />} />
                  <Route path="/welcome" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/estimate/:id" element={<EstimateView />} />
                  <Route path="/view-estimate/:token" element={<PublicEstimateView />} />
                  <Route path="/view-invoice/:token" element={<PublicInvoiceView />} />
                  <Route path="/view-job/:token" element={<PublicJobView />} />
                  <Route path="/view-update/:token" element={<PublicUpdateView />} />
                  <Route path="/card" element={<Card />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/stripe-connect-callback" element={<StripeConnectCallback />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </InvoiceProvider>
        </DataProvider>
      </ProfileProvider>
    </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
