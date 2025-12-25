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

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toastTriggered$ = new Subject<string>();
  readonly toastClosed$ = new Subject<void>();

  toastMessage$ = this.toastTriggered$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  countDown$ = this.toastMessage$.pipe(
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
    this.toastMessage$,
    this.countDown$.pipe(startWith(null)),
  ]).pipe(
    map(([visible, message, countdown]) => ({ visible, message, countdown }))
  );

  show(message: string) {
    this.toastTriggered$.next(message);
  }

  close() {
    this.toastClosed$.next();
  }
}
