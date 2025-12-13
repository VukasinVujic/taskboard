import { Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly STORAGE_KEY = 'taskboard_tasks';
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);

  readonly tasks$ = this._tasks$.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private get snapshot(): Task[] {
    return this._tasks$.value;
  }

  addTask(task: Task): void {
    const updated = [...this.snapshot, task];
    this._tasks$.next(updated);
    this.persist(updated);
  }

  updateTaskByStatus(id: string, newStatus: TaskStatus): void {
    const allTasks = [...this.snapshot];

    const updated = allTasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t
    );

    this._tasks$.next(updated);
    this.persist(updated);
  }

  updateTaskDetails(task: Task) {
    const allTasks = [...this.snapshot];

    const updated = allTasks.map((t) => (t.id === task.id ? task : t));
    this._tasks$.next(updated);
    this.persist(updated);
  }

  deleteTask(id: string): void {
    const updated = this.snapshot.filter((task) => task.id !== id);
    this._tasks$.next(updated);
    this.persist(updated);
  }

  private persist(tasks: Task[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);

    if (!stored) return;

    try {
      const tasks = JSON.parse(stored) as Task[];
      this._tasks$.next(tasks);
    } catch (e) {
      console.error('Failed to parse tasks from storage', e);
    }
  }
}
