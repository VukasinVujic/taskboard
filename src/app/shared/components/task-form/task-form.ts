import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TaskPriority } from '../../../core/models/task.model';
import { TaskFormValue } from '../../models/task-form.model';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm {
  private fb = inject(NonNullableFormBuilder);
  private defaultPriority: TaskPriority = 'medium';

  @Input() submitText: string = 'submit default';
  @Output() formSubmit = new EventEmitter<TaskFormValue>();

  form = this.fb.group({
    title: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(2)],
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

    this.formSubmit.emit({ title, description, priority, dueDate });
    console.log('submit form');
  }
}
