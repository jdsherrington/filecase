// web/sr/components/SideBar.tsx

import { Link } from "@tanstack/react-router";
import * as React from "react";

// This component is responsible for the main navigation within the app.
export function SideBar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-gray-800 text-white p-4">
      <div className="font-bold text-xl mb-6">Filecase</div>
      <nav className="flex flex-col gap-2">
        {/* These links will only be visible to authenticated users */}
        {/* We'll move the actual pages for these routes in Step 4 */}
        <Link
          to="/vault"
          className="p-2 rounded-md hover:bg-gray-700"
          activeProps={{ className: "bg-blue-600 font-bold" }}
        >
          Vault
        </Link>
        <Link
          to="/library"
          className="p-2 rounded-md hover:bg-gray-700"
          activeProps={{ className: "bg-blue-600 font-bold" }}
        >
          Library
        </Link>
        <Link
          to="/clients"
          className="p-2 rounded-md hover:bg-gray-700"
          activeProps={{ className: "bg-blue-600 font-bold" }}
        >
          Clients
        </Link>
      </nav>
    </aside>
  );
}
