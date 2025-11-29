import { Component, inject } from '@angular/core';
import { TaskStoreService } from '../../core/services/task-store.service';
import { CommonModule } from '@angular/common';
import { TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskListComponent {
  protected readonly taskStore = inject(TaskStoreService);
  statuses: TaskStatus[] = ['todo', 'done', 'in-progress'];

  public tasks$ = this.taskStore.tasks$;

  onChangeStatus(id: string, status: TaskStatus) {
    this.taskStore.updateTask(id, status);
  }

  deleteTask(id: string) {
    this.taskStore.deleteTask(id);
  }
}
