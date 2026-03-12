import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskStoreService } from '../../core/services/task-store.service';
import { combineLatest, filter, map, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-task-edit',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './task-edit.html',
  styleUrl: './task-edit.scss',
})
export class TaskEdit implements OnInit {
  protected readonly taskStore = inject(TaskStoreService);
  private readonly destroyRef = inject(DestroyRef);

  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';

  ngOnInit() {
    this.task$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((task) => {
      this.currentTask = task;
      this.form.patchValue({
        title: task.title ?? '',
        description: task.description ?? '',
        priority: task.priority ?? this.defaultPriority,
        status: task.status ?? this.defaultStatus,
        dueDate: task.dueDate ?? '',
      });
    });
  }

  currentTask: Task | null = null;

  id$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id) => id !== null),
  );

  task$ = combineLatest([this.id$, this.taskStore.tasks$]).pipe(
    map(([id, tasks]) => {
      return tasks.find((task) => task.id === id);
    }),
    filter((task): task is Task => task !== undefined),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

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

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.currentTask) {
      return;
    }
    const { title, description, priority, dueDate, status } =
      this.form.getRawValue();

    this.taskStore.updateTaskDetails({
      id: this.currentTask.id,
      title,
      description: description === '' ? undefined : description,
      priority,
      status,
      dueDate: dueDate === '' ? undefined : dueDate,
      createdAt: this.currentTask.createdAt,
    });
    this.router.navigate(['/tasks']);
  }

  closeEdit() {
    this.router.navigate(['/tasks']);
  }
}
