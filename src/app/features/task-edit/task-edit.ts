import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';
import { TaskStoreService } from '../../core/services/task-store.service';

@Component({
  selector: 'app-task-edit',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './task-edit.html',
  styleUrl: './task-edit.scss',
})
export class TaskEdit implements OnChanges {
  private fb = inject(NonNullableFormBuilder);
  private taskStore = inject(TaskStoreService);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';

  @Input() task: Task | null = null;

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
    status: this.fb.control<TaskStatus>(this.defaultStatus, {
      validators: [
        Validators.required,
        Validators.pattern(/^(todo|in-progress|done)$/),
      ],
    }),
    dueDate: this.fb.control(''),
  });

  get titleControl() {
    return this.form.get('title');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      const task = changes['task'].currentValue as Task | null;

      if (task) {
        this.form.setValue({
          title: task.title ?? '',
          description: task.description ?? '',
          priority: task.priority ?? this.defaultPriority,
          status: task.status ?? this.defaultStatus,
          dueDate: task.dueDate ?? '',
        });
      } else {
        this.form.reset({
          title: '',
          description: '',
          priority: this.defaultPriority,
          status: this.defaultStatus,
          dueDate: '',
        });
      }
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, priority, dueDate } = this.form.getRawValue();

    // this.taskStore.addTask({
    //   id: crypto.randomUUID(),
    //   title,
    //   description: description || undefined,
    //   status: this.defaultStatus,
    //   priority: priority ?? 'medium',
    //   dueDate: dueDate,
    //   createdAt: new Date().toISOString(),
    // });

    // this.form.reset({
    //   title: '',
    //   description: '',
    //   priority: 'medium',
    //   dueDate: '',
    // });
  }
}
