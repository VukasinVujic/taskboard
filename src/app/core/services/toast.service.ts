import { Injectable } from '@angular/core';
import {
  combineLatest,
  filter,
  map,
  mapTo,
  merge,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  takeWhile,
  timer,
} from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

interface ToastPayload {
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toastTriggered$ = new Subject<ToastPayload>();
  readonly toastClosed$ = new Subject<void>();

  toastData$ = this.toastTriggered$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  countDown$ = this.toastData$.pipe(
    switchMap(() =>
      timer(0, 1000).pipe(
        map((tick) => 5 - tick),
        takeWhile((value) => value >= 0),
        takeUntil(this.toastClosed$)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  showToast$ = merge(
    this.toastTriggered$.pipe(mapTo(true)),
    this.toastClosed$.pipe(mapTo(false)),
    this.countDown$.pipe(
      filter((v) => v === 0),
      mapTo(false)
    )
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));

  toastVm$ = combineLatest([
    this.showToast$,
    this.toastData$,
    this.countDown$.pipe(startWith(null)),
  ]).pipe(
    map(([visible, data, countdown]) => ({
      visible,
      message: data?.message ?? null,
      type: data?.type ?? null,
      countdown,
    }))
  );

  show(message: string, type: ToastType = 'info') {
    this.toastTriggered$.next({ message, type });
  }

  close() {
    this.toastClosed$.next();
  }
}
