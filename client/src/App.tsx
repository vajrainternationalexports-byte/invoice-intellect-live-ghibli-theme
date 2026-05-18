/**
 * App.tsx — Root application router
 * Uses AppShell instead of MobileShell for clean naming.
 */
import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppShell } from "@/components/layout/AppShell";

// Pages
import Dashboard        from "@/pages/Dashboard";
import Invoices         from "@/pages/Invoices";
import Reconciliation   from "@/pages/Reconciliation";
import Vendors          from "@/pages/Vendors";
import Sales            from "@/pages/Sales";
import JobWork          from "@/pages/JobWork";
import JobWorkDashboard from "@/pages/JobWorkDashboard";
import PurchaseOrder    from "@/pages/PurchaseOrder";

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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;