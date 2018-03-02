import { Injectable } from '@angular/core';
import { Notification } from 'app/shared/notification';
import { NotificationType } from 'app/shared/notification-type';
import { MatDialog, MatDialogRef } from '@angular/material';
import { NotificationComponent } from 'app/shared/notification.component';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { tap } from 'rxjs/operators/tap';
import { LoginService } from './login.service';

/**
 * Service used to navigate between pages and managing the component state
 */
@Injectable()
export class StateManager {

  private state = new Map<string, any>();
  private subscriptions: Subscription[] = [];

  constructor(private loginService: LoginService) {
    loginService.subscribeForAuth(a => this.clear());
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
    const k = key + '@' + window.location.pathname;
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
    const k = key + '@' + window.location.pathname;
    this.state.set(k, value);
  }

  /**
   * Returns the state related to the current path
   * @param key The key (valid only for the current path)
   */
  get(key: string, producer: () => any = null): any {
    const k = key + '@' + window.location.pathname;
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
