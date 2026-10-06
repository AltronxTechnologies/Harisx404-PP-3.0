"use client";

import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { isValidBlogDate, todayUtcDate } from "@/app/lib/blog-defaults";

export function BlogDatePicker({ value, onChange, errorId }: { value: string; onChange: (value: string) => void; errorId?: string }) {
  const [month, setMonth] = useState(() => {
    const seed = value && isValidBlogDate(value) ? value : todayUtcDate();
    return new Date(`${seed.slice(0, 7)}-01T00:00:00.000Z`);
  });
  const firstWeekday = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)).getUTCDay();
  const days = Array.from({ length: 42 }, (_, index) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index - firstWeekday + 1)));
  const selected = value && isValidBlogDate(value) ? new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Choose a date";

  return <Popover className="relative min-w-0">
    {({ close }) => <>
      <PopoverButton id="blog-published-at" aria-labelledby="blog-published-at-label blog-published-at" aria-invalid={Boolean(errorId)} aria-describedby={errorId || "blog-published-at-hint"} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border-hairline bg-surface-base px-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        <span>{selected}</span><CalendarDays className="size-4 shrink-0" aria-hidden />
      </PopoverButton>
      <PopoverPanel className="absolute left-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-3rem))] rounded-2xl border border-border-hairline bg-[#1b1b1f] p-4 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))} className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-semibold" aria-live="polite">{month.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</span>
          <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))} className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10"><ChevronRight className="size-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <div className="mt-2 grid min-w-[320px] grid-cols-7 text-center text-xs text-[#aeb0b7]">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
          <div role="group" aria-label="Choose publish date" className="grid min-w-[320px] grid-cols-7 gap-0.5">
            {days.map((day) => {
              const iso = todayUtcDate(day);
              const current = day.getUTCMonth() === month.getUTCMonth();
              return <button key={iso} type="button" aria-label={day.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} aria-pressed={value === iso} onClick={() => { onChange(iso); close(); }} className={`min-h-11 min-w-11 rounded-lg text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${value === iso ? "bg-white font-bold text-[#101013]" : current ? "text-white hover:bg-white/10" : "text-[#73747e] hover:bg-white/10"}`}>{day.getUTCDate()}</button>;
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs">
          <button type="button" onClick={() => { const today = todayUtcDate(); onChange(today); setMonth(new Date(`${today.slice(0, 7)}-01T00:00:00.000Z`)); close(); }} className="min-h-11 rounded-lg px-2 hover:bg-white/10">Today</button>
          <button type="button" onClick={() => { onChange(""); close(); }} className="min-h-11 rounded-lg px-2 hover:bg-white/10">Clear date</button>
        </div>
      </PopoverPanel>
    </>}
  </Popover>;
}
