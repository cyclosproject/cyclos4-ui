import { Injectable } from '@angular/core';
import { DataForUi, UiKind } from 'app/api/models';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NextRequestState } from 'app/core/next-request-state';
import { UIService } from 'app/api/services';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorStatus } from 'app/core/error-status';
import { TranslationLoaderService } from './translation-loader.service';
import { Messages } from 'app/messages/messages';

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable()
export class DataForUiHolder {
  private _dataForUi = new BehaviorSubject(null as DataForUi);

  constructor(
    private nextRequestState: NextRequestState,
    private uiService: UIService,
    private translationLoaderService: TranslationLoaderService,
    private messages: Messages) {
  }

  /**
   * Reloads the `DataForUi` instance, returning a promise called when it is complete
   */
  reload(): Promise<DataForUi> {
    let retried = false;
    this.nextRequestState.ignoreNextError = true;
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM })
      .toPromise()
      .then(dataForUi => {
        // We're initializing the DataForUi. Also load the corresponding translation
        return this.translationLoaderService.load(dataForUi.language.code, dataForUi.country)
          .then(messages => {
            this.messages.initialize(messages);
            // Only after the messages are initialized, initialize the DataForUi instance
            this.dataForUi = dataForUi;
            return dataForUi;
          });
      })
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
