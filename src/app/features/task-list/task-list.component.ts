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

  public tasks$ = this.taskStore.tasks$;

  // onChangeStatus(id: string, status: TaskStatus) {
  //   this.taskStore.updateTask(id, status);
  // }

  onMarkAsDone(id: string) {
    this.taskStore.updateTask(id, 'done');
  }

  onMoveToInProgress(id: string) {
    this.taskStore.updateTask(id, 'in-progress');
  }
  onMoveToDo(id: string) {
    this.taskStore.updateTask(id, 'todo');
  }
}
