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
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { AppShell } from "../components/app-shell";
import {
  exportAuditCsvServerFn,
  listAuditEventsServerFn,
  listAuditUsersServerFn,
} from "../server/audit-fns";
import { getCurrentUserServerFn } from "../server/auth/server-fns";

type AuditRow = Awaited<
  ReturnType<typeof listAuditEventsServerFn>
>["items"][number];

const columnHelper = createColumnHelper<AuditRow>();
const PAGE_SIZE = 25;

export const Route = createFileRoute("/audit")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "admin" && user.role !== "manager") {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "admin" && user.role !== "manager") {
      throw redirect({ to: "/" });
    }

    return user;
  },
  component: AuditPage,
});

function toIsoDateStart(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toIsoDateEnd(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

function downloadTextFile(fileName: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AuditPage() {
  const user = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState("");
  const [clientId, setClientId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [offset, setOffset] = useState(0);

  const usersQuery = useQuery(
    queryOptions({
      queryKey: ["audit-users"],
      queryFn: () => listAuditUsersServerFn(),
    }),
  );

  const auditQuery = useQuery(
    queryOptions({
      queryKey: [
        "audit-events",
        startDate,
        endDate,
        action,
        entityType,
        userId,
        clientId,
        engagementId,
        offset,
      ],
      queryFn: () =>
        listAuditEventsServerFn({
          data: {
            startDate: toIsoDateStart(startDate),
            endDate: toIsoDateEnd(endDate),
            action: action || undefined,
            entityType: entityType || undefined,
            userId: userId || undefined,
            clientId: clientId || undefined,
            engagementId: engagementId || undefined,
            limit: PAGE_SIZE,
            offset,
          },
        }),
    }),
  );

  const exportMutation = useMutation({
    mutationFn: () =>
      exportAuditCsvServerFn({
        data: {
          startDate: toIsoDateStart(startDate),
          endDate: toIsoDateEnd(endDate),
          action: action || undefined,
          entityType: entityType || undefined,
          userId: userId || undefined,
          clientId: clientId || undefined,
          engagementId: engagementId || undefined,
        },
      }),
    onSuccess: (result) => {
      downloadTextFile(result.fileName, result.csv);
      void queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    },
  });

  const rows = auditQuery.data?.items ?? [];
  const total = auditQuery.data?.total ?? 0;

  const columns = [
    columnHelper.accessor("createdAt", {
      header: "Time",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    columnHelper.accessor("actorName", {
      header: "Actor",
      cell: ({ row }) =>
        `${row.original.actorName} (${row.original.actorEmail})`,
    }),
    columnHelper.accessor("action", { header: "Action" }),
    columnHelper.display({
      id: "entity",
      header: "Entity",
      cell: ({ row }) => `${row.original.entityType}:${row.original.entityId}`,
    }),
    columnHelper.accessor("summary", { header: "Summary" }),
    columnHelper.display({
      id: "resource",
      header: "Resource",
      cell: ({ row }) => {
        const documentId = row.original.relatedDocumentId;
        const clientIdValue = row.original.relatedClientId;
        const engagementIdValue = row.original.relatedEngagementId;

        if (documentId) {
          return (
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              params={{ documentId }}
              to="/documents/$documentId"
            >
              Document
            </Link>
          );
        }

        if (clientIdValue && engagementIdValue) {
          return (
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              params={{
                clientId: clientIdValue,
                engagementId: engagementIdValue,
              }}
              to="/clients/$clientId/engagements/$engagementId/documents"
            >
              Engagement
            </Link>
          );
        }

        return <span className="text-muted-foreground">-</span>;
      },
    }),
    columnHelper.display({
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" type="button" variant="outline">
              View
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audit Event Details</DialogTitle>
              <DialogDescription>
                {row.original.action} at{" "}
                {new Date(row.original.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <pre className="max-h-96 overflow-auto rounded-md border bg-muted p-3 text-xs">
              {row.original.metadataJson}
            </pre>
          </DialogContent>
        </Dialog>
      ),
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppShell
      actions={
        <Button
          disabled={exportMutation.isPending}
          type="button"
          onClick={() => exportMutation.mutate()}
        >
          Export CSV
        </Button>
      }
      description="Review system activity and export filtered audit data."
      title="Audit Log"
      user={user}
    >
      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-start-date"
        >
          Date From
          <Input
            autoComplete="off"
            id="audit-start-date"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(event) => {
              setOffset(0);
              setStartDate(event.target.value);
            }}
          />
        </label>
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-end-date"
        >
          Date To
          <Input
            autoComplete="off"
            id="audit-end-date"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(event) => {
              setOffset(0);
              setEndDate(event.target.value);
            }}
          />
        </label>
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-action"
        >
          Action
          <Input
            autoComplete="off"
            id="audit-action"
            name="action"
            placeholder="Action…"
            value={action}
            onChange={(event) => {
              setOffset(0);
              setAction(event.target.value);
            }}
          />
        </label>
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-entity-type"
        >
          Entity Type
          <Input
            autoComplete="off"
            id="audit-entity-type"
            name="entityType"
            placeholder="Entity type…"
            value={entityType}
            onChange={(event) => {
              setOffset(0);
              setEntityType(event.target.value);
            }}
          />
        </label>
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-user-id"
        >
          User
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            id="audit-user-id"
            name="userId"
            value={userId}
            onChange={(event) => {
              setOffset(0);
              setUserId(event.target.value);
            }}
          >
            <option value="">All users</option>
            {(usersQuery.data ?? []).map((userOption) => (
              <option key={userOption.id} value={userOption.id}>
                {userOption.name} ({userOption.email})
              </option>
            ))}
          </select>
        </label>
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-client-id"
        >
          Client ID
          <Input
            autoComplete="off"
            id="audit-client-id"
            name="clientId"
            placeholder="Client ID…"
            value={clientId}
            onChange={(event) => {
              setOffset(0);
              setClientId(event.target.value);
            }}
          />
        </label>
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="audit-engagement-id"
        >
          Engagement ID
          <Input
            autoComplete="off"
            id="audit-engagement-id"
            name="engagementId"
            placeholder="Engagement ID…"
            value={engagementId}
            onChange={(event) => {
              setOffset(0);
              setEngagementId(event.target.value);
            }}
          />
        </label>
      </section>

      {exportMutation.data?.truncated ? (
        <p className="text-sm text-amber-700">
          Export truncated at {exportMutation.data.maxRows} rows.
        </p>
      ) : null}

      <section className="rounded-lg border p-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  No audit events found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <footer className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={offset === 0}
            type="button"
            variant="outline"
            onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            disabled={offset + PAGE_SIZE >= total}
            type="button"
            variant="outline"
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </footer>
    </AppShell>
  );
}
