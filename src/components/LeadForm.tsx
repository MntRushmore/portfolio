"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { submitLead } from "@/app/free/actions";
import {
  LEAD_LIMITS,
  readLead,
  validateLead,
  type LeadField,
  type LeadState,
} from "@/lib/leads";

const IDLE: LeadState = { status: "idle" };
const CONTACT_ERROR_ID = "lead-contact-error";

/** Checks here first, so mistakes show at once instead of after a round trip. */
async function send(previous: LeadState, formData: FormData): Promise<LeadState> {
  const values = readLead(formData);
  const errors = validateLead(values);
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors, values };
  }

  try {
    return await submitLead(previous, formData);
  } catch {
    // Offline, a dropped connection, or a page left open across a deploy.
    return {
      status: "failed",
      message: "That didn’t send. Check your signal and try again.",
      values,
    };
  }
}

export function LeadForm({ thanks }: { thanks: string }) {
  // Each new business gets a fresh, empty form.
  const [round, setRound] = useState(0);
  return (
    <LeadFormRound
      key={round}
      thanks={thanks}
      onAnother={() => setRound((n) => n + 1)}
    />
  );
}

function LeadFormRound({
  thanks,
  onAnother,
}: {
  thanks: string;
  onAnother: () => void;
}) {
  const [state, formAction, pending] = useActionState(send, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "invalid") {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    }
    if (state.status === "sent") sentRef.current?.focus();
  }, [state]);

  if (state.status === "sent") {
    const first = state.values?.name?.split(/\s+/)[0];
    return (
      <div className="lead-sent">
        <h3 ref={sentRef} tabIndex={-1} className="type-h3 outline-none">
          {first ? `Thanks, ${first}.` : "Thanks."} Got it.
        </h3>
        <p className="type-lead mt-4 max-w-[30ch]">{thanks}</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/#work" className="btn">
            See what I’ve made
          </Link>
          <button
            type="button"
            onClick={onAnother}
            className="link inline-flex min-h-11 items-center text-[length:var(--t-ui)] font-bold"
          >
            Add another business
          </button>
        </div>
      </div>
    );
  }

  const { errors = {}, values = {} } = state;
  const contactError = errors.contact ? CONTACT_ERROR_ID : undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="relative grid gap-x-6 gap-y-8 sm:grid-cols-2"
    >
      <Field
        name="name"
        label="Your name"
        autoComplete="name"
        error={errors.name}
        value={values.name}
      />
      <Field
        name="business"
        label="Business name"
        autoComplete="organization"
        error={errors.business}
        value={values.business}
      />

      <fieldset
        className="sm:col-span-2"
        aria-describedby={["lead-contact-hint", contactError].filter(Boolean).join(" ")}
      >
        <legend className="font-semibold text-[length:var(--t-ui)]">
          How can I reach you?
        </legend>
        <p
          id="lead-contact-hint"
          className="mt-1 text-[length:var(--t-small)] text-ink-2"
        >
          Phone or email, whichever you check more.
        </p>
        <div className="mt-4 grid gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field
            name="phone"
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone}
            sharedError={contactError}
            value={values.phone}
          />
          <Field
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            error={errors.email}
            sharedError={contactError}
            value={values.email}
          />
        </div>
        {errors.contact && (
          <p id={CONTACT_ERROR_ID} className="field-error mt-3">
            {errors.contact}
          </p>
        )}
      </fieldset>

      <Field
        name="location"
        label="Where is it?"
        hint="Neighborhood or address"
        optional
        autoComplete="off"
        error={errors.location}
        value={values.location}
      />
      <Field
        name="website"
        label="Current website"
        hint="If you have one"
        optional
        inputMode="url"
        autoComplete="url"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.website}
        value={values.website}
      />
      <Field
        name="notes"
        label="Anything else?"
        hint="What you sell, what the site should do, a good time to reach you"
        optional
        multiline
        className="sm:col-span-2"
        error={errors.notes}
        value={values.notes}
      />

      {/* Hidden from people; bots fill it in, and the server drops those. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="lead-homepage">Leave this empty</label>
        <input
          id="lead-homepage"
          name="homepage"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:col-span-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Sending…" : "Send my details"}
        </button>
        <p role="status" className="font-semibold text-brick">
          {state.status === "failed"
            ? state.message
            : state.status === "invalid"
              ? "Check the marked fields, then send again."
              : ""}
        </p>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  optional,
  error,
  sharedError,
  value,
  multiline,
  className,
  ...input
}: {
  name: LeadField;
  label: string;
  hint?: string;
  optional?: boolean;
  /** This field's own problem. */
  error?: string;
  /** Id of a message that covers this field and others (phone or email). */
  sharedError?: string;
  /** What was typed last time, kept when the form comes back with errors. */
  value?: string;
  multiline?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "className">) {
  const id = `lead-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = {
    id,
    name,
    defaultValue: value,
    maxLength: LEAD_LIMITS[name],
    "aria-invalid": error || sharedError ? true : undefined,
    "aria-describedby":
      [hintId, errorId, sharedError].filter(Boolean).join(" ") || undefined,
    className: "field mt-2.5",
  } as const;

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-semibold text-[length:var(--t-ui)]">
        {label}
        {optional && <span className="font-normal text-ink-2"> (optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-[length:var(--t-small)] text-ink-2">
          {hint}
        </p>
      )}
      {multiline ? <textarea rows={4} {...control} /> : <input {...control} {...input} />}
      {error && (
        <p id={errorId} className="field-error mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
