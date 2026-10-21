"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettingsAction } from "./actions";

type Field = {
  key: string;
  label: string;
  description: string;
  type: "bool" | "int" | "text";
  value: string;
};

export function SettingsForm({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await saveSettingsAction(values);
      if (!result.ok) setMessage({ ok: false, text: result.error });
      else {
        setMessage({ ok: true, text: "Saqlandi." });
        router.refresh();
      }
      setTimeout(() => setMessage(null), 4000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0 max-w-xl">
              <p className="text-sm font-semibold text-slate-800">{field.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{field.description}</p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-400">{field.key}</p>
            </div>

            <div className="shrink-0">
              {field.type === "bool" ? (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values[field.key] === "true"}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [field.key]: e.target.checked ? "true" : "false",
                      }))
                    }
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-sm text-slate-600">
                    {values[field.key] === "true" ? "Yoqilgan" : "O'chirilgan"}
                  </span>
                </label>
              ) : (
                <input
                  type={field.type === "int" ? "number" : "text"}
                  min={field.type === "int" ? 0 : undefined}
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "..." : "Saqlash"}
        </button>
        {message && (
          <span className={`text-sm ${message.ok ? "text-emerald-600" : "text-rose-600"}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
