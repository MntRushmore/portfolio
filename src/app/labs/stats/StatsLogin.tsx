"use client";

import { useActionState } from "react";
import { unlockStats, type LoginState } from "./actions";

export function StatsLogin() {
  const [state, action, pending] = useActionState<LoginState, FormData>(unlockStats, {});
  return (
    <form action={action} className="mt-8 flex max-w-[26rem] flex-col gap-3">
      <label htmlFor="stats-key" className="type-meta">
        Key
      </label>
      <input
        id="stats-key"
        name="key"
        type="password"
        required
        autoComplete="current-password"
        className="field"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "stats-key-error" : undefined}
      />
      {state.error && (
        <p id="stats-key-error" className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn mt-2 self-start" disabled={pending}>
        {pending ? "Checking…" : "Open"}
      </button>
    </form>
  );
}
