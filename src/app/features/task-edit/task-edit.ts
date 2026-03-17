import { Component, DestroyRef, inject, OnInit } from '@angular/core';

import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskStoreService } from '../../core/services/task-store.service';
import { combineLatest, filter, map, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskForm } from '../../shared/components/task-form/task-form';
import { TaskFormValue } from '../../shared/models/task-form.model';

@Component({
  selector: 'app-task-edit',
  imports: [TaskForm],
  standalone: true,
  templateUrl: './task-edit.html',
  styleUrl: './task-edit.scss',
})
export class TaskEdit implements OnInit {
  protected readonly taskStore = inject(TaskStoreService);
  private readonly destroyRef = inject(DestroyRef);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';
  protected confirmTextString = 'Updated Task';

  ngOnInit() {
    this.task$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((task) => {
      this.currentTask = task;
      this.taskFormTask = {
        title: task.title ?? '',
        description: task.description ?? '',
        priority: task.priority ?? this.defaultPriority,
        dueDate: task.dueDate ?? '',
      };
    });
  }

  taskFormTask: TaskFormValue | null = null;
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

  onFormSubmit(updatedTask: TaskFormValue) {
    const { title, description, priority, dueDate } = updatedTask;

    if (!this.currentTask) {
      return;
    }

    this.taskStore.updateTaskDetails({
      id: this.currentTask.id,
      title,
      description: description === '' ? undefined : description,
      priority: priority ?? this.defaultPriority,
      status: this.currentTask.status ?? this.defaultStatus,
      dueDate: dueDate === '' ? undefined : dueDate,
      createdAt: this.currentTask.createdAt,
    });
    this.router.navigate(['/tasks']);
  }

  closeEdit() {
    this.router.navigate(['/tasks']);
  }
}
