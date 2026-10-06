"use client";

import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { BlogListParams } from "@/app/admin/(dashboard)/blogs/blogList";

type FilterKey = "status" | "sort" | "direction";

function FilterSelect<K extends FilterKey>({
  name, label, value, onChange, options,
}: {
  name: K;
  label: string;
  value: BlogListParams[K];
  onChange: (value: BlogListParams[K]) => void;
  options: readonly { value: BlogListParams[K]; label: string }[];
}) {
  return (
    <Listbox name={name} value={value} onChange={onChange}>
      <div className="min-w-0">
        <ListboxLabel className="mb-1.5 block text-xs font-medium text-ink-secondary">{label}</ListboxLabel>
        <ListboxButton className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#72747e] bg-[#131316] px-3 text-left text-sm text-ink-primary transition-colors hover:border-[#aeb0b7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <span className="truncate">{options.find((option) => option.value === value)?.label}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-secondary transition-transform group-data-[open]:rotate-180" />
        </ListboxButton>
        <ListboxOptions anchor="bottom" modal={false} className="z-50 w-[var(--button-width)] rounded-xl border border-[#55555e] bg-[#1b1b1f] p-1.5 text-sm text-[#fafafa] shadow-2xl shadow-black/50 outline-none [--anchor-gap:6px]">
          {options.map((option) => (
            <ListboxOption key={option.value} value={option.value} className="group flex min-h-11 cursor-default items-center justify-between gap-2 rounded-lg px-3 text-[#aeb0b7] transition-colors data-[focus]:bg-[#303036] data-[focus]:text-white data-[selected]:text-white">
              <span className="truncate group-data-[selected]:font-medium">{option.label}</span>
              <Check aria-hidden className="size-4 shrink-0 opacity-0 group-data-[selected]:opacity-100" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

const statuses = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "not-live", label: "Not live" },
  { value: "archived", label: "Archived" },
] as const;
const sorts = [
  { value: "created_at", label: "Created date" },
  { value: "updated_at", label: "Updated date" },
  { value: "published_at", label: "Publication date" },
  { value: "title", label: "Title" },
] as const;
const directions = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
] as const;

export function BlogFilters({ params }: { params: BlogListParams }) {
  const [filters, setFilters] = useState(params);

  return (
    <form action="/admin/blogs" method="get" className="grid gap-3 rounded-xl border border-border-hairline bg-surface-raised p-4 text-sm shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_repeat(3,minmax(9rem,auto))_auto] xl:items-end">
      <div className="min-w-0">
        <label htmlFor="blog-search" className="mb-1.5 block text-xs font-medium text-ink-secondary">Search titles</label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-secondary" />
          <input id="blog-search" name="q" type="search" defaultValue={params.q} maxLength={100} placeholder="Search post titles" className="min-h-11 w-full rounded-lg border border-border-hairline bg-surface-base pl-9 pr-3 text-ink-primary" />
        </div>
      </div>
      <FilterSelect name="status" label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status })} options={statuses} />
      <FilterSelect name="sort" label="Sort by" value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} options={sorts} />
      <FilterSelect name="direction" label="Direction" value={filters.direction} onChange={(direction) => setFilters({ ...filters, direction })} options={directions} />
      <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
        <button type="submit" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-accent-signal px-4 font-medium text-white transition-colors hover:bg-accent-signal/90 xl:flex-none">Apply</button>
        <Link href="/admin/blogs" className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-ink-secondary transition-colors hover:bg-surface-base hover:text-ink-primary">Clear</Link>
      </div>
    </form>
  );
}
