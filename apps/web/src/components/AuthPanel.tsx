'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

export function AuthPanel() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      router.push("/admin" as Route);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nu am putut autentifica";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="rounded-[32px] p-10 shadow-card"
      style={{ backgroundColor: colors.background, border: `1px solid ${colors.placeholder}` }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <img
          src="/assets/logo-light.svg"
          alt="CitySafe logo"
          className="h-16 w-16 object-contain"
        />
        <div>
          <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Autentificare moderatori</p>
        </div>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Conectează-te cu datele furnizate de echipa CitySafe pentru a continua procesarea rapoartelor.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          Email
          <input
            type="email"
            className="mt-2 w-full rounded-2xl border border-transparent px-4 py-3 placeholder:text-[#475569] focus:border-[#00A6A6] focus:outline-none"
            placeholder="ex: moderator@citysafe.ro"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ backgroundColor: colors.placeholder, color: colors.textPrimary }}
            required
          />
        </label>

        <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          Parolă
          <input
            type="password"
            className="mt-2 w-full rounded-2xl border border-transparent px-4 py-3 placeholder:text-[#475569] focus:border-[#00A6A6] focus:outline-none"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ backgroundColor: colors.placeholder, color: colors.textPrimary }}
            required
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">{error}</p>
        ) : null}

        <button
          type="submit"
          className="mt-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: colors.accent, color: colors.textPrimary }}
          disabled={pending}
        >
          {pending ? "Se încarcă..." : "Login"}
        </button>

        <p className="text-center text-xs" style={{ color: colors.textSecondary }}>
          Nu ai încă acces? Contactează administratorul CitySafe pentru a primi un cont de moderator.
        </p>
      </form>
    </div>
  );
}
