import { Component, inject } from '@angular/core';
import { TaskStoreService } from './core/services/task-store.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly taskStore = inject(TaskStoreService);

  constructor() {}
}
