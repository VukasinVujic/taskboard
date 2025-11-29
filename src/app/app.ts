import { Component, inject } from '@angular/core';
import { TaskStoreService } from './core/services/task-store.service';
import { AddTaskComponent } from './features/add-task/add-task.component';
import { CommonModule } from '@angular/common';
import { TaskListComponent } from './features/task-list/task-list.component';

@Component({
  selector: 'app-root',
  imports: [AddTaskComponent, CommonModule, TaskListComponent],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly taskStore = inject(TaskStoreService);

  constructor() {
    this.taskStore.addTask({
      id: crypto.randomUUID(),
      title: 'Prvi test task brate moiii',
      priority: 'medium',
      status: 'todo',
      createdAt: new Date().toISOString(),
    });
  }
}
