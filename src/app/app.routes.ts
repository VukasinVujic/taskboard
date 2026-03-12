import { Routes } from '@angular/router';
import { TasksPage } from './features/tasks-page/tasks-page';
import { TaskDetailPage } from './features/task-detail-page/task-detail-page';
import { TaskCreatePage } from './features/task-create-page/task-create-page';
import { TaskEdit } from './features/task-edit/task-edit';

export const routes: Routes = [
  {
    path: 'tasks',
    component: TasksPage,
  },
  {
    path: 'tasks/new',
    component: TaskCreatePage,
  },
  {
    path: 'tasks/:id',
    component: TaskDetailPage,
  },
  {
    path: 'tasks/:id/edit',
    component: TaskEdit,
  },

  { path: '**', redirectTo: 'tasks' },
];
