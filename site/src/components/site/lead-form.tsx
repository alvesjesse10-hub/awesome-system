"use client";

import { useState, type FormEvent } from "react";
import type { SiteContent } from "@/types/content";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadForm({ content }: { content: SiteContent }) {
  const { form, market } = content;
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const data = new FormData(formEl);

    // Honeypot: real users never fill this hidden field.
    if (data.get("company_website")) {
      setStatus("success");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          message: data.get("message"),
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      setStatus("success");
      formEl.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        {form.success}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="name" className="text-sm font-medium text-navy-800">
          {form.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder={form.namePlaceholder}
          className="mt-1.5 w-full rounded-md border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
        />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-navy-800">
          {form.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={form.emailPlaceholder}
          className="mt-1.5 w-full rounded-md border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
        />
      </div>

      <div>
        <label htmlFor="company" className="text-sm font-medium text-navy-800">
          {form.company}
        </label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder={form.companyPlaceholder}
          className="mt-1.5 w-full rounded-md border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
        />
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium text-navy-800">
          {form.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder={form.messagePlaceholder}
          className="mt-1.5 w-full resize-none rounded-md border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{form.error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-navy-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? form.submitting : form.submit}
      </button>

      <p className="text-xs text-navy-400">{form.privacy}</p>
    </form>
  );
}
