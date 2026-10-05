"use client";

import { useState } from "react";
import { BuildlogSelect } from "./BuildlogSelect";

const options = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export function BuildlogListFilters({ q, status }: { q: string; status: (typeof options)[number]["value"] }) {
  const [selected, setSelected] = useState(status);
  return <form action="/admin/buildlog" method="get" className="grid gap-3 rounded-xl border border-border-hairline bg-surface-raised p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
    <div className="min-w-0 space-y-2">
      <label htmlFor="buildlog-search" className="block text-sm font-medium">Search projects</label>
      <input id="buildlog-search" name="q" type="search" defaultValue={q} maxLength={100} placeholder="Find a Buildlog project" className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 text-sm" />
    </div>
    <BuildlogSelect<(typeof options)[number]["value"]> id="buildlog-list-status" name="status" label="Visibility" value={selected} onChange={setSelected} options={options} />
    <button type="submit" className="min-h-11 rounded-xl bg-accent-signal px-5 text-sm font-medium text-white">Apply</button>
  </form>;
}
