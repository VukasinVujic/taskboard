import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskStoreService } from '../../core/services/task-store.service';
import { TaskPriority, TaskStatus } from '../../core/models/task.model';
import { ToastService } from '../../core/services/toast.service';
import { TaskApiService } from '../../core/services/task-api.service';
import { TaskForm } from '../../shared/components/task-form/task-form';
import { TaskFormValue } from '../../shared/models/task-form.model';

@Component({
  selector: 'app-add-task',
  imports: [ReactiveFormsModule, TaskForm],
  standalone: true,
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {
  private taskStore = inject(TaskStoreService);
  protected readonly api = inject(TaskApiService);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';
  protected readonly toastService = inject(ToastService);

  onFormSubmit(newTask: TaskFormValue) {
    const { title, description, priority, dueDate } = newTask;

    this.taskStore.addTask({
      id: crypto.randomUUID(),
      title,
      description: description || undefined,
      status: this.defaultStatus,
      priority: priority ?? this.defaultPriority,
      dueDate: dueDate,
      createdAt: new Date().toISOString(),
    });
  }
}
