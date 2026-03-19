'use client';

import { useCallback, useMemo, useState } from "react";

import type { ReportRecord, ReportStatus } from "@/types/domain";
import { colors } from "@/theme/colors";

const createdAtFormatter = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "medium",
  timeStyle: "short"
});

const statusOrder: ReportStatus[] = ["WAITING", "NEW", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export function formatStatus(status: ReportStatus) {
  switch (status) {
    case "WAITING":
      return "În așteptare";
    case "NEW":
      return "Nouă";
    case "IN_PROGRESS":
      return "În lucru";
    case "RESOLVED":
      return "Rezolvată";
    case "REJECTED":
      return "Respinsă";
    default:
      return status;
  }
}

const statusStyles: Record<ReportStatus, { badge: string }> = {
  WAITING: { badge: "bg-[#E2E8F0] text-[#475569]" },
  NEW: { badge: "bg-[#dff5f5] text-[#0B0F14]" },
  IN_PROGRESS: { badge: "bg-[#dff5f5] text-[#0B0F14]" },
  RESOLVED: { badge: "bg-[#dff5f5] text-[#0B0F14]" },
  REJECTED: { badge: "bg-[#E2E8F0] text-[#475569]" }
};

type AdminDashboardProps = {
  reports: ReportRecord[];
  isLoading: boolean;
  error?: string | null;
  onStatusChange: (reportId: number, nextStatus: ReportStatus, note?: string) => Promise<void>;
};

export function AdminDashboard({ reports, isLoading, error, onStatusChange }: AdminDashboardProps) {
  const [localPending, setLocalPending] = useState<Record<number, boolean>>({});
  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [reports]
  );

  const handleStatusChange = useCallback(
    async (reportId: number, nextStatus: ReportStatus) => {
      setLocalPending((prev) => ({ ...prev, [reportId]: true }));
      try {
        await onStatusChange(reportId, nextStatus);
      } finally {
        setLocalPending((prev) => {
          const next = { ...prev };
          delete next[reportId];
          return next;
        });
      }
    },
    [onStatusChange]
  );

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-20 animate-pulse rounded-2xl p-4"
                style={{ backgroundColor: colors.background }}
              >
                <div className="h-3 w-1/3 rounded-full" style={{ backgroundColor: colors.placeholder }} />
                <div className="mt-3 h-3 w-2/3 rounded-full" style={{ backgroundColor: colors.backgroundMuted }} />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !reports.length ? (
          <div
            className="rounded-3xl border border-dashed p-10 text-center"
            style={{ borderColor: colors.placeholder, backgroundColor: colors.background, color: colors.textSecondary }}
          >
            Nu există rapoarte de afișat. Încearcă să reîmprospătezi sau verifică mai târziu.
          </div>
        ) : null}

        <section
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: colors.placeholder, backgroundColor: colors.background }}
        >
          <div
            className="hidden grid-cols-[2fr_1fr_1fr_220px] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase md:grid"
            style={{ borderColor: colors.placeholder, color: colors.textSecondary }}
          >
            <span>Raport</span>
            <span>Oraș / Categorie</span>
            <span>Status</span>
            <span>Actualizează</span>
          </div>

          <ul className="divide-y" style={{ borderColor: colors.placeholder }}>
            {sortedReports.map((report) => {
            const meta = statusStyles[report.status];
            const isUpdating = Boolean(localPending[report.id]);
            return (
              <li
                key={report.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[2fr_1fr_1fr_220px] md:items-center"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: report.status === "WAITING" ? colors.accent : "transparent" }}
                    aria-hidden
                  />
                  <div>
                    <h2 className="text-sm font-semibold md:text-base" style={{ color: colors.textPrimary }}>
                      {report.title}
                    </h2>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Creat {createdAtFormatter.format(new Date(report.createdAt))}
                    </p>
                    {report.user ? (
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        Raportat de {report.user.firstName} {report.user.lastName}
                      </p>
                    ) : null}
                    {report.description ? (
                      <p className="mt-1 line-clamp-2 text-xs md:text-sm" style={{ color: colors.textSecondary }}>
                        {report.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs" style={{ color: colors.textSecondary }}>
                  {report.category?.name ? (
                    <span className="rounded-full px-3 py-1" style={{ backgroundColor: colors.placeholder }}>
                      {report.category.name}
                    </span>
                  ) : null}
                  {report.city?.name ? (
                    <span className="rounded-full px-3 py-1" style={{ backgroundColor: colors.placeholder }}>
                      {report.city.name}
                    </span>
                  ) : null}
                  {report.user ? (
                    <span className="rounded-full px-3 py-1" style={{ backgroundColor: colors.backgroundMuted }}>
                      Utilizator: {report.user.email}
                    </span>
                  ) : null}
                </div>

                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                    {formatStatus(report.status)}
                  </span>
                </div>

                <label className="flex flex-col gap-2 text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Status
                  <select
                    className="rounded-xl border px-3 py-2 text-sm font-medium focus:outline-none"
                    value={report.status}
                    onChange={(event) => handleStatusChange(report.id, event.target.value as ReportStatus)}
                    disabled={isUpdating}
                    style={{
                      borderColor: colors.placeholder,
                      backgroundColor: colors.backgroundMuted,
                      color: colors.textPrimary
                    }}
                  >
                    {statusOrder.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                {isUpdating ? (
                  <p className="text-xs font-medium" style={{ color: colors.accent }}>
                    Se sincronizează...
                  </p>
                ) : null}
              </li>
            );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
