import { Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';
import {
  BehaviorSubject,
  filter,
  map,
  mapTo,
  merge,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  takeWhile,
  timer,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly STORAGE_KEY = 'taskboard_tasks';
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  lastDeletedTaskSubject$ = new BehaviorSubject<Task | null>(null);

  private clearLastDeletedTimeoutId: ReturnType<typeof setTimeout> | null =
    null;

  readonly tasks$ = this._tasks$.asObservable();
  readonly lastDeletedTask$ = this.lastDeletedTaskSubject$.asObservable();
  deleteTriggered$ = new Subject<void>();
  undoClicked$ = new Subject<void>();

  undoCountdown$ = this.deleteTriggered$.pipe(
    switchMap(() =>
      timer(0, 1000).pipe(
        map((tick) => 10 - tick),
        takeWhile((value) => value >= 0),
        takeUntil(this.undoClicked$)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  showUndo$ = merge(
    this.deleteTriggered$.pipe(mapTo(true)),
    this.undoClicked$.pipe(mapTo(false)),
    this.undoCountdown$
      .pipe(
        filter((v) => v === 0),
        mapTo(false)
      )
      .pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }))
  );

  constructor() {
    this.loadFromStorage();
  }

  private get snapshot(): Task[] {
    return this._tasks$.value;
  }

  private get lastDelTask(): Task | null {
    return this.lastDeletedTaskSubject$.value;
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
    const lastOneTask = this.snapshot.find((task) => task.id === id);

    if (lastOneTask) {
      this.deleteTriggered$.next();
      this.lastDeletedTaskSubject$.next(lastOneTask);

      if (this.clearLastDeletedTimeoutId) {
        clearTimeout(this.clearLastDeletedTimeoutId);
      }

      this.clearLastDeletedTimeoutId = setTimeout(() => {
        this.lastDeletedTaskSubject$.next(null);
        this.clearLastDeletedTimeoutId = null;
      }, 10000);
    }

    this._tasks$.next(updated);
    this.persist(updated);
  }

  undoDelete() {
    if (!this.lastDelTask) return;

    if (this.clearLastDeletedTimeoutId) {
      clearTimeout(this.clearLastDeletedTimeoutId);
      this.clearLastDeletedTimeoutId = null;
    }
    this.undoClicked$.next();

    this.addTask(this.lastDelTask);
    this.lastDeletedTaskSubject$.next(null);
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
