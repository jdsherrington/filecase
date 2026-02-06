import { createFileRoute } from "@tanstack/react-router";

import { getHealthStatus } from "../server/health";

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => {
        const health = await getHealthStatus();

        return Response.json(health, {
          status: health.status === "ok" ? 200 : 503,
          headers: {
            "cache-control": "no-store",
          },
        });
      },
    },
  },
  component: () => null,
});
