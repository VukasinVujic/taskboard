import { inject, Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  filter,
  map,
  mapTo,
  merge,
  Observable,
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
import { ToastService } from './toast.service';

interface StatusChangeRequest {
  id: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
}

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly STORAGE_KEY = 'taskboard_tasks';
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  private toastService = inject(ToastService);
  lastDeletedTaskSubject$ = new BehaviorSubject<Task | null>(null);
  private _updatingTaskIds$ = new BehaviorSubject<Set<string>>(new Set());
  readonly updatingTaskIds$ = this._updatingTaskIds$.asObservable();

  readonly tasks$ = this._tasks$.asObservable();
  readonly lastDeletedTask$ = this.lastDeletedTaskSubject$.asObservable();
  deleteTriggered$ = new Subject<void>();
  undoClicked$ = new Subject<void>();

  statusChangeRequested$ = new Subject<StatusChangeRequest>();

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

    this.statusChangeRequested$
      .pipe(
        tap((request) => this.startUpdating(request.id)),
        switchMap((request) =>
          this.fakeUpdateStatusApi(request).pipe(
            tap(() => this.stopUpdating(request.id)),
            catchError((error) => {
              console.error('API error occurred', error);
              this.rollbackStatus(request);
              this.stopUpdating(request.id);
              this.toastService.show(
                'API error occurred, status change failed',
                'error'
              );
              return EMPTY;
            })
          )
        )
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

    const oldTask = this.snapshot.find((task) => task.id === id);

    if (!oldTask) return;

    this.statusChangeRequested$.next({
      id,
      oldStatus: oldTask.status,
      newStatus,
    });

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

  private fakeUpdateStatusApi(arg: StatusChangeRequest): Observable<void> {
    return timer(3000).pipe(
      map(() => {
        if (Math.random() > 0.5) {
          console.log('API SUCCESS');
        } else {
          throw new Error('API FAILED');
        }
      })
    );
  }

  private rollbackStatus(request: StatusChangeRequest): void {
    const updated = this.snapshot.map((t) =>
      t.id === request.id ? { ...t, status: request.oldStatus } : t
    );

    this._tasks$.next(updated);
    this.persist(updated);
  }

  private startUpdating(id: string): void {
    const list = this._updatingTaskIds$.value;

    const nextList = new Set(list);
    nextList.add(id);

    this._updatingTaskIds$.next(nextList);
  }

  private stopUpdating(id: string): void {
    const list = this._updatingTaskIds$.value;

    const nextList = new Set(list);

    nextList.delete(id);

    this._updatingTaskIds$.next(nextList);
  }
}
