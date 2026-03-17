export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface TaskFormValue {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  status?: TaskStatus;
}
