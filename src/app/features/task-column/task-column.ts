import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { TaskStatus, Task } from '../../core/models/task.model';

@Component({
  selector: 'app-task-column',
  imports: [CommonModule],
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

  onDeleteTask(id: string) {
    this.deleteTask.emit(id);
  }

  onChangeStatus(id: string, status: TaskStatus) {
    this.changeStatus.emit({ id, status });
  }
}
