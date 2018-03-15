import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { tap } from 'rxjs/operators/tap';
import { LoginService } from './login.service';
import { Router } from '@angular/router';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';

/**
 * Service used to navigate between pages and managing the component state
 */
@Injectable()
export class StateManager {

  private state = new Map<string, any>();
  private subscriptions: Subscription[] = [];

  constructor(
    dataForUiHolder: DataForUiHolder,
    private router: Router) {
    dataForUiHolder.subscribe(() => this.clear());
  }

  /**
   * Clears the entire navigation state
   */
  clear(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions.splice(0, this.subscriptions.length);
    this.state.clear();
  }

  /**
   * Caches some data for the current path.
   * @param key The data key. Is only valid for the current path
   * @param fetch The observable used to fetch the data in case it is not already cached
   */
  cache<T>(key: string, fetch: Observable<T>): Observable<T> {
    const k = key + '@' + this.router.url;
    if (this.state.has(k)) {
      return observableOf(this.state.get(k));
    }
    // Save the value whenever the operator is subscribed
    return fetch.pipe(
      tap(value => this.state.set(k, value))
    );
  }

  /**
   * Stores the state related to the current path
   * @param key The key (valid only for the current path)
   * @param value The state value
   */
  set(key: string, value: any): void {
    if (value instanceof AbstractControl) {
      value = value.value;
    }
    const k = key + '@' + this.router.url;
    this.state.set(k, value);
  }

  /**
   * Returns the state related to the current path
   * @param key The key (valid only for the current path)
   */
  get(key: string, producer: () => any = null): any {
    const k = key + '@' + this.router.url;
    let value = this.state.get(k);
    if (value == null && producer != null) {
      // If no value, but we have a producer, call it
      value = producer();
      this.state.set(k, value);
    }
    return value;
  }

  /**
   * Initializes the form value with the current state, if any, and store the state whenever the form value changes
   * @param form The form
   * @returns Whether a previous value was used
   */
  manage(form: FormGroup, key = 'form'): boolean {
    const value = this.get(key);
    if (value) {
      form.patchValue(value);
    }
    this.subscriptions.push(form.valueChanges.subscribe(val => this.set(key, val)));
    return value != null;
  }

}
