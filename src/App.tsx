import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AgentLab from "./pages/AgentLab";
import ModeSettings from "./pages/ModeSettings";
import DevTools from "./pages/DevTools";
import PromptBuilder from "./pages/PromptBuilder";
import History from "./pages/History";
import Export from "./pages/Export";
import Account from "./pages/Account";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agent-lab" element={<AgentLab />} />
            <Route path="/modes" element={<ModeSettings />} />
            <Route path="/dev-tools" element={<DevTools />} />
            <Route path="/history" element={<History />} />
            <Route path="/export" element={<Export />} />
            <Route path="/account" element={<Account />} />
            <Route path="/prompt-builder" element={<PromptBuilder />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
