import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
} from 'rxjs';

import { TaskStatus, Task } from '../../core/models/task.model';
import { TaskStoreService } from '../../core/services/task-store.service';
import { TaskColumn } from '../task-column/task-column';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, TaskColumn],
  standalone: true,
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  protected readonly taskStore = inject(TaskStoreService);
  protected readonly toastService = inject(ToastService);
  statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

  public tasks$ = this.taskStore.tasks$;
  public searchTerm$ = new BehaviorSubject<string>('');
  public statusFilter$ = new BehaviorSubject<TaskStatus | 'all'>('all');

  filteredTasks$ = combineLatest([
    this.tasks$,
    this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()),
    this.statusFilter$,
  ]).pipe(
    map(([tasks, term, taskStatus]) => {
      const filterByTerm = this.filterByTerm(tasks, term);
      const filterByStatus = this.filterByStatus(filterByTerm, taskStatus);
      return filterByStatus;
    })
  );

  public lastDeletedTask$ = this.taskStore.lastDeletedTask$;
  public undoCountdown$ = this.taskStore.undoCountdown$;
  public showUndo$ = this.taskStore.showUndo$;
  public showToast$ = this.toastService.showToast$;
  public toastVm$ = this.toastService.toastVm$;

  todo$ = this.getTasksByStatus('todo');
  inProgress$ = this.getTasksByStatus('in-progress');
  done$ = this.getTasksByStatus('done');

  private getTasksByStatus(status: TaskStatus): Observable<Task[]> {
    return this.filteredTasks$.pipe(
      map((tasks) =>
        tasks
          .filter((t) => t.status === status)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
      )
    );
  }

  onChangeStatus(id: string, status: TaskStatus) {
    this.taskStore.updateTaskByStatus(id, status);
  }

  deleteTask(id: string) {
    this.taskStore.deleteTask(id);
  }

  onUpdateTask(updatedTask: Task) {
    this.taskStore.updateTaskDetails(updatedTask);
  }

  unDoDeletedTask() {
    this.taskStore.undoDelete();
  }

  showToast() {
    this.toastService.show('message aaaa adadssdf');
  }

  closeToast() {
    this.toastService.close();
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onStatusFilterChange(newStats: 'all' | TaskStatus) {
    this.statusFilter$.next(newStats);
  }

  private filterByTerm(tasks: Task[], term: string): Task[] {
    return term
      ? tasks.filter((item) =>
          item.title.toLowerCase().includes(term.toLowerCase())
        )
      : tasks;
  }

  private filterByStatus(
    filteredTasks: Task[],
    taskStatus: TaskStatus | 'all'
  ): Task[] {
    return taskStatus === 'all'
      ? filteredTasks
      : filteredTasks.filter((item) => item.status === taskStatus);
  }
}
