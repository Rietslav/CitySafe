export type Role = "USER" | "ADMIN" | "MODERATOR";

export type ReportStatus = "WAITING" | "NEW" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export type ReportRecord = {
  id: number;
  title: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  city?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  user?: { id: number; firstName: string; lastName: string; email: string } | null;
};

export type AuthenticatedUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  token: string;
};
