import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskStoreService } from './core/services/task-store.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('taskboard');

  protected readonly taskStore = inject(TaskStoreService);

  constructor() {
    this.taskStore.addTask({
      id: crypto.randomUUID(),
      title: 'Prvi test task brate moiii',
      priority: 'medium',
      status: 'todo',
      createdAt: new Date().toISOString(),
    });
    console.log('state: ', this.taskStore.tasks());
  }
}
