export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

export interface TeamMember extends UserProfile {
  roleInEvent: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
}

export interface EventTask {
  id: string;
  title: string;
  assignee?: UserProfile;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  status: EventStatus;
  imageUrl?: string;
  budgetTotal: number;
  budgetSpent: number;
  attendeesExpected: number;
  attendeesRegistered: number;
  team: TeamMember[];
  tasks: EventTask[];
  categories: BudgetCategory[];
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  upcomingTasks: number;
  pendingApprovals: number;
  budgetUtilization: number;
}