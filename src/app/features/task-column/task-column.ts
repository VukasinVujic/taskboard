import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskStatus, Task } from '../../core/models/task.model';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-column',
  imports: [CommonModule, ConfirmDialog],
  standalone: true,
  templateUrl: './task-column.html',
  styleUrl: './task-column.scss',
})
export class TaskColumn {
  @Input() title = '';
  @Input() tasks: Task[] = [];

  @Input() statuses: TaskStatus[] = [];
  @Input() updatingTaskIds!: Set<string>;

  @Output() changeStatus = new EventEmitter<{
    id: string;
    status: TaskStatus;
  }>();
  @Output() deleteTask = new EventEmitter<string>();
  @Output() saveTask = new EventEmitter<Task>();

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeDialog();
  }

  private renderer = inject(Renderer2);
  private router = inject(Router);

  showEditTask: boolean = false;
  showDeleteTask: boolean = false;
  action: string = 'delete';
  selectedIdTask: string = '';

  onOpenDialog(id: string) {
    this.showDeleteTask = true;
    this.selectedIdTask = id;
    this.showOrLockScroll();
  }

  onDeleteTask(taskId: string) {
    this.deleteTask.emit(taskId);
    this.showDeleteTask = false;
    this.selectedIdTask = '';
    this.showOrLockScroll();
  }

  closeDialog() {
    this.showDeleteTask = false;
    this.selectedIdTask = '';
    this.showOrLockScroll();
  }

  onChangeStatus(id: string, status: TaskStatus) {
    this.changeStatus.emit({ id, status });
  }

  openEdit(task: Task) {
    this.showEditTask = true;
    this.showOrLockScroll();
    this.router.navigate([`/tasks/${task.id}/edit`]);
  }

  showOrLockScroll() {
    this.showEditTask || this.showDeleteTask
      ? this.renderer.setStyle(document.body, 'overflow', 'hidden')
      : this.renderer.setStyle(document.body, 'overflow', 'auto');
  }
}
