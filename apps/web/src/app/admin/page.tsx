'use client';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { AdminDashboard } from "@/components/AdminDashboard";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminReports, updateReportStatus } from "@/lib/api";
import { colors } from "@/theme/colors";
import type { ReportRecord, ReportStatus, Role } from "@/types/domain";

const allowedRoles: Role[] = ["ADMIN", "MODERATOR"];

export default function AdminPage() {
  const router = useRouter();
  const { user, isReady, logout } = useAuth();
  const token = user?.token;

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!user || !token || !allowedRoles.includes(user.role)) {
      router.replace("/" as Route);
    }
  }, [isReady, user, token, router]);

  const loadReports = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminReports(token);
      setReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nu am putut încărca rapoartele";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadReports();
  }, [token, loadReports]);

  const handleStatusChange = useCallback(
    async (reportId: number, nextStatus: ReportStatus) => {
      if (!token) return;
      await updateReportStatus(reportId, nextStatus, token);
      await loadReports();
    },
    [token, loadReports]
  );

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/" as Route);
  }, [logout, router]);

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: colors.backgroundMuted }}>
      <header
        className="fixed inset-x-0 top-0 z-20 border-b backdrop-blur"
        style={{ borderColor: colors.placeholder, backgroundColor: "rgba(255,255,255,0.92)" }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/assets/logo-light.svg" alt="CitySafe" className="h-8 w-8 object-contain" />
              <span className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                CitySafe
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium" style={{ color: colors.textSecondary }}>
              <Link href="/admin" className="transition hover:opacity-80">
                Dashboard
              </Link>
              <Link href="/admin#profil-moderator" className="transition hover:opacity-80">
                Profil
              </Link>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-95"
            style={{ backgroundColor: colors.accent, color: colors.textPrimary }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-7xl pt-20" id="profil-moderator">
        <section
          className="rounded-[32px] px-2 py-4 shadow-card"
          style={{ backgroundColor: colors.background, border: `1px solid ${colors.placeholder}` }}
        >
          <AdminDashboard
            reports={reports}
            isLoading={isLoading}
            error={error}
            onStatusChange={handleStatusChange}
          />
        </section>
      </div>
    </main>
  );
}
