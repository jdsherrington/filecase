import {
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Check, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { listClientsServerFn } from "../server/auth/server-fns";
import { listDocumentsServerFn } from "../server/document-fns";

type RecordsAreaMode = "records" | "templates" | "internal";
type DateAddedFilter = "all" | "7d" | "30d" | "90d";
type PageSize = "30" | "60" | "90" | "120";
type StatusFilter = "uploaded" | "in_review" | "final";

type FilterOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type DocumentRow = Awaited<
  ReturnType<typeof listDocumentsServerFn>
>["items"][number];

const columnHelper = createColumnHelper<DocumentRow>();

const PAGE_SIZES: FilterOption<PageSize>[] = [
  { label: "30", value: "30" },
  { label: "60", value: "60" },
  { label: "90", value: "90" },
  { label: "120", value: "120" },
];

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { label: "Uploaded", value: "uploaded" },
  { label: "In review", value: "in_review" },
  { label: "Final", value: "final" },
];

const DATE_ADDED_OPTIONS: FilterOption<DateAddedFilter>[] = [
  { label: "Any time", value: "all" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

function toUtcDayStart(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

function toDateAddedStart(value: DateAddedFilter): string | undefined {
  if (value === "all") {
    return undefined;
  }

  const days = Number.parseInt(value.replace("d", ""), 10);
  const boundary = new Date();
  boundary.setUTCDate(boundary.getUTCDate() - days);

  return toUtcDayStart(boundary);
}

function typeOptions(mode: RecordsAreaMode): FilterOption<string>[] {
  if (mode === "templates") {
    return [{ label: "Template", value: "template" }];
  }

  if (mode === "internal") {
    return [
      { label: "Internal", value: "internal" },
      { label: "Policy", value: "policy" },
      { label: "HR", value: "hr" },
    ];
  }

  return [
    { label: "Template", value: "template" },
    { label: "Internal", value: "internal" },
    { label: "Policy", value: "policy" },
    { label: "HR", value: "hr" },
  ];
}

function areaSearchPlaceholder(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "Search templates";
  }

  if (mode === "internal") {
    return "Search internal records";
  }

  return "Search records";
}

function areaLoadingMessage(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "Loading templates...";
  }

  if (mode === "internal") {
    return "Loading internal records...";
  }

  return "Loading records...";
}

function areaEmptyMessage(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "No templates match these filters.";
  }

  if (mode === "internal") {
    return "No internal records match these filters.";
  }

  return "No records match these filters.";
}

function formatStatus(value: string): string {
  return value.replace("_", " ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

type SingleFilterComboboxProps<TValue extends string> = {
  label: string;
  placeholder: string;
  value: TValue;
  options: FilterOption<TValue>[];
  onChange: (nextValue: TValue) => void;
};

function SingleFilterSelect<TValue extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
}: SingleFilterComboboxProps<TValue>) {
  const [open, setOpen] = useState(false);
  const fieldId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const currentLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption;
  const animatedLabel = useCrossfadeText(currentLabel, isPlaceholder);

  return (
    <div className="w-[11.5rem] shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <button
            aria-controls={`${fieldId}-listbox`}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={label}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] px-3 text-xs transition-[box-shadow,border-color,outline-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--ring)]",
              open ? "ring-1 ring-[color:var(--ring)]" : undefined,
            )}
            type="button"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="relative block min-w-0 flex-1 text-left text-xs leading-none">
              {animatedLabel.previousText ? (
                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 truncate",
                    animatedLabel.previousText
                      ? "fc-filter-value-out"
                      : undefined,
                    animatedLabel.previousMuted
                      ? "text-muted-foreground"
                      : undefined,
                  )}
                >
                  {animatedLabel.previousText}
                </span>
              ) : null}
              <span
                className={cn(
                  "block truncate",
                  animatedLabel.previousText ? "fc-filter-value-in" : undefined,
                  animatedLabel.currentMuted
                    ? "text-muted-foreground"
                    : undefined,
                )}
              >
                {animatedLabel.currentText}
              </span>
            </span>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] border-[color:var(--fc-content-border)] p-1"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-56" id={`${fieldId}-listbox`}>
              {options.length === 0 ? (
                <CommandEmpty className="px-2 py-2 text-xs text-muted-foreground">
                  No options found.
                </CommandEmpty>
              ) : (
                options.map((option) => {
                  const selected = value === option.value;

                  return (
                    <CommandItem
                      className={cn(
                        "cursor-pointer gap-2 text-xs data-[selected=true]:bg-transparent data-[selected=true]:text-foreground",
                        selected &&
                          "bg-[color:var(--fc-table-row-hover)] text-foreground",
                      )}
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span
                        className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center text-foreground transition-opacity duration-150",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function hasSameSelections<TValue extends string>(
  left: TValue[],
  right: TValue[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);

  return left.every((value) => rightSet.has(value));
}

type CrossfadeTextState = {
  currentText: string;
  currentMuted: boolean;
  previousText: string | null;
  previousMuted: boolean;
};

function useCrossfadeText(text: string, muted = false): CrossfadeTextState {
  const [state, setState] = useState<CrossfadeTextState>({
    currentText: text,
    currentMuted: muted,
    previousText: null,
    previousMuted: muted,
  });
  const previousInputRef = useRef({ text, muted });

  useEffect(() => {
    const previousInput = previousInputRef.current;

    if (previousInput.text === text && previousInput.muted === muted) {
      return;
    }

    previousInputRef.current = { text, muted };

    setState((previousState) => ({
      currentText: text,
      currentMuted: muted,
      previousText: previousState.currentText,
      previousMuted: previousState.currentMuted,
    }));

    const timeoutId = window.setTimeout(() => {
      setState((previousState) =>
        previousState.previousText === null
          ? previousState
          : { ...previousState, previousText: null },
      );
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [muted, text]);

  return state;
}

type MultiFilterComboboxProps<TValue extends string> = {
  label: string;
  pluralLabel: string;
  placeholder: string;
  defaultValues: TValue[];
  values: TValue[];
  options: FilterOption<TValue>[];
  onChange: (nextValues: TValue[]) => void;
};

function MultiFilterCombobox<TValue extends string>({
  label,
  pluralLabel,
  placeholder,
  defaultValues,
  values,
  options,
  onChange,
}: MultiFilterComboboxProps<TValue>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showSingularCountSummary, setShowSingularCountSummary] =
    useState(false);
  const fieldId = useId();
  const previousValuesLengthRef = useRef(values.length);

  const optionLabelByValue = useMemo(() => {
    const map = new Map<TValue, string>();

    for (const option of options) {
      map.set(option.value, option.label);
    }

    return map;
  }, [options]);

  const closedSummaryValue = useMemo(() => {
    if (values.length === 0) {
      return "";
    }

    if (values.length === 1) {
      const [singleValue] = values;

      return singleValue ? (optionLabelByValue.get(singleValue) ?? "") : "";
    }

    return `${values.length} ${pluralLabel}`;
  }, [optionLabelByValue, pluralLabel, values]);

  const shouldUseSingularCountSummary =
    showSingularCountSummary ||
    (previousValuesLengthRef.current !== 1 && values.length === 1);

  const openSummaryValue = useMemo(() => {
    if (values.length === 0) {
      return "";
    }

    if (values.length === 1) {
      if (shouldUseSingularCountSummary) {
        return `1 ${label}`;
      }

      const [singleValue] = values;
      return singleValue ? (optionLabelByValue.get(singleValue) ?? "") : "";
    }

    return `${values.length} ${pluralLabel}`;
  }, [
    label,
    optionLabelByValue,
    pluralLabel,
    shouldUseSingularCountSummary,
    values,
  ]);

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const showClear =
    values.length > 0 && !hasSameSelections(values, defaultValues);
  const displayValue =
    open && query.length > 0
      ? query
      : open
        ? openSummaryValue
        : closedSummaryValue;
  const animatedValue = useCrossfadeText(displayValue);
  const shouldUseValueOverlay = query.length === 0;
  const hasDisplayValue = displayValue.length > 0;
  const shouldShowValueOverlay = shouldUseValueOverlay;
  const shouldHideNativeInputText = shouldUseValueOverlay && hasDisplayValue;

  useEffect(() => {
    const previousLength = previousValuesLengthRef.current;
    const nextLength = values.length;

    if (previousLength !== 1 && nextLength === 1) {
      setShowSingularCountSummary(true);
    } else if (nextLength !== 1) {
      setShowSingularCountSummary(false);
    }

    previousValuesLengthRef.current = nextLength;
  }, [values.length]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setShowSingularCountSummary(false);
    }
  }, [open]);

  return (
    <div className="w-[11.5rem] shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <button
              aria-hidden={!showClear}
              aria-label={`Clear ${label.toLowerCase()} filter`}
              className={cn(
                "absolute inset-y-0 left-0 z-10 flex w-8 cursor-pointer items-center justify-center text-[color:color-mix(in_oklch,var(--muted-foreground)_78%,transparent)] transition-[opacity,color] duration-220 ease-out hover:text-[color:var(--fc-destructive)]",
                showClear
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none",
              )}
              tabIndex={showClear ? 0 : -1}
              type="button"
              onClick={() => {
                if (!showClear) {
                  return;
                }

                onChange(defaultValues);
                setOpen(false);
                setQuery("");
              }}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <Input
              aria-autocomplete="list"
              aria-controls={`${fieldId}-listbox`}
              aria-expanded={open}
              aria-label={label}
              className={cn(
                "h-9 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] pr-8 text-xs transition-[padding-left] duration-230 ease-[cubic-bezier(0.22,1,0.36,1)]",
                shouldHideNativeInputText ? "text-transparent" : undefined,
                open ? "ring-1 ring-[color:var(--ring)]" : undefined,
                showClear ? "pl-8 delay-50" : "delay-0",
              )}
              placeholder={placeholder}
              role="combobox"
              value={displayValue}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpen(false);
                  return;
                }

                if (event.key === "Enter" && filteredOptions.length === 1) {
                  event.preventDefault();
                  const [singleMatch] = filteredOptions;

                  if (singleMatch) {
                    onChange([singleMatch.value]);
                    setOpen(false);
                    setQuery("");
                  }
                }
              }}
            />
            {shouldShowValueOverlay ? (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-3 right-8 flex items-center overflow-hidden text-xs leading-4 transition-transform duration-230 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                  showClear
                    ? "translate-x-5 delay-50"
                    : "translate-x-0 delay-0",
                )}
              >
                <span className="relative block w-full truncate">
                  {animatedValue.previousText !== null ? (
                    <span className="pointer-events-none absolute inset-0 truncate fc-filter-value-out">
                      {animatedValue.previousText}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "block truncate",
                      animatedValue.previousText !== null
                        ? "fc-filter-value-in"
                        : undefined,
                    )}
                  >
                    {animatedValue.currentText}
                  </span>
                </span>
              </div>
            ) : null}
            <button
              aria-label={`Toggle ${label.toLowerCase()} options`}
              className="absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-center text-muted-foreground"
              tabIndex={-1}
              type="button"
              onClick={() => setOpen((current) => !current)}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
            >
              {open ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] border-[color:var(--fc-content-border)] p-1"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-56" id={`${fieldId}-listbox`}>
              {filteredOptions.length === 0 ? (
                <CommandEmpty className="px-2 py-2 text-xs text-muted-foreground">
                  No options found.
                </CommandEmpty>
              ) : (
                filteredOptions.map((option) => {
                  const checked = values.includes(option.value);
                  const toggleValue = () => {
                    const nextValues = checked
                      ? values.filter((value) => value !== option.value)
                      : [...values, option.value];
                    onChange(nextValues);
                  };

                  return (
                    <CommandItem
                      className={cn(
                        "cursor-pointer gap-2 text-xs data-[selected=true]:bg-transparent data-[selected=true]:text-foreground",
                        checked &&
                          "bg-[color:var(--fc-table-row-hover)] text-foreground",
                      )}
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange([option.value]);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <button
                        aria-label={`${checked ? "Deselect" : "Select"} ${option.label}`}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] transition-[box-shadow,border-color,outline-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--ring)]"
                        tabIndex={0}
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleValue();
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          className="pointer-events-none h-3.5 w-3.5 border-[color:color-mix(in_oklch,var(--fc-content-border)_78%,white_22%)]"
                        />
                      </button>
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function defaultContactFilters(
  mode: RecordsAreaMode,
  presetClientId?: string,
): string[] {
  if (mode === "templates") {
    return [];
  }

  return presetClientId ? [presetClientId] : [];
}

function defaultPageSize(): PageSize {
  return "30";
}

function defaultStatusFilters(): StatusFilter[] {
  return [];
}

function defaultFileTypeFilters(_mode: RecordsAreaMode): string[] {
  return [];
}

function modeDocumentTypeBaseline(mode: RecordsAreaMode): string[] | undefined {
  if (mode === "templates") {
    return ["template"];
  }

  if (mode === "internal") {
    return ["internal"];
  }

  return undefined;
}

function defaultDateAddedFilter(): DateAddedFilter {
  return "all";
}

export function RecordsArea({
  mode,
  presetClientId,
}: {
  mode: RecordsAreaMode;
  presetClientId?: string;
}) {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<StatusFilter[]>(
    defaultStatusFilters(),
  );
  const [dateAdded, setDateAdded] = useState<DateAddedFilter>(
    defaultDateAddedFilter(),
  );
  const [pageSize, setPageSize] = useState<PageSize>(defaultPageSize());
  const [contactIds, setContactIds] = useState<string[]>(
    defaultContactFilters(mode, presetClientId),
  );
  const [fileTypes, setFileTypes] = useState<string[]>(
    defaultFileTypeFilters(mode),
  );
  const [offset, setOffset] = useState(0);

  const clientsQuery = useQuery(
    queryOptions({
      queryKey: ["records-area-clients"],
      queryFn: () => listClientsServerFn(),
    }),
  );

  const clientOptions = useMemo<FilterOption<string>[]>(() => {
    if (mode === "templates") {
      return [{ label: "Not linked", value: "none" }];
    }

    const items = clientsQuery.data ?? [];
    return items.map((client) => ({
      label: client.name,
      value: client.id,
    }));
  }, [clientsQuery.data, mode]);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();

    for (const client of clientsQuery.data ?? []) {
      map.set(client.id, client.name);
    }

    return map;
  }, [clientsQuery.data]);

  const limit = Number.parseInt(pageSize, 10);

  const documentsQuery = useQuery(
    queryOptions({
      queryKey: [
        "records-area-documents",
        mode,
        search,
        statuses,
        dateAdded,
        pageSize,
        contactIds,
        fileTypes,
        offset,
      ],
      queryFn: () =>
        listDocumentsServerFn({
          data: {
            q: search || undefined,
            statuses: statuses.length > 0 ? statuses : undefined,
            uploadedDateStart: toDateAddedStart(dateAdded),
            clientIds:
              mode === "templates" || contactIds.length === 0
                ? undefined
                : contactIds,
            documentTypes:
              fileTypes.length > 0 ? fileTypes : modeDocumentTypeBaseline(mode),
            sortBy: "updated_at",
            sortDirection: "desc",
            limit,
            offset,
          },
        }),
    }),
  );

  const rows = documentsQuery.data?.items ?? [];
  const total = documentsQuery.data?.total ?? 0;
  const visibleStart = total === 0 ? 0 : offset + 1;
  const visibleEnd = Math.min(offset + limit, total);

  const columns = useMemo(
    () =>
      mode === "internal"
        ? [
            columnHelper.accessor("title", {
              header: "Record title",
            }),
            columnHelper.accessor("documentType", {
              header: "Filetype",
            }),
            columnHelper.accessor("status", {
              header: "Status",
              cell: (info) => (
                <span className="inline-flex rounded-full border border-[color:var(--fc-content-border)] px-2 py-0.5 text-[0.68rem] font-medium capitalize text-muted-foreground">
                  {formatStatus(info.getValue())}
                </span>
              ),
            }),
            columnHelper.accessor("latestUploadedBy", {
              header: "Linked user",
              cell: (info) =>
                info.row.original.latestUploadedBy === "-"
                  ? "General"
                  : info.row.original.latestUploadedBy,
            }),
            columnHelper.accessor("updatedAt", {
              header: "Date modified",
              cell: (info) => formatDate(info.getValue()),
            }),
            columnHelper.accessor("createdAt", {
              header: "Date added",
              cell: (info) => formatDate(info.getValue()),
            }),
          ]
        : [
            columnHelper.accessor("title", {
              header: "Record title",
            }),
            columnHelper.accessor("documentType", {
              header: "Filetype",
            }),
            columnHelper.accessor("status", {
              header: "Status",
              cell: (info) => (
                <span className="inline-flex rounded-full border border-[color:var(--fc-content-border)] px-2 py-0.5 text-[0.68rem] font-medium capitalize text-muted-foreground">
                  {formatStatus(info.getValue())}
                </span>
              ),
            }),
            columnHelper.accessor("clientId", {
              header: "Client name",
              cell: (info) =>
                mode === "templates"
                  ? "Not linked"
                  : (clientNameById.get(info.getValue()) ?? "Unknown"),
            }),
            columnHelper.accessor("updatedAt", {
              header: "Date modified",
              cell: (info) => formatDate(info.getValue()),
            }),
            columnHelper.accessor("createdAt", {
              header: "Date added",
              cell: (info) => formatDate(info.getValue()),
            }),
          ],
    [clientNameById, mode],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[17rem] flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={areaSearchPlaceholder(mode)}
              autoComplete="off"
              className="h-9 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] pl-8 text-xs"
              placeholder={areaSearchPlaceholder(mode)}
              type="search"
              value={search}
              onChange={(event) => {
                setOffset(0);
                setSearch(event.target.value);
              }}
            />
          </div>
          <Button
            className="h-9 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] px-3 text-xs"
            type="button"
            variant="outline"
            onClick={() => {
              setOffset(0);
              setSearch("");
              setStatuses(defaultStatusFilters());
              setDateAdded("all");
              setPageSize("30");
              setContactIds(defaultContactFilters(mode, presetClientId));
              setFileTypes(defaultFileTypeFilters(mode));
            }}
          >
            Clear filters/search
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <MultiFilterCombobox
            defaultValues={defaultContactFilters(mode, presetClientId)}
            label="Contact"
            options={clientOptions}
            placeholder="Contact"
            pluralLabel="Contacts"
            values={contactIds}
            onChange={(nextValues) => {
              setOffset(0);
              setContactIds(nextValues);
            }}
          />
          <MultiFilterCombobox
            defaultValues={defaultStatusFilters()}
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="Status"
            pluralLabel="Statuses"
            values={statuses}
            onChange={(nextValues) => {
              setOffset(0);
              setStatuses(nextValues);
            }}
          />
          <SingleFilterSelect
            label="Date added"
            options={DATE_ADDED_OPTIONS}
            placeholder="Date added"
            value={dateAdded}
            onChange={(nextValue) => {
              setOffset(0);
              setDateAdded(nextValue);
            }}
          />
          <MultiFilterCombobox
            defaultValues={defaultFileTypeFilters(mode)}
            label="Filetype"
            options={typeOptions(mode)}
            placeholder="Filetype"
            pluralLabel="Filetypes"
            values={fileTypes}
            onChange={(nextValues) => {
              setOffset(0);
              setFileTypes(nextValues);
            }}
          />
          <SingleFilterSelect
            label="Rows per page"
            options={PAGE_SIZES}
            placeholder="Rows per page"
            value={pageSize}
            onChange={(nextValue) => {
              setOffset(0);
              setPageSize(nextValue);
            }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)]">
        <Table className="text-xs">
          <TableHeader className="[&_tr]:border-[color:var(--fc-content-border)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="border-[color:var(--fc-content-border)] hover:bg-transparent"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="h-9 px-3 text-[0.68rem] font-semibold tracking-[0.045em] uppercase"
                    key={header.id}
                  >
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
            {documentsQuery.isLoading ? (
              <TableRow className="border-[color:var(--fc-content-border)] hover:bg-transparent">
                <TableCell
                  className="px-3 py-2.5 text-xs text-muted-foreground"
                  colSpan={columns.length}
                >
                  {areaLoadingMessage(mode)}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="border-[color:var(--fc-content-border)] hover:bg-transparent">
                <TableCell
                  className="px-3 py-2.5 text-xs text-muted-foreground"
                  colSpan={columns.length}
                >
                  {areaEmptyMessage(mode)}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="border-[color:var(--fc-content-border)] hover:bg-[color:var(--fc-table-row-hover)]"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="px-3 py-2.5 text-xs" key={cell.id}>
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

      <footer className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "No results"
            : `Showing ${visibleStart}-${visibleEnd} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            className="h-8 border-[color:var(--fc-content-border)] px-2.5 text-xs"
            disabled={offset === 0}
            type="button"
            variant="outline"
            onClick={() => setOffset((current) => Math.max(0, current - limit))}
          >
            Previous
          </Button>
          <Button
            className="h-8 border-[color:var(--fc-content-border)] px-2.5 text-xs"
            disabled={offset + limit >= total}
            type="button"
            variant="outline"
            onClick={() => setOffset((current) => current + limit)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}
