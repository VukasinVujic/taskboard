import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';

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

  public taskListVm$ = this.taskStore.taskListVm$;

  public lastDeletedTask$ = this.taskStore.lastDeletedTask$;
  public undoCountdown$ = this.taskStore.undoCountdown$;
  public showUndo$ = this.taskStore.showUndo$;
  public updatingTaskIds$ = this.taskStore.updatingTaskIds$;
  public showNoResults$ = this.taskStore.showNoResults$;

  public showToast$ = this.toastService.showToast$;
  public toastVm$ = this.toastService.toastVm$;

  public kanbanVm$ = this.taskStore.filteredTasks$.pipe(
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

  sortByDate(list: Task[]) {
    return list.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
    this.toastService.show('message toast test');
  }

  closeToast() {
    this.toastService.close();
  }

  onSearch(term: string) {
    this.taskStore.setSearchTerm(term);
  }

  onStatusFilterChange(newStats: 'all' | TaskStatus) {
    this.taskStore.setStatusFilter(newStats);
  }

  clearSearch() {
    this.taskStore.setSearchTerm('');
  }

  resetFilter() {
    this.taskStore.setStatusFilter('all');
  }
}
