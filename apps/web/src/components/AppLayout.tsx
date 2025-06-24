// web/src/components/AppLayout.tsx

import * as React from "react";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { TopBar } from "./TopBar";
import { Search } from "@/components/ui/search";

// This is just the content part of your dashboard
function Content() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome back! Here's your overview.</p>
      {/* Other dashboard widgets would go here */}
    </div>
  );
}

// This is the full application shell for an authenticated user.
// It combines the layout and the default content (the dashboard).
export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar />
        <Content />
      </main>
    </SidebarProvider>
  );
}
