import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
} from 'rxjs';
import { TaskStoreService } from '../../core/services/task-store.service';

@Component({
  selector: 'app-task-detail-page',
  imports: [CommonModule],
  templateUrl: './task-detail-page.html',
  styleUrl: './task-detail-page.scss',
})
export class TaskDetailPage {
  protected readonly taskStore = inject(TaskStoreService);

  private readonly route = inject(ActivatedRoute);
  private router = inject(Router);

  id$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id) => id !== null),
    distinctUntilChanged(),
  );

  task$ = combineLatest([this.id$, this.taskStore.tasks$]).pipe(
    map(([id, tasks]) => {
      return tasks.find((task) => task.id === id) ?? null;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  goBack() {
    this.router.navigate([`/tasks`]);
  }
}
