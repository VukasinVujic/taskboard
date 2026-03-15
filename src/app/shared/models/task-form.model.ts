export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskFormValue {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
}
