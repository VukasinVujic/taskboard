import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';
import {
  catchError,
  concat,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
} from 'rxjs';
import { TaskApiService } from '../../core/services/task-api.service';

@Component({
  selector: 'app-task-detail-page',
  imports: [CommonModule],
  templateUrl: './task-detail-page.html',
  styleUrl: './task-detail-page.scss',
})
export class TaskDetailPage {
  private readonly api = inject(TaskApiService);
  private readonly route = inject(ActivatedRoute);

  id$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id) => id !== null),
    distinctUntilChanged(),
  );

  vm$ = this.id$.pipe(
    switchMap((id) => {
      const loading$ = of({ state: 'loading' } as const);

      const api$ = this.api.getTaskById(id).pipe(
        map((task) => ({ state: 'ready', task }) as const),
        catchError(() => {
          return of({ state: 'error', message: ' error, not found' } as const);
        }),
      );

      return concat(loading$, api$);
    }),
  );
}
