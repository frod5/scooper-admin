export type UserRole = "system_admin" | "owner" | "employee";
export type UserStatus = "active" | "resigned";
export type RequestStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  branch_id: string | null;
  branch_name: string | null;
};

export type Branch = {
  id: string;
  name: string;
  activeEmployeeCount: number;
};

export type DirectoryPerson = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  branch_id: string | null;
  branch_name: string | null;
};

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type WorkAssignment = {
  id: string;
  user_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  name: string;
  status: UserStatus;
  branch_id: string | null;
  branch_name: string | null;
};

export type ChangeRequest = {
  id: string;
  user_id: string;
  work_date: string;
  requested_date: string;
  requested_start: string;
  requested_end: string;
  reason: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewer_name: string | null;
  name: string;
  branch_id: string | null;
  branch_name: string | null;
  current_start: string | null;
  current_end: string | null;
};

export type InventoryItem = {
  label: string;
  qty: number;
};

export type InventoryMemo = {
  id: string;
  user_id: string;
  author_name: string;
  branch_id: string;
  branch_name: string | null;
  memo_date: string;
  body: string;
  items: InventoryItem[];
  created_at: string;
};

export type MonthScheduleData = {
  assignments: WorkAssignment[];
  requests: ChangeRequest[];
  inventoryMemos: InventoryMemo[];
};

export function emptyMonthData(): MonthScheduleData {
  return { assignments: [], requests: [], inventoryMemos: [] };
}

export type AssignableEmployee = {
  id: string;
  name: string;
  status: UserStatus;
};

export type Notice = {
  id: string;
  author_id: string;
  branch_id: string | null;
  branch_name: string | null;
  title: string;
  body: string;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  user_id: string;
  name: string;
  role: UserRole;
  body: string;
  created_at: string;
};

export type AppNotificationType =
  | "change_request"
  | "change_approved"
  | "change_rejected"
  | "notice"
  | "owner_request";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  url: string;
  read_at: string | null;
  created_at: string;
};
