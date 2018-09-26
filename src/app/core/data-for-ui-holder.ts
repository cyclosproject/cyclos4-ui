import { Injectable } from '@angular/core';
import { DataForUi, UiKind } from 'app/api/models';
import { Subscription, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { NextRequestState } from 'app/core/next-request-state';
import { UIService } from 'app/api/services';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorStatus } from 'app/core/error-status';
import { tap, catchError } from 'rxjs/operators';
import { I18n } from '@ngx-translate/i18n-polyfill';

declare const setRootAlert: (boolean) => void;
declare const setReloadButton: (boolean) => void;

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable({
  providedIn: 'root'
})
export class DataForUiHolder {
  private _dataForUi = new BehaviorSubject(null as DataForUi);

  constructor(
    private nextRequestState: NextRequestState,
    private uiService: UIService,
    private i18n: I18n) {
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
      catchError((resp: HttpErrorResponse, caught) => {
        if (resp.status === 0) {
          // The server couldn't be contacted
          setRootAlert(this.i18n(`The server couldn't be contacted.
          <br>Please, try again later.`));
          setReloadButton(this.i18n('Reload page'));
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
   * Reloads a cold observer for reloading the `DataForUi` instance
   */
  reload(): Observable<DataForUi> {
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
      tap(dataForUi => {
        this.dataForUi = dataForUi;
      })
    );
  }

  get dataForUi(): DataForUi {
    return this._dataForUi.value;
  }

  set dataForUi(dataForUi: DataForUi) {
    if (dataForUi != null) {
      this._dataForUi.next(dataForUi);
    }
  }

  /**
   * Adds a new observer notified when the user logs-in (auth != null) or logs out (auth == null)
   */
  subscribe(next?: (dataForUi: DataForUi) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this._dataForUi.subscribe(next, error, complete);
  }

}
