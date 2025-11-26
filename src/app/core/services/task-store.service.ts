import { computed, Injectable, signal } from '@angular/core';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly _tasks = signal<Task[]>([]);

  tasks = computed(() => this._tasks());

  addTask(task: Task) {
    this._tasks.update((list) => [...list, task]);
  }

  updateTask(id: string, patch: Partial<Task>) {
    this._tasks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }

  deleteTask(id: string) {
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }
}
