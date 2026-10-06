"use client";

import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: (confirmation: string) => void;
  confirmText?: string;
  pending?: boolean;
  destructive?: boolean;
};

export function AdminConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Cancel", onClose, onConfirm, confirmText, pending = false, destructive = false }: Props) {
  return (
    <Dialog open={open} onClose={() => { if (!pending) onClose(); }} className="fixed inset-0 z-[7000] dark">
      <div aria-hidden="true" className="fixed inset-0 bg-black/75" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md rounded-3xl border border-white/15 bg-[#1b1b1f] p-5 text-[#fafafa] shadow-2xl sm:p-6">
          <div className={`mb-5 flex size-11 items-center justify-center rounded-2xl ${destructive ? "bg-red-500/10 text-red-300" : "bg-white/10 text-white"}`}>
            <AlertTriangle aria-hidden className="size-5" />
          </div>
          <DialogTitle className="font-display text-2xl font-medium leading-tight">{title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#b5b5bd]">{description}</DialogDescription>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" autoFocus onClick={onClose} disabled={pending} className="min-h-11 rounded-full border border-white/25 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50">{cancelLabel}</button>
            <button type="button" onClick={() => onConfirm(confirmText ?? "")} disabled={pending} className={`min-h-11 rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 ${destructive ? "bg-red-700 text-white hover:bg-red-600" : "bg-white text-[#101013] hover:bg-[#dedee2]"}`}>{pending ? "Working..." : confirmLabel}</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
