import { Injectable, Optional } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Service used to navigate between pages and managing the component state
 */
@Injectable({
  providedIn: 'root'
})
export class StateManager {
  private state = new Map<string, any>();
  private subscriptions: Subscription[] = [];
  private global = new Map<string, any>();

  constructor(dataForFrontendHolder: DataForFrontendHolder, @Optional() private router: Router) {
    dataForFrontendHolder.subscribe(() => this.clear());
  }

  /**
   * Clears the entire navigation state
   */
  clear(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    this.state.clear();
  }

  /**
   * Caches some data for the current path.
   * @param key The data key. Is only valid for the current path
   * @param fetch The observable used to fetch the data in case it is not already cached
   */
  cache<T>(key: string, fetch: Observable<T>): Observable<T> {
    const k = key + '@' + this.url;
    if (this.state.has(k)) {
      return observableOf(this.state.get(k));
    }
    // Save the value whenever the operator is subscribed
    return fetch.pipe(tap(value => this.state.set(k, value)));
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
    const k = key + '@' + this.url;
    this.state.set(k, cloneDeep(value));
  }

  /**
   * Stores a global shared value
   */
  setGlobal(key: string, value: any): void {
    this.global.set(key, value);
  }

  /**
   * Returns a global shared value
   */
  getGlobal(key: string): any {
    return this.global.get(key);
  }

  /**
   * Deletes a global shared value
   */
  deleteGlobal(key: string): any {
    return this.global.delete(key);
  }

  /**
   * Deletes the state related to the current path
   */
  delete(key: string): any {
    return this.state.delete(key + '@' + this.url);
  }

  /**
   * Returns the state related to the current path
   * @param key The key (valid only for the current path)
   */
  get(key: string, producer: () => any = null): any {
    const k = key + '@' + this.url;
    let value = this.state.get(k);
    if (value == null && producer != null) {
      // If no value, but we have a producer, call it
      value = producer();
      this.state.set(k, value);
    }
    return value;
  }

  /**
   * Initializes the control value with the current state, if any, and store the state whenever the value changes
   * @param control Either the form control or a function that produces it
   * @returns Whether a previous value was used
   */
  manage<C extends AbstractControl>(control: C | (() => C), key = 'form'): C {
    const value = this.get(key, control instanceof Function ? control : null);
    if (control instanceof Function) {
      control = control();
    }
    if (value) {
      // When there was a previously stored value, modify the control
      control.patchValue(value);
    } else {
      // Otherwise, store the initial value
      this.set(key, control.value);
    }
    this.subscriptions.push(control.valueChanges.subscribe(val => this.set(key, val)));
    return control;
  }

  /**
   * Stop managing the form control
   */
  stopManaging(key = 'form') {
    this.delete(key);
  }

  /**
   * Initializes the given value with the current state, if any, and store the state whenever the value changes
   * @param value The value holder, as a BehaviorSubject
   * @returns Whether a previous value was used
   */
  manageValue(subject: BehaviorSubject<any>, key: string): boolean {
    const value = this.get(key);
    if (value) {
      subject.next(value);
    }
    this.subscriptions.push(subject.subscribe(val => this.set(key, val)));
    return value != null;
  }

  private get url(): string {
    return this.router ? this.router.url : 'local';
  }
}
