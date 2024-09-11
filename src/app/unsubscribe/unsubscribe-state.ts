import { Injectable } from '@angular/core';
import { DataForEmailUnsubscribe } from 'app/api/models/data-for-email-unsubscribe';
import { NotificationSettingsService } from 'app/api/services/notification-settings.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// In production the data is pre-rendered in the host page
declare const data: DataForEmailUnsubscribe;

export type UnsubscribeStep = 'form' | 'done';

/**
 * Holds the DataForEmailUnsubscribe instance and manages its state
 */
@Injectable()
export class UnsubscribeState {
  data$ = new BehaviorSubject<DataForEmailUnsubscribe>(null);
  processing$ = new BehaviorSubject(false);
  step$ = new BehaviorSubject<UnsubscribeStep>('form');

  private key: string;

  constructor(
    private errorHandler: ErrorHandlerService,
    private notificationSettingsService: NotificationSettingsService
  ) {}

  /**
   * Initializes the data
   */
  initialize(key: string): Observable<DataForEmailUnsubscribe> {
    this.key = key;
    if (data) {
      this.data$.next(data);
      return of(data);
    } else {
      // We're on development. Fetch the data.
      return this.notificationSettingsService.getDataForEmailUnsubscribe({ key }).pipe(tap(d => this.data$.next(d)));
    }
  }

  get data(): DataForEmailUnsubscribe {
    return this.data$.value;
  }

  /**
   * Performs the e-mail unsubscription
   */
  unsubscribe() {
    if (this.processing$.value) {
      return;
    }
    this.processing$.next(true);
    this.notificationSettingsService.emailUnsubscribe({ key: this.key }).subscribe(
      () => {
        this.processing$.next(false);
        this.step$.next('done');
      },
      e => {
        this.processing$.next(false);
        this.errorHandler.handleHttpError(e);
      }
    );
  }

  /**
   * Navigates to the given URL
   */
  exit() {
    location.assign(this.data.homeUrl);
  }
}
