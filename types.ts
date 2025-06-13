export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string; // Optional: Store as YYYY-MM-DD
  priority?: 'low' | 'medium' | 'high'; // Optional
  notes?: string; // Optional
  subTasks?: Task[]; // For sub-tasks
  parentId?: string; // ID of the parent task, if this is a sub-task
  isExpanded?: boolean; // To control UI expansion of sub-tasks
  completedAt?: string; // ISO string for completion timestamp
}

export type TabId = 'start' | 'daily' | 'weekly' | 'monthly' | 'completed';

export interface TabDefinition {
  id: TabId;
  label: string; // For tab button text
  title: string; // For tab content heading
}

export type TasksState = Record<TabId, Task[]>;

export interface ProjectTemplate {
  id: string; // Unique ID for the template
  name: string; // User-defined name for the template
  tasksState: TasksState; // The full tasks state snapshot for this template
  createdAt: string; // ISO string of creation date
}

export type ProjectTemplates = ProjectTemplate[];

// --- Filter and Sort Types ---
export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'همه وضعیت‌ها' },
  { value: 'completed', label: 'تکمیل‌شده' },
  { value: 'incomplete', label: 'ناتمام' },
] as const;

export const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'همه اولویت‌ها' },
  { value: 'high', label: 'زیاد' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'کم' },
  { value: 'none', label: 'بدون اولویت' },
] as const;

export const SORT_BY_OPTIONS = [
  { value: 'default', label: 'پیش‌فرض (افزودن)' },
  { value: 'dueDate', label: 'تاریخ سررسید' },
  { value: 'priority', label: 'اولویت' },
  { value: 'text', label: 'متن وظیفه' },
] as const;

export type FilterStatusValue = typeof STATUS_FILTER_OPTIONS[number]['value'];
export type FilterPriorityValue = typeof PRIORITY_FILTER_OPTIONS[number]['value'];
export type SortByValue = typeof SORT_BY_OPTIONS[number]['value'];

export interface FilterSettings {
  status: FilterStatusValue;
  priority: FilterPriorityValue;
  sortBy: SortByValue;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
}