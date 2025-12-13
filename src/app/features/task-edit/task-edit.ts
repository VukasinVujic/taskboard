import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-task-edit',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './task-edit.html',
  styleUrl: './task-edit.scss',
})
export class TaskEdit implements OnChanges {
  private fb = inject(NonNullableFormBuilder);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';

  @Input() task: Task | null = null;
  @Output() save = new EventEmitter<Task>();
  @Output() cancel = new EventEmitter();

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

    if (!this.task) {
      return;
    }

    const { title, description, priority, dueDate, status } =
      this.form.getRawValue();

    this.save.emit({
      id: this.task.id,
      title,
      description: description === '' ? undefined : description,
      priority,
      status,
      dueDate: dueDate === '' ? null : dueDate,
      createdAt: this.task.createdAt,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
