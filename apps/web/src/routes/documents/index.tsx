import { createFileRoute, redirect } from "@tanstack/react-router";

import { getCurrentUserServerFn } from "../../server/auth/server-fns";

export const Route = createFileRoute("/documents/")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    throw redirect({ to: "/" });
  },
  component: () => null,
});
