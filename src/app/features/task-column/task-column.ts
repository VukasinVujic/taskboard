import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { TaskStatus, Task } from '../../core/models/task.model';
import { TaskEdit } from '../task-edit/task-edit';

@Component({
  selector: 'app-task-column',
  imports: [CommonModule, TaskEdit],
  standalone: true,
  templateUrl: './task-column.html',
  styleUrl: './task-column.scss',
})
export class TaskColumn {
  @Input() title = '';
  @Input() tasks$!: Observable<Task[]>;
  @Input() statuses: TaskStatus[] = [];

  @Output() changeStatus = new EventEmitter<{
    id: string;
    status: TaskStatus;
  }>();
  @Output() deleteTask = new EventEmitter<string>();
  @Output() saveTask = new EventEmitter<Task>();

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeEdit();
  }

  showEditTask: boolean = false;
  selectedTask: Task | null = null;

  onDeleteTask(id: string) {
    this.deleteTask.emit(id);
  }

  onChangeStatus(id: string, status: TaskStatus) {
    this.changeStatus.emit({ id, status });
  }

  openEdit(task: Task) {
    this.showEditTask = true;
    this.selectedTask = task;
  }

  saveEdit(updatedTask: Task) {
    this.saveTask.emit(updatedTask);
    this.showEditTask = false;
    this.selectedTask = null;
  }

  closeEdit() {
    this.showEditTask = false;
    this.selectedTask = null;
  }
}
