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
  take,
  takeUntil,
  takeWhile,
  tap,
  timer,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly STORAGE_KEY = 'taskboard_tasks';
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  lastDeletedTaskSubject$ = new BehaviorSubject<Task | null>(null);

  readonly tasks$ = this._tasks$.asObservable();
  readonly lastDeletedTask$ = this.lastDeletedTaskSubject$.asObservable();
  deleteTriggered$ = new Subject<void>();
  undoClicked$ = new Subject<void>();

  // showing the counter value
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

  // only to show/hide undo container
  showUndo$ = merge(
    this.deleteTriggered$.pipe(mapTo(true)),
    this.undoClicked$.pipe(mapTo(false)),
    this.undoCountdown$.pipe(
      filter((v) => v === 0),
      mapTo(false)
    )
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));

  constructor() {
    this.loadFromStorage();
    this.deleteTriggered$
      .pipe(
        switchMap(() =>
          merge(
            this.undoClicked$,
            this.undoCountdown$.pipe(filter((v) => v === 0))
          ).pipe(take(1))
        ),
        tap(() => this.lastDeletedTaskSubject$.next(null))
      )
      .subscribe();
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
    }

    this._tasks$.next(updated);
    this.persist(updated);
  }

  undoDelete() {
    const task = this.lastDelTask;

    if (!task) return;

    this.addTask(task);
    this.undoClicked$.next();
  }

  private persist(tasks: Task[]): void {
    const safe = tasks.filter(Boolean);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safe));
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);

    if (!stored) return;

    try {
      const raw = JSON.parse(stored) as unknown[];

      const tasks = raw.filter((t): t is Task => {
        return (
          !!t &&
          typeof t === 'object' &&
          'id' in t &&
          'title' in t &&
          'status' in t &&
          'createdAt' in t
        );
      });

      this._tasks$.next(tasks);
    } catch (e) {
      console.error('Failed to parse tasks from storage', e);
    }
  }
}
