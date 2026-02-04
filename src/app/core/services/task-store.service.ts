import { DestroyRef, inject, Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concat,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  mapTo,
  merge,
  Observable,
  of,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { ToastService } from './toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface StatusChangeRequest {
  id: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
}

interface SuccessEvent {
  type: 'success';
  tasks: Task[];
}

interface ErrorEvent {
  type: 'error';
}

interface LoadingEvent {
  type: 'loading';
}

type SearchEvent = SuccessEvent | ErrorEvent | LoadingEvent;

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  // ======= constants =======
  private readonly STORAGE_KEY = 'taskboard_tasks';
  private readonly TASKBOARD_UI_PREFS_KEY = 'taskboard_ui_prefs';
  private readonly keyWordsStatus = [
    'all',
    'todo',
    'in-progress',
    'done',
  ] as const;

  // ======= deps ========
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ======= states =======
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this._tasks$.asObservable();

  private readonly _searchTerm$ = new BehaviorSubject<string>('');
  readonly searchTerm$ = this._searchTerm$.asObservable();

  private readonly _statusFilter$ = new BehaviorSubject<TaskStatus | 'all'>(
    'all',
  );
  readonly statusFilter$ = this._statusFilter$.asObservable();

  private readonly _updatingTaskIds$ = new BehaviorSubject<Set<string>>(
    new Set(),
  );
  readonly updatingTaskIds$ = this._updatingTaskIds$.asObservable();

  private readonly _deleteTriggered$ = new Subject<void>();

  private readonly _lastDeletedTask$ = new BehaviorSubject<Task | null>(null);
  readonly lastDeletedTask$ = this._lastDeletedTask$.asObservable();

  private readonly _undoClicked$ = new Subject<void>();

  private readonly _statusChangeRequested$ = new Subject<StatusChangeRequest>();

  private readonly _retryClicked$ = new Subject<void>();

  constructor() {
    this.loadFromStorage();
    this.loadFromStorageSearchInput();
    this.connectEffects();
  }

  searchRequest$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    map((term) => term.trim()),
  );

  retryTerm$ = this._retryClicked$.pipe(
    withLatestFrom(this.searchRequest$),
    map(([_, term]) => {
      return term;
    }),
    filter((term) => term.length >= 2),
  );

  searchTrigger$ = merge(this.searchRequest$, this.retryTerm$);

  searchEvents$ = this.searchTrigger$.pipe(
    switchMap((term) => {
      if (term.length < 2) {
        return this.tasks$.pipe(
          map((tasks): SuccessEvent => ({ type: 'success', tasks })),
        );
      }

      const loading$ = of({ type: 'loading' } as const);

      const api$ = this.fakeSearchApi(term).pipe(
        map((tasks): SuccessEvent => ({ type: 'success', tasks })),
        catchError(() => {
          this.toastService.show('Search failed', 'error');
          return of({ type: 'error' } as ErrorEvent);
        }),
      );

      return concat(loading$, api$);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  searchResult$ = this.searchEvents$.pipe(
    scan(
      (state: { lastGood: Task[] }, event: SearchEvent) => {
        if (event.type === 'success') {
          return { lastGood: event.tasks };
        }
        return state;
      },
      { lastGood: [] },
    ),
    map((state) => state.lastGood),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  searchLoading$ = this.searchEvents$.pipe(
    map((event: SearchEvent) => {
      if (event.type === 'loading') return true;
      return false;
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  searchError$ = this.searchEvents$.pipe(
    map((event: SearchEvent) => {
      if (event.type === 'error') return true;
      if (event.type === 'loading') return false;
      if (event.type === 'success') return false;
      return false;
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  hasAnyResults$ = this.searchResult$.pipe(
    map((tasks) => tasks.length > 0),
    distinctUntilChanged(),
  );

  hasAnyTasks$ = this.tasks$.pipe(
    map((tasks) => tasks.length > 0),
    distinctUntilChanged(),
  );

  trimTerm$ = this.searchTerm$.pipe(
    map((value) => value.trim()),
    distinctUntilChanged(),
  );

  rawTerm$ = this.searchTerm$.pipe(distinctUntilChanged());

  taskListVm$ = combineLatest([
    this.searchResult$,
    this.hasAnyTasks$,
    this.hasAnyResults$,
    this.searchLoading$,
    this.trimTerm$,
    this.rawTerm$,
    this.statusFilter$,
    this.searchError$,
  ]).pipe(
    map(
      ([
        items,
        hasAnyTasks,
        hasAnyResults,
        loading,
        trimTerm,
        rawTerm,
        taskStatus,
        hasError,
      ]) => {
        const showNoTasksYet =
          !hasAnyTasks && !loading && trimTerm.length < 2 && !hasError;
        const showNoResults =
          hasAnyTasks &&
          !hasAnyResults &&
          !loading &&
          trimTerm.length >= 2 &&
          !hasError;

        return {
          items,
          showNoTasksYet,
          showNoResults,
          loading,
          trimTerm,
          rawTerm,
          taskStatus,
          hasError,
        };
      },
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  items$ = this.taskListVm$.pipe(map((vm) => vm.items));

  filteredTasks$ = combineLatest([this.items$, this.statusFilter$]).pipe(
    map(([tasks, taskStatus]) => {
      return this.filterByStatus(tasks, taskStatus);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  kanbanVm$ = this.filteredTasks$.pipe(
    map((tasks) => ({
      todo: this.sortByDate(tasks.filter((t) => t.status === 'todo')),
      inProgress: this.sortByDate(
        tasks.filter((t) => t.status === 'in-progress'),
      ),
      done: this.sortByDate(tasks.filter((t) => t.status === 'done')),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  // showing the counter value
  undoCountdown$ = this._deleteTriggered$.pipe(
    switchMap(() =>
      timer(0, 1000).pipe(
        map((tick) => 10 - tick),
        takeWhile((value) => value >= 0),
        takeUntil(this._undoClicked$),
      ),
    ),
    startWith(null),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // only to show/hide undo container
  showUndo$ = merge(
    this._deleteTriggered$.pipe(mapTo(true)),
    this._undoClicked$.pipe(mapTo(false)),
    this.undoCountdown$.pipe(
      filter((v) => v === 0),
      mapTo(false),
    ),
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));

  todo$ = this.kanbanVm$.pipe(map((vm) => vm.todo));
  inProgress$ = this.kanbanVm$.pipe(map((vm) => vm.inProgress));
  done$ = this.kanbanVm$.pipe(map((vm) => vm.done));

  undoVm$ = combineLatest([
    this.showUndo$,
    this.undoCountdown$,
    this.lastDeletedTask$,
  ]).pipe(
    map(([visible, countdown, task]) => {
      const text = 'UNDO deleted task ...';

      return { visible, text, countdown, task };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  showNoResults$ = combineLatest([
    this.filteredTasks$,
    this.statusFilter$,
    this.taskListVm$,
  ]).pipe(
    map(([fileredTasks, taskStatus, taskList]) => {
      const filterEmpty =
        fileredTasks.length === 0 &&
        taskStatus !== 'all' &&
        !taskList.loading &&
        taskList.trimTerm.length < 2;

      return { filterEmpty, taskStatus };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  pageVm$ = combineLatest([
    this.taskListVm$,
    this.showNoResults$,
    this.kanbanVm$,
    this.undoVm$,
    this.updatingTaskIds$,
  ]).pipe(
    map(([taskList, showNoResults, kanban, undo, updatingTaskIds]) => {
      const filterEmpty = showNoResults.filterEmpty;

      return { taskList, filterEmpty, kanban, undo, updatingTaskIds };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private persistUiPrefs$ = combineLatest([
    this.searchTerm$,
    this.statusFilter$,
  ]).pipe(
    map(([searchTerm, statusFilter]) => {
      return JSON.stringify({ searchTerm, statusFilter });
    }),
    debounceTime(300),
    distinctUntilChanged(),
    tap((jsonString) =>
      localStorage.setItem(this.TASKBOARD_UI_PREFS_KEY, jsonString),
    ),
  );

  private loadFromStorage(): void {
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

  private loadFromStorageSearchInput() {
    const storedSearchFilter = localStorage.getItem(
      this.TASKBOARD_UI_PREFS_KEY,
    );

    try {
      if (storedSearchFilter) {
        const taskboadPrefKeys = JSON.parse(storedSearchFilter);

        if (this.isTaskboardUiPrefs(taskboadPrefKeys)) {
          this._searchTerm$.next(taskboadPrefKeys.searchTerm);
          this._statusFilter$.next(taskboadPrefKeys.statusFilter);
        }
      }
    } catch (e) {
      console.error('Failed to parse tasks from storage', e);
    }
  }

  public setStatusFilter(newStats: 'all' | TaskStatus): void {
    this._statusFilter$.next(newStats);
  }

  public setSearchTerm(term: string): void {
    this._searchTerm$.next(term);
  }

  public retrySearch() {
    this._retryClicked$.next();
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

    this._statusChangeRequested$.next({
      id,
      oldStatus: oldTask.status,
      newStatus,
    });

    const updated = allTasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t,
    );

    this._tasks$.next(updated);
    this.persist(updated);
  }

  updateTaskDetails(task: Task): void {
    const allTasks = [...this.snapshot];

    const updated = allTasks.map((t) => (t.id === task.id ? task : t));
    this._tasks$.next(updated);
    this.persist(updated);
  }

  deleteTask(id: string): void {
    const updated = this.snapshot.filter((task) => task.id !== id);
    const lastOneTask = this.snapshot.find((task) => task.id === id);

    if (lastOneTask) {
      this._deleteTriggered$.next();
      this._lastDeletedTask$.next(lastOneTask);
    }

    this._tasks$.next(updated);
    this.persist(updated);
  }

  undoDelete(): void {
    const task = this.lastDelTask;

    if (!task) return;

    this.addTask(task);
    this._undoClicked$.next();
  }

  sortByDate(list: Task[]) {
    const newSort = [...list];

    return newSort.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  private filterByStatus(
    filteredTasks: Task[],
    taskStatus: TaskStatus | 'all',
  ): Task[] {
    return taskStatus === 'all'
      ? filteredTasks
      : filteredTasks.filter((item) => item.status === taskStatus);
  }

  private persist(tasks: Task[]): void {
    const safe = tasks.filter(Boolean);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safe));
  }

  private get snapshot(): Task[] {
    return this._tasks$.value;
  }

  private get lastDelTask(): Task | null {
    return this._lastDeletedTask$.value;
  }

  private fakeUpdateStatusApi(arg: StatusChangeRequest): Observable<void> {
    return timer(3000).pipe(
      map(() => {
        if (Math.random() > 0.15) {
        } else {
          throw new Error('API FAILED');
        }
      }),
    );
  }

  private rollbackStatus(request: StatusChangeRequest): void {
    const updated = this.snapshot.map((t) =>
      t.id === request.id ? { ...t, status: request.oldStatus } : t,
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

  private fakeSearchApi(term: string): Observable<Task[]> {
    return timer(1000).pipe(
      map(() => {
        if (Math.random() > 0.15) {
          return this.snapshot.filter((task) =>
            task.title.toLowerCase().includes(term.toLowerCase()),
          );
        } else {
          throw new Error('API FAILED');
        }
      }),
    );
  }

  private isValidStatusFilter(arg: unknown): boolean {
    return (
      typeof arg === 'string' &&
      this.keyWordsStatus.includes(arg as 'all' | TaskStatus)
    );
  }

  private isTaskboardUiPrefs(arg: unknown): boolean {
    if (typeof arg !== 'object' || arg === null) return false;

    const obj = arg as Record<string, unknown>;

    const searchTermValue = obj['searchTerm'];
    const statusFilterValue = obj['statusFilter'];

    return (
      typeof searchTermValue === 'string' &&
      typeof statusFilterValue === 'string' &&
      this.isValidStatusFilter(statusFilterValue)
    );
  }

  private connectEffects(): void {
    this.persistUiPrefs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this._deleteTriggered$
      .pipe(
        switchMap(() =>
          merge(
            this._undoClicked$,
            this.undoCountdown$.pipe(filter((v) => v === 0)),
          ).pipe(take(1)),
        ),
        tap(() => this._lastDeletedTask$.next(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this._statusChangeRequested$
      .pipe(
        tap((request) => this.startUpdating(request.id)),
        switchMap((request) =>
          this.fakeUpdateStatusApi(request).pipe(
            catchError((error) => {
              console.error('API error occurred', error);
              this.rollbackStatus(request);
              this.toastService.show(
                'API error occurred, status change failed',
                'error',
              );
              return EMPTY;
            }),
            finalize(() => this.stopUpdating(request.id)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
