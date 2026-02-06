import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
  cn,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, FileText, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { listClientsServerFn } from "../server/auth/server-fns";

type ClientRow = Awaited<ReturnType<typeof listClientsServerFn>>[number];
type StatusFilter = "all" | "active" | "archived";
type SortFilter = "name-asc" | "name-desc" | "created-desc" | "created-asc";

type FilterOption<TValue extends string> = {
  label: string;
  value: TValue;
};

const columnHelper = createColumnHelper<ClientRow>();

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "archived" },
];

const SORT_OPTIONS: FilterOption<SortFilter>[] = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Newest first", value: "created-desc" },
  { label: "Oldest first", value: "created-asc" },
];

function formatStatus(status: ClientRow["status"]): string {
  return status === "active" ? "Active" : "Inactive";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

type FilterDropdownProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: FilterOption<TValue>[];
  onChange: (nextValue: TValue) => void;
};

function FilterDropdown<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps<TValue>) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="justify-between" type="button" variant="outline">
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as TValue)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ContactsArea() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortFilter>("name-asc");
  const [showInactive, setShowInactive] = useState(false);
  const [hasReferenceOnly, setHasReferenceOnly] = useState(false);

  const clientsQuery = useQuery(
    queryOptions({
      queryKey: ["contacts-area-clients"],
      queryFn: () => listClientsServerFn(),
    }),
  );

  const filteredRows = useMemo(() => {
    const rows = [...(clientsQuery.data ?? [])];
    const needle = search.trim().toLowerCase();

    const searched = needle
      ? rows.filter(
          (row) =>
            row.name.toLowerCase().includes(needle) ||
            row.externalReference?.toLowerCase().includes(needle),
        )
      : rows;

    const inactiveFiltered = showInactive
      ? searched
      : searched.filter((row) => row.status === "active");

    const statusFiltered =
      status === "all"
        ? inactiveFiltered
        : inactiveFiltered.filter((row) => row.status === status);

    const referenceFiltered = hasReferenceOnly
      ? statusFiltered.filter((row) => Boolean(row.externalReference))
      : statusFiltered;

    return referenceFiltered.sort((left, right) => {
      if (sort === "name-asc") {
        return left.name.localeCompare(right.name);
      }

      if (sort === "name-desc") {
        return right.name.localeCompare(left.name);
      }

      if (sort === "created-asc") {
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }, [clientsQuery.data, hasReferenceOnly, search, showInactive, sort, status]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Client name",
      }),
      columnHelper.accessor("externalReference", {
        header: "Reference",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
              info.getValue() === "active"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            {formatStatus(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Date added",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              aria-label={`Edit ${row.original.name}`}
              className={buttonVariants({ variant: "outline", size: "icon" })}
              params={{ clientId: row.original.id }}
              title="Edit contact"
              to="/clients/$clientId/engagements"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <Link
              aria-label={`View ${row.original.name} records`}
              className={buttonVariants({ variant: "outline", size: "icon" })}
              search={{ contactId: row.original.id }}
              title="View records"
              to="/"
            >
              <FileText className="h-4 w-4" />
            </Link>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            autoComplete="off"
            className="w-full min-w-[17rem] flex-1"
            placeholder="Search contacts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <FilterDropdown
            label="Sort"
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setSort("name-asc");
              setShowInactive(false);
              setHasReferenceOnly(false);
            }}
          >
            Clear filters/search
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={showInactive}
              id="show-inactive"
              onCheckedChange={(checked) => setShowInactive(checked === true)}
            />
            <label htmlFor="show-inactive">Show Inactive</label>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={hasReferenceOnly}
              id="has-reference"
              onCheckedChange={(checked) =>
                setHasReferenceOnly(checked === true)
              }
            />
            <label htmlFor="has-reference">Has Reference</label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)]">
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
            {clientsQuery.isLoading ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columns.length}
                >
                  Loading contacts...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columns.length}
                >
                  No contacts match these filters.
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
    </div>
  );
}
