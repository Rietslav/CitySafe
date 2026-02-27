import { API_BASE_URL } from "./config";

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
  const response = await fetch(`${API_BASE_URL}/cities`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET /cities failed (${response.status}): ${text}`);
  }
  return response.json();
}

export type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET /categories failed (${response.status}): ${text}`);
  }
  return response.json();
}

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN";
  token: string;
};

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST /auth/register failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST /auth/login failed (${response.status}): ${text}`);
  }

  return response.json();
}

export type CreateReportInput = {
  title: string;
  description?: string;
  cityId: number;
  categoryId: number;
};

export async function createReport(input: CreateReportInput) {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST /reports failed (${response.status}): ${text}`);
  }

  return response.json();
}
