import { Resolve } from '@angular/router';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Base class to be extended by resolvers that fetch data once and the data is
 * cached for all next executions
 */
export abstract class SingletonResolve<T> implements Resolve<T> {
  _data = new BehaviorSubject<T>(null);
  _requested = false;
  _done = false;

  get data(): BehaviorSubject<T> {
    if (!this._requested) {
      this._requested = true;
      this.fetch().pipe(first())
        .subscribe(data => {
          // On success, store the data and mark as done
          this._done = true;
          this._data.next(data);
          this.onFetched(data);
        }, () => {
          // On error, clear the requested flag, so it could eventually retry
          this._requested = false;
        });
    }
    return this._data;
  }

  protected abstract fetch(): Observable<T>;

  /**
   * May be overridden by subclasses to process the data once it is fetched
   * @param data The fetched data
   */
  protected abstract onFetched(data: T);

  resolve(): Observable<T> {
    if (this._data.value !== null) {
      // Already resolved
      return observableOf(this._data.value);
    }
    // Return an observable
    let subscription: Subscription = null;
    return new Observable(observer => {
      subscription = this.data.subscribe(data => {
        // Ensure we're not getting the initial null data
        if (this._done) {
          observer.next(data);
          this.onFetched(data);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }
}
