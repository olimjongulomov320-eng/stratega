"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { btn, type BtnVariant } from "./ui";
import type { ActionState } from "@/lib/admin-types";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/** A form bound to a server action, showing its error / success message. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirm,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>}
    </form>
  );
}

export function Submit({ children, variant = "primary", size = "md", name, value }: { children: React.ReactNode; variant?: BtnVariant; size?: "sm" | "md"; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} name={name} value={value} className={btn(variant, size)}>
      {pending ? "..." : children}
    </button>
  );
}

/** One-button form (e.g. "Delete", "Confirm"), with optional confirm dialog. */
export function ActionButton({
  action,
  children,
  variant = "secondary",
  size = "sm",
  confirm,
  fields = {},
}: {
  action: Action;
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: "sm" | "md";
  confirm?: string;
  fields?: Record<string, string>;
}) {
  return (
    <ActionForm action={action} confirm={confirm} className="inline-block">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Submit variant={variant} size={size}>
        {children}
      </Submit>
    </ActionForm>
  );
}
