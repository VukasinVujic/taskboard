import { Component, inject } from '@angular/core';
import { AddTask } from '../add-task/add-task';
import { TaskApiService } from '../../core/services/task-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-create-page',
  imports: [AddTask],
  templateUrl: './task-create-page.html',
  styleUrl: './task-create-page.scss',
})
export class TaskCreatePage {
  protected readonly api = inject(TaskApiService);
  private router = inject(Router);

  goBack() {
    this.router.navigate(['/tasks']);
  }
}
