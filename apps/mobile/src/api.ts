import { API_BASE_URL } from "./config";

function isConnectionRefusedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /network request failed|failed to fetch|connection (was )?refused/i.test(message);
}

function enrichConnectionRefusedMessage(url: string) {
  const apiPort = url.match(/:(\d+)/)?.[1] ?? "4000";
  return [
    `Conexiune refuzata catre ${url}.`,
    "Verifica daca serverul CitySafe ruleaza si este accesibil in aceeasi retea.",
    "Pe Linux (Manjaro) deschide portul folosind, de exemplu, 'sudo ufw allow " + apiPort + "/tcp' sau regula echivalenta cu firewall-cmd.",
    "Pe dispozitive Android fizice ruleaza 'adb reverse tcp:" + apiPort + " tcp:" + apiPort + "' daca vrei sa tunelizezi traficul prin USB."
  ].join(" ");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const hasLeadingSlash = path.startsWith("/");
  const url = `${API_BASE_URL}${hasLeadingSlash ? "" : "/"}${path}`;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isConnectionRefusedError(error)) {
      throw new Error(enrichConnectionRefusedMessage(url));
    }
    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Cererea ${(init?.method ?? "GET").toUpperCase()} ${path} a esuat (${response.status}): ${text}`
    );
  }

  return response.json();
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export type City = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export async function getCities(): Promise<City[]> {
  return request<City[]>("/cities");
}

export type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  token: string;
};

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthUser> {
  return request<AuthUser>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  return request<AuthUser>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export type CreateReportInput = {
  title: string;
  description?: string;
  cityId: number;
  categoryId: number;
  latitude: number;
  longitude: number;
};

export type ReportPhotoPayload = {
  uri: string;
  name: string;
  type: string;
};

export type ReportAttachment = {
  id: number;
  url: string;
  createdAt: string;
};

export type ReportCoordinate = {
  id: number;
  latitude: number;
  longitude: number;
};

export type Report = {
  id: number;
  title: string;
  description?: string | null;
  status: "WAITING" | "NEW" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  category?: Category;
  city?: City;
  coordinate?: ReportCoordinate | null;
  attachments?: ReportAttachment[];
  _count?: {
    likes: number;
  };
  viewerHasLiked?: boolean;
};

export async function createReport(input: CreateReportInput & { photos?: ReportPhotoPayload[] }) {
  const { photos, ...rest } = input;
  const hasPhotos = Array.isArray(photos) && photos.length > 0;
  const headers: Record<string, string> = {
    ...authHeaders()
  };
  let body: any;

  if (hasPhotos) {
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });

    photos?.forEach((photo) => {
      formData.append(
        "photos",
        {
          uri: photo.uri,
          type: photo.type,
          name: photo.name
        } as any
      );
    });

    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(rest);
  }

  return request<Report>("/reports", {
    method: "POST",
    headers,
    body
  });
}

export async function getReports(): Promise<Report[]> {
  return request<Report[]>("/reports", {
    headers: {
      ...authHeaders()
    }
  });
}

export async function getMyReports(): Promise<Report[]> {
  return request<Report[]>("/me/reports", {
    headers: {
      ...authHeaders()
    }
  });
}

export async function toggleReportLike(reportId: number): Promise<{ liked: boolean; count: number }> {
  return request<{ liked: boolean; count: number }>(`/reports/${reportId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({})
  });
}
