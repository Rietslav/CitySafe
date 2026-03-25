import type { AuthenticatedUser, ReportRecord, ReportStatus, Role } from "@/types/domain";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ApiOptions = {
  method?: string;
  body?: Record<string, unknown> | FormData;
  token?: string;
};

type CredentialsPayload = {
  email: string;
  password: string;
};

type RegisterPayload = CredentialsPayload & {
  firstName: string;
  lastName: string;
  role?: Role;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: HeadersInit = {};
  let body: BodyInit | undefined;

  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    credentials: "include"
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const errorMessage = data?.error ?? data?.message ?? res.statusText;
    throw new Error(errorMessage);
  }

  return data as T;
}

export async function registerRequest(payload: RegisterPayload) {
  return apiRequest<AuthenticatedUser>("/auth/register", {
    method: "POST",
    body: payload
  });
}

export async function loginRequest(payload: CredentialsPayload) {
  return apiRequest<AuthenticatedUser>("/auth/login", {
    method: "POST",
    body: payload
  });
}

export async function fetchAdminReports(token: string) {
  return apiRequest<ReportRecord[]>("/admin/reports", {
    token
  });
}

export async function updateReportStatus(
  reportId: number,
  status: ReportStatus,
  token: string,
  note?: string
) {
  return apiRequest<ReportRecord>(`/reports/${reportId}/status`, {
    method: "PATCH",
    body: { status, note },
    token
  });
}
