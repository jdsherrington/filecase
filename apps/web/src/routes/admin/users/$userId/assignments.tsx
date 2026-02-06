import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@filecase/ui";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  assignClientServerFn,
  assignEngagementServerFn,
  getUserAssignmentsServerFn,
  listFirmClientsServerFn,
  listFirmEngagementsServerFn,
  unassignClientServerFn,
  unassignEngagementServerFn,
} from "../../../../server/admin/assignment-fns";
import { getCurrentUserServerFn } from "../../../../server/auth/server-fns";

export const Route = createFileRoute("/admin/users/$userId/assignments")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "admin" && user.role !== "manager") {
      throw redirect({ to: "/" });
    }
  },
  component: UserAssignmentsPage,
});

function UserAssignmentsPage() {
  const { userId } = Route.useParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"clients" | "engagements">("clients");
  const [clientSearch, setClientSearch] = useState("");
  const [engagementSearch, setEngagementSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedEngagementId, setSelectedEngagementId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const assignmentsQuery = useQuery(
    queryOptions({
      queryKey: ["user-assignments", userId],
      queryFn: () => getUserAssignmentsServerFn({ data: { userId } }),
    }),
  );

  const clientsQuery = useQuery(
    queryOptions({
      queryKey: ["firm-clients"],
      queryFn: () => listFirmClientsServerFn(),
    }),
  );

  const engagementsQuery = useQuery(
    queryOptions({
      queryKey: ["firm-engagements"],
      queryFn: () => listFirmEngagementsServerFn(),
    }),
  );

  const refreshAssignments = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["user-assignments", userId],
    });
  };

  const assignClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await assignClientServerFn({ data: { userId, clientId } });
    },
    onSuccess: async () => {
      setError(null);
      setSelectedClientId(null);
      await refreshAssignments();
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to assign client",
      );
    },
  });

  const unassignClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await unassignClientServerFn({ data: { userId, clientId } });
    },
    onSuccess: refreshAssignments,
  });

  const assignEngagementMutation = useMutation({
    mutationFn: async (engagementId: string) => {
      await assignEngagementServerFn({ data: { userId, engagementId } });
    },
    onSuccess: async () => {
      setError(null);
      setSelectedEngagementId(null);
      await refreshAssignments();
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to assign engagement",
      );
    },
  });

  const unassignEngagementMutation = useMutation({
    mutationFn: async (engagementId: string) => {
      await unassignEngagementServerFn({ data: { userId, engagementId } });
    },
    onSuccess: refreshAssignments,
  });

  const assignments = assignmentsQuery.data;
  const assignedClientIds = useMemo(
    () => new Set(assignments?.clients.map((entry) => entry.clientId) ?? []),
    [assignments],
  );
  const assignedEngagementIds = useMemo(
    () =>
      new Set(
        assignments?.engagements.map((entry) => entry.engagementId) ?? [],
      ),
    [assignments],
  );

  const availableClients = useMemo(() => {
    const rows = clientsQuery.data ?? [];
    return rows.filter((row) => {
      const isUnassigned = !assignedClientIds.has(row.id);
      const matchesSearch = row.name
        .toLowerCase()
        .includes(clientSearch.toLowerCase());
      return isUnassigned && matchesSearch;
    });
  }, [assignedClientIds, clientSearch, clientsQuery.data]);

  const availableEngagements = useMemo(() => {
    const rows = engagementsQuery.data ?? [];
    return rows.filter((row) => {
      const isUnassigned = !assignedEngagementIds.has(row.id);
      const label = `${row.clientName} ${row.name}`.toLowerCase();
      return isUnassigned && label.includes(engagementSearch.toLowerCase());
    });
  }, [assignedEngagementIds, engagementSearch, engagementsQuery.data]);

  if (!assignments) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Loading assignments...
      </p>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {assignments.user.name} ({assignments.user.role})
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to="/admin/users"
        >
          Back to Users
        </Link>
      </header>

      <section className="flex items-center gap-3">
        <Button
          type="button"
          variant={tab === "clients" ? "default" : "outline"}
          onClick={() => setTab("clients")}
        >
          Clients
        </Button>
        <Button
          type="button"
          variant={tab === "engagements" ? "default" : "outline"}
          onClick={() => setTab("engagements")}
        >
          Engagements
        </Button>
      </section>

      {tab === "clients" ? (
        <section className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Assigned Clients</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button">Assign Client</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Client</DialogTitle>
                  <DialogDescription>
                    Search and select a client to assign.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Search clients"
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                  />
                  <div className="max-h-56 space-y-2 overflow-auto rounded-md border p-2">
                    {availableClients.map((client) => (
                      <button
                        key={client.id}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                          selectedClientId === client.id ? "bg-muted" : ""
                        }`}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        {client.name}
                      </button>
                    ))}
                    {availableClients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No matching clients.
                      </p>
                    ) : null}
                  </div>
                  <Button
                    disabled={
                      !selectedClientId || assignClientMutation.isPending
                    }
                    type="button"
                    onClick={() => {
                      if (selectedClientId) {
                        assignClientMutation.mutate(selectedClientId);
                      }
                    }}
                  >
                    Confirm Assign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>No client assignments.</TableCell>
                </TableRow>
              ) : (
                assignments.clients.map((entry) => (
                  <TableRow key={entry.assignmentId}>
                    <TableCell>{entry.clientName}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" type="button" variant="outline">
                            Unassign
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Unassign Client</DialogTitle>
                            <DialogDescription>
                              This removes {assignments.user.name} from{" "}
                              {entry.clientName}.
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            disabled={unassignClientMutation.isPending}
                            type="button"
                            onClick={() =>
                              unassignClientMutation.mutate(entry.clientId)
                            }
                          >
                            Confirm Unassign
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      ) : (
        <section className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Assigned Engagements</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button">Assign Engagement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Engagement</DialogTitle>
                  <DialogDescription>
                    Search and select an engagement to assign.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Search engagements"
                    value={engagementSearch}
                    onChange={(event) =>
                      setEngagementSearch(event.target.value)
                    }
                  />
                  <div className="max-h-56 space-y-2 overflow-auto rounded-md border p-2">
                    {availableEngagements.map((engagement) => (
                      <button
                        key={engagement.id}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                          selectedEngagementId === engagement.id
                            ? "bg-muted"
                            : ""
                        }`}
                        type="button"
                        onClick={() => setSelectedEngagementId(engagement.id)}
                      >
                        {engagement.clientName} - {engagement.name}
                      </button>
                    ))}
                    {availableEngagements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No matching engagements.
                      </p>
                    ) : null}
                  </div>
                  <Button
                    disabled={
                      !selectedEngagementId ||
                      assignEngagementMutation.isPending
                    }
                    type="button"
                    onClick={() => {
                      if (selectedEngagementId) {
                        assignEngagementMutation.mutate(selectedEngagementId);
                      }
                    }}
                  >
                    Confirm Assign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engagement</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.engagements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No engagement assignments.</TableCell>
                </TableRow>
              ) : (
                assignments.engagements.map((entry) => {
                  const engagement = (engagementsQuery.data ?? []).find(
                    (row) => row.id === entry.engagementId,
                  );

                  return (
                    <TableRow key={entry.assignmentId}>
                      <TableCell>{entry.engagementName}</TableCell>
                      <TableCell>
                        {engagement?.clientName ?? entry.clientId}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" type="button" variant="outline">
                              Unassign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Unassign Engagement</DialogTitle>
                              <DialogDescription>
                                This removes {assignments.user.name} from{" "}
                                {entry.engagementName}.
                              </DialogDescription>
                            </DialogHeader>
                            <Button
                              disabled={unassignEngagementMutation.isPending}
                              type="button"
                              onClick={() =>
                                unassignEngagementMutation.mutate(
                                  entry.engagementId,
                                )
                              }
                            >
                              Confirm Unassign
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </section>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
