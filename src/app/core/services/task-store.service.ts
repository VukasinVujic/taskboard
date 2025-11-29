import { computed, Injectable, signal } from '@angular/core';
import { Task } from '../models/task.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly _tasks = signal<Task[]>([]);

  //   tasks = computed(() => this._tasks());

  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);

  readonly tasks$ = this._tasks$.asObservable();

  private get snapshot(): Task[] {
    return this._tasks$.value;
  }

  addTask(task: Task) {
    const updated = [...this.snapshot, task];
    this._tasks$.next(updated);
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
