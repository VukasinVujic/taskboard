import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';

import { TaskStatus, Task } from '../../core/models/task.model';
import { TaskStoreService } from '../../core/services/task-store.service';
import { TaskColumn } from '../task-column/task-column';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, TaskColumn],
  standalone: true,
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  protected readonly taskStore = inject(TaskStoreService);
  statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

  public tasks$ = this.taskStore.tasks$;

  todo$ = this.getTasksByStatus('todo');
  inProgress$ = this.getTasksByStatus('in-progress');
  done$ = this.getTasksByStatus('done');

  private getTasksByStatus(status: TaskStatus): Observable<Task[]> {
    return this.tasks$.pipe(
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
    this.taskStore.updateTask(id, status);
  }

  deleteTask(id: string) {
    this.taskStore.deleteTask(id);
  }
}
