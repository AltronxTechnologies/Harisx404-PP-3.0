"use client";

import { login } from "@/app/lib/supabase/auth";
import { Loader2 } from "lucide-react";
import { useFormStatus, useFormState } from "react-dom";
import * as React from "react";

// React 19 renamed ReactDOM.useFormState → React.useActionState. Next's
// bundled runtime already ships the new hook, but our React 18 types don't
// know it yet — fall back gracefully so both runtimes work without warnings.
const useActionStateCompat: typeof useFormState =
  (React as any).useActionState ?? useFormState;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center rounded-full bg-text-primary px-5 py-3 text-sm font-medium text-bg-primary transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export default function AdminLogin() {
  const [state, formAction] = useActionStateCompat(login, null);

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col justify-center px-4 py-16 text-text-primary sm:px-6">
      <div className="mx-auto w-full max-w-[420px] text-center">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Private workspace</p>
        <h1 className="mt-4 font-display text-[40px] font-medium leading-none sm:text-5xl">
          Admin Portal
        </h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">
          Enter your credentials to manage your portfolio
        </p>
      </div>

      <div className="mx-auto mt-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-border-primary bg-white px-5 py-7 dark:bg-white/[0.03] sm:px-8 sm:py-8">
          <form action={formAction} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-4 py-2.5 text-base text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-4 py-2.5 text-base text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 sm:text-sm"
                />
              </div>
            </div>

            {state?.error && (
              <div role="alert" className="rounded-xl border border-red-300/40 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-950/30">
                <div className="flex">
                  <div className="ml-3">
                    <h2 className="text-sm font-medium text-red-800 dark:text-red-300">
                      Authentication Failed
                    </h2>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                      <p>{state.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
