import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AddTask } from '../add-task/add-task';
import { CommonModule } from '@angular/common';
import { TaskList } from '../task-list/task-list';
import { TaskStoreService } from '../../core/services/task-store.service';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tasks-page',
  imports: [AddTask, CommonModule, TaskList],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.scss',
})
export class TasksPage implements OnInit {
  protected readonly taskStore = inject(TaskStoreService);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute) {}

  private currentTitleFromUrl: string = '';

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pm) => {
        const titleFromURL = pm.get('title');
        this.currentTitleFromUrl = titleFromURL ?? '';
        this.taskStore.setSearchTerm(titleFromURL ?? '');
      });

    this.taskStore.searchTerm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: string) => {
        if (value !== this.currentTitleFromUrl) {
          this.router.navigate(['/tasks'], {
            queryParams: { title: value ? value : null },
          });
        }
      });
  }
}
