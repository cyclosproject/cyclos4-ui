import { Injectable } from '@angular/core';
import { Auth, User, DataForUi, UiKind } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { ApiHelper } from 'app/shared/api-helper';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NextRequestState } from 'app/core/next-request-state';
import { UIService } from 'app/api/services';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorStatus } from 'app/core/error-status';

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable()
export class DataForUiHolder {
  private _dataForUi = new BehaviorSubject(null as DataForUi);

  constructor(
    private nextRequestState: NextRequestState,
    private uiService: UIService) {
  }

  /**
   * Reloads the `DataForUi` instance, returning a promise called when it is complete
   */
  reload(): Promise<DataForUi> {
    let retried = false;
    this.nextRequestState.ignoreNextError = true;
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM })
      .toPromise()
      .then(dataForUi => this.dataForUi = dataForUi)
      .catch((resp: HttpErrorResponse) => {
        if (!retried && this.nextRequestState.sessionToken != null
          && (resp.status === ErrorStatus.FORBIDDEN || resp.status === ErrorStatus.UNAUTHORIZED)) {
          retried = true;
          // Clear the session token and try again
          this.nextRequestState.sessionToken = null;
          return this.reload();
        }
        throw resp;
      });
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
