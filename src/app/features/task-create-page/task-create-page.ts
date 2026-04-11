import { Component, inject } from '@angular/core';
import { AddTask } from '../add-task/add-task';
import { TaskApiService } from '../../core/services/task-api.service';
import { Router } from '@angular/router';
import { CanComponentDeactivate } from '../../shared/models/can-component-deactivate';

@Component({
  selector: 'app-task-create-page',
  imports: [AddTask],
  templateUrl: './task-create-page.html',
  styleUrl: './task-create-page.scss',
})
export class TaskCreatePage implements CanComponentDeactivate {
  protected readonly api = inject(TaskApiService);
  private router = inject(Router);

  private hasUnsavedChanges: boolean = false;
  private allowExit: boolean = false;

  canDeactivate() {
    if (this.allowExit) {
      return true;
    }

    if (this.hasUnsavedChanges) {
      const result = window.confirm(
        ' You have unsaved chagnes. Are you sure you want to exti? ',
      );
      return result;
    }

    return true;
  }

  onDirtyChange(event: boolean) {
    this.hasUnsavedChanges = event;
  }

  goBack() {
    this.router.navigate(['/tasks']);
  }
}
