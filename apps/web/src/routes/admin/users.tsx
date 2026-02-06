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
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { AppShell } from "../../components/app-shell";
import { listUsersServerFn } from "../../server/admin/assignment-fns";
import { getCurrentUserServerFn } from "../../server/auth/server-fns";

type UserRow = Awaited<ReturnType<typeof listUsersServerFn>>[number];

const userColumn = createColumnHelper<UserRow>();

const usersQueryOptions = queryOptions({
  queryKey: ["admin-users"],
  queryFn: () => listUsersServerFn(),
});

const columns = [
  userColumn.accessor("name", { header: "Name" }),
  userColumn.accessor("email", { header: "Email" }),
  userColumn.accessor("role", { header: "Role" }),
  userColumn.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link
        className={buttonVariants({ variant: "outline", size: "sm" })}
        params={{ userId: row.original.id }}
        to="/admin/users/$userId/assignments"
      >
        Manage Assignments
      </Link>
    ),
  }),
];

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "admin" && user.role !== "manager") {
      throw redirect({ to: "/" });
    }
  },
  loader: async ({ context }) => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "admin" && user.role !== "manager") {
      throw redirect({ to: "/" });
    }

    await context.queryClient.ensureQueryData(usersQueryOptions);
    return user;
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const user = Route.useLoaderData();
  const usersQuery = useQuery(usersQueryOptions);
  const rows = usersQuery.data ?? [];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppShell
      description="Manage staff access by opening each user's assignment matrix."
      title="Team Assignments"
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
                  <TableCell colSpan={columns.length}>
                    No users found in this firm.
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
