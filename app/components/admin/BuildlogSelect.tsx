"use client";

import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

export function BuildlogSelect<T extends string>({ id, name, label, value, onChange, options, errorId, disabled = false }: {
  id: string;
  name?: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; hint?: string }[];
  errorId?: string;
  disabled?: boolean;
}) {
  return <Listbox name={name} value={value} onChange={onChange} disabled={disabled}>
    <div className="min-w-0 space-y-2">
      <ListboxLabel className="block text-sm font-medium text-ink-primary">{label}</ListboxLabel>
      <ListboxButton id={id} disabled={disabled} aria-invalid={Boolean(errorId)} aria-describedby={errorId} className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 text-left text-sm text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50">
        <span className="min-w-0 truncate">{options.find((option) => option.value === value)?.label}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-secondary transition-transform group-data-[open]:rotate-180" />
      </ListboxButton>
      <ListboxOptions anchor="bottom" modal={false} className="z-50 max-h-[min(24rem,calc(100dvh-6rem))] w-[var(--button-width)] overflow-y-auto rounded-xl border border-[#55555e] bg-[#1b1b1f] p-1.5 text-sm text-white shadow-2xl outline-none [--anchor-gap:6px]">
        {options.map((option) => <ListboxOption key={option.value} value={option.value} className="group flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-white data-[focus]:bg-[#303036] data-[selected]:bg-white data-[selected]:text-[#101013]">
          <span className="min-w-0"><span className="block font-medium">{option.label}</span>{option.hint && <span className="block text-xs opacity-75">{option.hint}</span>}</span>
          <Check aria-hidden className="size-4 shrink-0 opacity-0 group-data-[selected]:opacity-100" />
        </ListboxOption>)}
      </ListboxOptions>
    </div>
  </Listbox>;
}
