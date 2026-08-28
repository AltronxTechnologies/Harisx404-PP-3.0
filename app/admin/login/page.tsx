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
      className="flex w-full justify-center rounded-xl bg-accent-signal px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-signal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-signal disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-surface-base text-ink-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-3xl font-bold leading-9 tracking-tight">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-ink-secondary">
          Enter your credentials to manage your portfolio
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-surface-raised px-6 py-8 shadow-sm sm:rounded-2xl border border-border-hairline">
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
                  className="block w-full rounded-xl border-0 py-2.5 px-3 bg-surface-base text-ink-primary shadow-sm ring-1 ring-inset ring-border-hairline placeholder:text-ink-secondary focus:ring-2 focus:ring-inset focus:ring-accent-signal sm:text-sm sm:leading-6 transition-all"
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
                  className="block w-full rounded-xl border-0 py-2.5 px-3 bg-surface-base text-ink-primary shadow-sm ring-1 ring-inset ring-border-hairline placeholder:text-ink-secondary focus:ring-2 focus:ring-inset focus:ring-accent-signal sm:text-sm sm:leading-6 transition-all"
                />
              </div>
            </div>

            {state?.error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-950/30">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                      Authentication Failed
                    </h3>
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
