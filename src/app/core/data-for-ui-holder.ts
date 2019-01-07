import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataForUi, UiKind } from 'app/api/models';
import { UIService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { NextRequestState } from 'app/core/next-request-state';
import { Messages } from 'app/messages/messages';
import { setReloadButton, setRootAlert } from 'app/shared/helper';
import moment from 'moment-mini-ts';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable({
  providedIn: 'root'
})
export class DataForUiHolder {
  private dataForUi$ = new BehaviorSubject<DataForUi>(null);
  private timeDiff: number;

  constructor(
    private nextRequestState: NextRequestState,
    private uiService: UIService,
    private messages: Messages) {
  }

  /**
   * Returns a cold observer for initializing the `DataForUi` instance
   */
  initialize(): Observable<DataForUi> {
    this.nextRequestState.ignoreNextError = true;
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
      tap(dataForUi => {
        this.dataForUi = dataForUi;
      }),
      catchError((resp: HttpErrorResponse) => {
        if (resp.status === 0) {
          // The server couldn't be contacted
          setRootAlert(this.messages.error.serverOffline);
          setReloadButton(this.messages.general.reloadPage);
          return;
        }
        // Maybe we're using an old session data. In that case, we have to clear the session and try again
        if (this.nextRequestState.sessionToken && [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
          // Clear the session token and try again
          this.nextRequestState.sessionToken = null;
          return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
            tap(dataForUi => {
              this.dataForUi = dataForUi;
            })
          );
        }
      })
    );
  }

  /**
   * Returns a cold observer for reloading the `DataForUi` instance
   */
  reload(): Observable<DataForUi> {
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
      tap(dataForUi => {
        this.dataForUi = dataForUi;
      })
    );
  }

  get dataForUi(): DataForUi {
    return this.dataForUi$.value;
  }

  /**
   * As the client clock may be wrong, we consider the server clock
   */
  now(): moment.Moment {
    const date = new Date();
    date.setTime(date.getTime() + this.timeDiff);
    return moment(date);
  }

  set dataForUi(dataForUi: DataForUi) {
    if (dataForUi != null) {
      this.dataForUi$.next(dataForUi);
      // Store the time diff
      this.timeDiff = new Date().getTime() - moment(dataForUi.currentClientTime).toDate().getTime();
    }
  }

  /**
   * Adds a new observer notified when the user logs-in (auth != null) or logs out (auth == null)
   */
  subscribe(next?: (dataForUi: DataForUi) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.dataForUi$.subscribe(next, error, complete);
  }

}
