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

  public updatingTaskIds$ = this.taskStore.updatingTaskIds$;
  public showNoResults$ = this.taskStore.showNoResults$;
  public undoVm$ = this.taskStore.undoVm$;

  public showToast$ = this.toastService.showToast$;
  public toastVm$ = this.toastService.toastVm$;

  todo$ = this.taskStore.todo$;
  inProgress$ = this.taskStore.inProgress$;
  done$ = this.taskStore.done$;

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
