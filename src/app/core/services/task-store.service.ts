import { inject, Injectable } from '@angular/core';
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
} from 'rxjs';
import { ToastService } from './toast.service';

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
  private _searchTerm$ = new BehaviorSubject<string>('');
  readonly searchTerm$ = this._searchTerm$.asObservable();
  private _statusFilter$ = new BehaviorSubject<TaskStatus | 'all'>('all');
  readonly statusFilter$ = this._statusFilter$.asObservable();

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
            catchError((error) => {
              console.error('API error occurred', error);
              this.rollbackStatus(request);
              this.toastService.show(
                'API error occurred, status change failed',
                'error'
              );
              return EMPTY;
            }),
            finalize(() => this.stopUpdating(request.id))
          )
        )
      )
      .subscribe();
  }

  searchRequest$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    map((term) => term.trim())
  );

  searchEvents$ = this.searchRequest$.pipe(
    switchMap((term) => {
      if (term.length < 2) {
        return this.tasks$.pipe(
          map((tasks): SuccessEvent => ({ type: 'success', tasks }))
        );
      }

      const loading$ = of({ type: 'loading' } as const);

      const api$ = this.fakeSearchApi(term).pipe(
        map((tasks): SuccessEvent => ({ type: 'success', tasks })),
        catchError(() => {
          this.toastService.show('Search failed', 'error');
          return of({ type: 'error' } as ErrorEvent);
        })
      );

      return concat(loading$, api$);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  searchResult$ = this.searchEvents$.pipe(
    scan(
      (state: { lastGood: Task[] }, event: SearchEvent) => {
        if (event.type === 'success') {
          return { lastGood: event.tasks };
        }
        return state;
      },
      { lastGood: [] }
    ),
    map((state) => state.lastGood),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  searchLoading$ = this.searchEvents$.pipe(
    map((event: SearchEvent) => {
      if (event.type === 'loading') return true;
      return false;
    }),
    distinctUntilChanged()
  );

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
      this.deleteTriggered$.next();
      this.lastDeletedTaskSubject$.next(lastOneTask);
    }

    this._tasks$.next(updated);
    this.persist(updated);
  }

  undoDelete(): void {
    const task = this.lastDelTask;

    if (!task) return;

    this.addTask(task);
    this.undoClicked$.next();
  }

  private persist(tasks: Task[]): void {
    const safe = tasks.filter(Boolean);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safe));
  }

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

  private fakeUpdateStatusApi(arg: StatusChangeRequest): Observable<void> {
    return timer(3000).pipe(
      map(() => {
        if (Math.random() > 0.15) {
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

  private fakeSearchApi(term: string): Observable<Task[]> {
    return timer(1000).pipe(
      map(() => {
        if (Math.random() > 0.15) {
          return this.snapshot.filter((task) =>
            task.title.toLowerCase().includes(term.toLowerCase())
          );
        } else {
          throw new Error('API FAILED');
        }
      })
    );
  }

  hasAnyTasks$ = this.tasks$.pipe(
    map((tasks) => tasks.length > 0),
    distinctUntilChanged()
  );
  hasAnyResults$ = this.searchResult$.pipe(
    map((tasks) => tasks.length > 0),
    distinctUntilChanged()
  );

  trimTerm$ = this.searchTerm$.pipe(
    map((value) => value.trim()),
    distinctUntilChanged()
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
      ]) => {
        const showNoTasksYet = !hasAnyTasks && !loading && trimTerm.length < 2;
        const showNoResults =
          hasAnyTasks && !hasAnyResults && !loading && trimTerm.length >= 2;

        return {
          items,
          showNoTasksYet,
          showNoResults,
          loading,
          trimTerm,
          rawTerm,
          taskStatus,
        };
      }
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public items$ = this.taskListVm$.pipe(map((vm) => vm.items));

  filteredTasks$ = combineLatest([this.items$, this.statusFilter$]).pipe(
    map(([tasks, taskStatus]) => {
      return this.filterByStatus(tasks, taskStatus);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
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
    })
  );

  public setStatusFilter(newStats: 'all' | TaskStatus): void {
    this._statusFilter$.next(newStats);
  }

  public setSearchTerm(term: string): void {
    this._searchTerm$.next(term);
  }

  private filterByStatus(
    filteredTasks: Task[],
    taskStatus: TaskStatus | 'all'
  ): Task[] {
    return taskStatus === 'all'
      ? filteredTasks
      : filteredTasks.filter((item) => item.status === taskStatus);
  }

  sortByDate(list: Task[]) {
    const newSort = [...list];

    return newSort.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  public kanbanVm$ = this.filteredTasks$.pipe(
    map((tasks) => ({
      todo: this.sortByDate(tasks.filter((t) => t.status === 'todo')),
      inProgress: this.sortByDate(
        tasks.filter((t) => t.status === 'in-progress')
      ),
      done: this.sortByDate(tasks.filter((t) => t.status === 'done')),
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  todo$ = this.kanbanVm$.pipe(map((vm) => vm.todo));
  inProgress$ = this.kanbanVm$.pipe(map((vm) => vm.inProgress));
  done$ = this.kanbanVm$.pipe(map((vm) => vm.done));
}
