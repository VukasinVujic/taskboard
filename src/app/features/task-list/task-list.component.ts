import { Component, inject } from '@angular/core';
import { TaskStoreService } from '../../core/services/task-store.service';
import { CommonModule } from '@angular/common';
import { TaskStatus, Task } from '../../core/models/task.model';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskListComponent {
  protected readonly taskStore = inject(TaskStoreService);
  statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

  public tasks$ = this.taskStore.tasks$;

  todo$ = this.getTasksByStatus('todo');
  inProgress$ = this.getTasksByStatus('in-progress');
  done$ = this.getTasksByStatus('done');

  private getTasksByStatus(status: TaskStatus): Observable<Task[]> {
    return this.tasks$.pipe(
      map((tasks) => tasks.filter((t) => t.status === status))
    );
  }

  onChangeStatus(id: string, status: TaskStatus) {
    this.taskStore.updateTask(id, status);
  }

  deleteTask(id: string) {
    this.taskStore.deleteTask(id);
  }
}
