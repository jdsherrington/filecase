// web/src/components/ui/search-bar.tsx

import * as React from "react";
import { Search } from "lucide-react"; // Import the search icon
import { Input } from "./input"; // Import the shadcn/ui Input

export function SearchBar() {
  // Use React's useState to store and update the user's search query
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    // The wrapper div is crucial for positioning the icon inside the input
    <div className="relative w-full max-w-sm">
      {/* The Search icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      {/* The Input component from shadcn/ui */}
      <Input
        type="search"
        placeholder="Search anything"
        // The `pl-10` class adds padding on the left to make space for the icon
        className="pl-10"
        // Bind the input's value to our state
        value={searchQuery}
        // Update the state every time the user types
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
