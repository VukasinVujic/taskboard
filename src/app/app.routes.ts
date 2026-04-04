import { Routes } from '@angular/router';
import { TasksPage } from './features/tasks-page/tasks-page';
import { TaskDetailPage } from './features/task-detail-page/task-detail-page';
import { TaskCreatePage } from './features/task-create-page/task-create-page';
import { TaskEdit } from './features/task-edit/task-edit';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'tasks',
    component: TasksPage,
  },
  {
    path: 'tasks/new',
    component: TaskCreatePage,
    canActivate: [authGuard],
  },
  {
    path: 'tasks/:id',
    component: TaskDetailPage,
  },
  {
    path: 'tasks/:id/edit',
    component: TaskEdit,
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'tasks' },
];
