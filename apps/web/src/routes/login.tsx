import { Button, Input } from "@filecase/ui";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  getCurrentUserServerFn,
  loginServerFn,
} from "../server/auth/server-fns";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (user) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      return loginServerFn({ data: input });
    },
    onSuccess: async () => {
      await navigate({
        to: "/",
      });
    },
    onError: () => {
      setError("Invalid email or password.");
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <section className="rounded-lg border p-6">
        <h1 className="mb-6 text-2xl font-semibold">Login</h1>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            loginMutation.mutate({ email, password });
          }}
        >
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            autoComplete="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
