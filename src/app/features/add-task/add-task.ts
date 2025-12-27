import { Component, inject } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TaskStoreService } from '../../core/services/task-store.service';
import { TaskPriority, TaskStatus } from '../../core/models/task.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-task',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {
  private fb = inject(NonNullableFormBuilder);
  private taskStore = inject(TaskStoreService);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';
  protected readonly toastService = inject(ToastService);

  form = this.fb.group({
    title: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    description: this.fb.control(''),
    priority: this.fb.control<TaskPriority>(this.defaultPriority, {
      validators: [
        Validators.required,
        Validators.pattern(/^(low|medium|high)$/),
      ],
    }),
    dueDate: this.fb.control(''),
  });

  get titleControl() {
    return this.form.get('title');
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, priority, dueDate } = this.form.getRawValue();

    this.taskStore.addTask({
      id: crypto.randomUUID(),
      title,
      description: description || undefined,
      status: this.defaultStatus,
      priority: priority ?? 'medium',
      dueDate: dueDate,
      createdAt: new Date().toISOString(),
    });

    this.form.reset({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    });

    this.toastService.show('Task Created', 'success');
  }
}
