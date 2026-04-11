import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, filter, map, shareReplay, take } from 'rxjs';

import { TaskPriority, TaskStatus } from '../../core/models/task.model';
import { TaskStoreService } from '../../core/services/task-store.service';
import { TaskForm } from '../../shared/components/task-form/task-form';
import { TaskFormValue } from '../../shared/models/task-form.model';
import { CanComponentDeactivate } from '../../shared/models/can-component-deactivate';

@Component({
  selector: 'app-task-edit',
  imports: [CommonModule, TaskForm],
  standalone: true,
  templateUrl: './task-edit.html',
  styleUrl: './task-edit.scss',
})
export class TaskEdit implements CanComponentDeactivate {
  protected readonly taskStore = inject(TaskStoreService);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private defaultPriority: TaskPriority = 'medium';
  private defaultStatus: TaskStatus = 'todo';
  private hasUnsavedChanges: boolean = false;
  private allowExit: boolean = false;
  protected confirmTextString = 'Updated Task';
  protected notFoundText = 'Task not found ...';

  id$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id) => id !== null),
  );

  task$ = combineLatest([this.id$, this.taskStore.tasks$]).pipe(
    map(([id, tasks]) => {
      return tasks.find((task) => task.id === id) ?? null;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // resolver logic
  // task$ = this.route.data.pipe(
  //   tap((data) => console.log('task: ', data['task'])),
  //   map((data) => data['task'] ?? null),
  //   shareReplay({ bufferSize: 1, refCount: true }),
  // );

  taskFormValue$ = this.task$.pipe(
    map((task) => {
      return task
        ? {
            title: task.title ?? '',
            description: task.description ?? '',
            priority: task.priority ?? this.defaultPriority,
            dueDate: task.dueDate ?? '',
          }
        : null;
    }),
  );

  onFormSubmit(updatedTask: TaskFormValue) {
    const { title, description, priority, dueDate } = updatedTask;

    this.task$.pipe(take(1)).subscribe((taskCurrent) => {
      if (taskCurrent !== null) {
        this.taskStore.updateTaskDetails({
          id: taskCurrent.id,
          title,
          description: description === '' ? undefined : description,
          priority: priority ?? this.defaultPriority,
          status: taskCurrent.status ?? this.defaultStatus,
          dueDate: dueDate === '' ? undefined : dueDate,
          createdAt: taskCurrent.createdAt,
        });
        this.allowExit = true;
        this.router.navigate(['/tasks']);
      }
    });
  }

  canDeactivate() {
    if (this.allowExit) {
      return true;
    }

    if (this.hasUnsavedChanges) {
      const result = window.confirm(
        ' You have unsaved chagnes. Are you sure you want to exti? ',
      );
      return result;
    }

    return true;
  }

  closeEdit() {
    this.router.navigate(['/tasks']);
  }

  onDirtyChange(event: boolean) {
    this.hasUnsavedChanges = event;
  }
}
