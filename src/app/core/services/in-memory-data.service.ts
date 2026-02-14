import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Injectable } from '@angular/core';

@Injectable()
export class InMemoryDataService implements InMemoryDbService {
  tasks = [
    {
      id: '1',
      title: 'dssdfsdsaaa',
      status: 'done',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'bbbbbb',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'aaaaaaa',
      status: 'in-progress',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    },
  ];

  createDb() {
    return { tasks: this.tasks };
  }
}
