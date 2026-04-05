import { ResolveFn, Router } from '@angular/router';
import { Task } from '../models/task.model';
import { TaskApiService } from '../services/task-api.service';
import { inject } from '@angular/core';
import { catchError, of } from 'rxjs';

export const taskResolver: ResolveFn<
  Task | ReturnType<Router['createUrlTree']>
> = (route) => {
  const api = inject(TaskApiService);
  const router = inject(Router);

  const id = route.paramMap.get('id');

  if (!id) {
    return router.createUrlTree(['/tasks']);
  }

  return api
    .getTaskById(id)
    .pipe(catchError(() => of(router.createUrlTree(['/tasks']))));
};
