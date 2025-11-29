import { Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);

  readonly tasks$ = this._tasks$.asObservable();

  private get snapshot(): Task[] {
    return this._tasks$.value;
  }

  addTask(task: Task) {
    const updated = [...this.snapshot, task];
    this._tasks$.next(updated);
  }

  updateTask(id: string, newStatus: TaskStatus) {
    const allTasks = [...this.snapshot];

    const tasksWithChangedTask = allTasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t
    );

    this._tasks$.next(tasksWithChangedTask);
  }

  deleteTask(id: string) {
    const allTasks = [...this.snapshot];
    this._tasks$.next(allTasks.filter((task) => task.id !== id));
  }
}
