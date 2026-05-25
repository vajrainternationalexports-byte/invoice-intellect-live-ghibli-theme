/**
 * App.tsx — Root application router
 * Uses AppShell instead of MobileShell for clean naming.
 */
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppShell } from "@/components/layout/AppShell";

// Pages
import Dashboard        from "@/pages/Dashboard";
import Invoices         from "@/pages/purchase/Invoices";
import Reconciliation   from "@/pages/Reconciliation";
import Vendors          from "@/pages/Vendors";
import Sales            from "@/pages/sales/Sales";
import JobWork          from "@/pages/jobwork/labour/JobWork";
import JobWorkDashboard from "@/pages/jobwork/zinc/JobWorkDashboard";
import PurchaseOrder    from "@/pages/po/PurchaseOrder";

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-blue-light p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-red-200 text-center">
            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-black text-blue-ink uppercase tracking-tight mb-2">Something went wrong</h2>
            <p className="text-xs text-blue-mid/70 font-mono mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="bg-blue-ink text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-ink/90 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/"                  component={Dashboard} />
        <Route path="/invoices"          component={Invoices} />
        <Route path="/reconciliation"    component={Reconciliation} />
        <Route path="/vendors"           component={Vendors} />
        <Route path="/sales"             component={Sales} />
        <Route path="/jobwork"           component={JobWork} />
        <Route path="/jobwork/dashboard" component={JobWorkDashboard} />
        <Route path="/po"                component={PurchaseOrder} />
        <Route                           component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

export default App;