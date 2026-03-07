import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private router = inject(Router);

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>('/api/tasks');
  }

  searchTasks(term: string): Observable<Task[]> {
    const params = term
      ? new HttpParams({ fromObject: { title: term } })
      : undefined;
    return this.http.get<Task[]>('api/tasks', { params });
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`api/tasks/${id}`);
  }

  deleteTaskById(id: string): Observable<Task> {
    return this.http.delete<Task>(`api/tasks/${id}`);
  }
}
