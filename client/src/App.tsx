import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient, setUnauthorizedHandler } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNavigation } from "@/components/TopNavigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Tracking from "@/pages/Tracking";
import Customers from "@/pages/Customers";
import Carriers from "@/pages/Carriers";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orders" component={Orders} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/customers" component={Customers} />
      <Route path="/carriers" component={Carriers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, logout } = useAuth();
  
  // Set up global logout handler for 401 responses
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      queryClient.clear(); // Clear cached data on logout
    });
  }, [logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-screen w-full">
      <TopNavigation />
      <main className="flex-1 overflow-auto">
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
