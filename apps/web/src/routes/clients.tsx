import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { AppShell } from "../components/app-shell";
import {
  getCurrentUserServerFn,
  listClientsServerFn,
} from "../server/auth/server-fns";

type ClientRow = Awaited<ReturnType<typeof listClientsServerFn>>[number];

const clientsQueryOptions = queryOptions({
  queryKey: ["clients"],
  queryFn: () => listClientsServerFn(),
});

const columnHelper = createColumnHelper<ClientRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("externalReference", {
    header: "Reference",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("status", {
    header: "Status",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          params={{ clientId: row.original.id }}
          to="/clients/$clientId/engagements"
        >
          Engagements
        </Link>
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          params={{ clientId: row.original.id }}
          to="/clients/$clientId/documents"
        >
          Documents
        </Link>
      </div>
    ),
  }),
];

export const Route = createFileRoute("/clients")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async ({ context }) => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }

    await context.queryClient.ensureQueryData(clientsQueryOptions);
    return user;
  },
  component: ClientsRoutePage,
});

function ClientsRoutePage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isClientsIndex = pathname === "/clients" || pathname === "/clients/";

  if (!isClientsIndex) {
    return <Outlet />;
  }

  return <ClientsPage />;
}

function ClientsPage() {
  const user = Route.useLoaderData();
  const clientsQuery = useQuery(clientsQueryOptions);
  const rows = clientsQuery.data ?? [];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppShell
      description="Browse all clients and jump into engagements or document collections."
      title="Clients"
      user={user}
    >
      <section className="overflow-hidden rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)]">
        <div className="overflow-auto">
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
                  <TableCell
                    className="text-muted-foreground"
                    colSpan={columns.length}
                  >
                    No clients found.
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
        </div>
      </section>
    </AppShell>
  );
}
