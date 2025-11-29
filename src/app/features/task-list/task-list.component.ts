import { Component, inject } from '@angular/core';
import { TaskStoreService } from '../../core/services/task-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  protected readonly taskStore = inject(TaskStoreService);

  public tasks$ = this.taskStore.tasks$;
}
