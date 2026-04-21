import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Task, TaskPriority } from '../../../core/models/task.model';
import { TaskFormValue } from '../../models/task-form.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { delay, map, Observable, of, switchMap, take } from 'rxjs';
import { TaskStoreService } from '../../../core/services/task-store.service';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm implements OnChanges, OnInit {
  private fb = inject(NonNullableFormBuilder);
  private defaultPriority: TaskPriority = 'medium';
  protected readonly taskStore = inject(TaskStoreService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() submitText: string = 'submit default';
  @Input() initialValue: TaskFormValue | null = null;
  @Output() formSubmit = new EventEmitter<TaskFormValue>();
  @Output() dirtyChange = new EventEmitter<boolean>();

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.dirtyChange.emit(this.form.dirty);
      });
    this.priorityControl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((priority) => {
        priority === 'high'
          ? this.dueDateControl?.setValidators([Validators.required])
          : this.dueDateControl?.clearValidators();

        this.dueDateControl?.updateValueAndValidity();
      });
  }

  ngOnChanges() {
    if (this.initialValue !== null) {
      this.form.patchValue({
        title: this.initialValue.title ?? '',
        description: this.initialValue.description ?? '',
        priority: this.initialValue.priority ?? this.defaultPriority,
        dueDate: this.initialValue.dueDate ?? '',
      });
    }
  }

  form = this.fb.group({
    title: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(2),
        titleWhitespaceValidator,
      ],
      asyncValidators: [uniqueTitleAsyncValidator(this.taskStore)],
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

  get priorityControl() {
    return this.form.get('priority');
  }

  get dueDateControl() {
    return this.form.get('dueDate');
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

export function titleWhitespaceValidator(
  arg: AbstractControl,
): ValidationErrors | null {
  if (typeof arg.value === 'string') {
    if (arg.value.trim().length === 0) {
      return { whitespaceOnly: true };
    }
  }
  return null;
}

export function uniqueTitleAsyncValidator(
  taskStore: TaskStoreService,
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (typeof control.value !== 'string') {
      return of(null);
    }

    const normalizedTitle = control.value.trim().toLowerCase();

    if (!normalizedTitle) {
      return of(null);
    }

    return taskStore.tasks$.pipe(
      take(1),
      delay(300),
      map((tasks) => {
        const titleExists = tasks.some(
          (task) => task.title.trim().toLowerCase() === normalizedTitle,
        );

        return titleExists ? { titleTaken: true } : null;
      }),
    );
  };
}
