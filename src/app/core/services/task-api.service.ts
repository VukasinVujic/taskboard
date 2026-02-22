import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
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
}
