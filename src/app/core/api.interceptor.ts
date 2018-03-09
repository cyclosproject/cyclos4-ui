import { Injectable, Injector } from '@angular/core';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { NotificationService } from 'app/core/notification.service';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';
import { NextRequestState } from 'app/core/next-request-state';

/**
 * Intercepts requests to set the correct headers and handle errors
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(
    private nextRequestState: NextRequestState,
    private notification: NotificationService,
    private errorHandler: ErrorHandlerService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api/')) {
      // This is not a request to the API! proceed as is
      return next.handle(req);
    }

    // Maybe we should ignore errors...
    const ignoreError = this.nextRequestState.ignoreNextError;
    // ... but immediately clear the flag, as it is only for the next request (which is this one)
    this.nextRequestState.ignoreNextError = false;

    // Close any notification before sending a request
    this.notification.close();

    // Apply the headers
    req = this.nextRequestState.apply(req);

    // Also handle errors globally
    return next.handle(req).pipe(
      tap(x => x, err => {
        if (!ignoreError) {
          this.errorHandler.handleHttpError(err);
        }
      })
    );
  }
}
