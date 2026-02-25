import { Routes } from '@angular/router';
import { TasksPage } from './features/tasks-page/tasks-page';
import { TaskDetailPage } from './features/task-detail-page/task-detail-page';

export const routes: Routes = [
  {
    path: 'tasks',
    component: TasksPage,
  },
  {
    path: 'tasks/:id',
    component: TaskDetailPage,
  },
];
