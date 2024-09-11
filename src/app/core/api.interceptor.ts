import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponseBase
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ForbiddenError, ForbiddenErrorCode } from 'app/api/models';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { ErrorStatus } from 'app/core/error-status';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Intercepts requests to set the correct headers and handle errors
 */
@Injectable({
  providedIn: 'root'
})
export class ApiInterceptor implements HttpInterceptor {
  hideConfirmationHandler = () => {};

  constructor(
    private nextRequestState: NextRequestState,
    private notification: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api/') && !req.url.startsWith('api/')) {
      // This is not a request to the API! proceed as is
      return next.handle(req);
    }

    // Maybe we should ignore errors...
    const ignoreError = this.nextRequestState.ignoreNextError;
    // ... but immediately clear the flag, as it is only for the next request (which is this one)
    this.nextRequestState.ignoreNextError = false;

    // Close any notification before sending a request
    if (!this.nextRequestState.leaveNotification) {
      this.notification.close();
    }
    this.nextRequestState.leaveNotification = false;

    // Apply the headers
    req = this.nextRequestState.apply(req);

    // Also handle errors globally
    return next.handle(req).pipe(
      tap(
        x => {
          if (x instanceof HttpResponseBase) {
            this.nextRequestState.finish(req);
          }
          return x;
        },
        err => {
          this.nextRequestState.finish(req);
          if (!ignoreError) {
            if (this.isConfirmationRequest(req)) {
              this.handleConfirmationError(err);
            } else {
              this.errorHandler.handleHttpError(err);
            }
          }
        },
        () => {
          this.nextRequestState.finish(req);
          if (this.isConfirmationRequest(req)) {
            this.hideConfirmationHandler();
          }
        }
      )
    );
  }

  /**
   * Checks if the given request error is a password
   * exception so the confirmation popup is not hidden
   */
  handleConfirmationError(err: HttpErrorResponse) {
    const error = this.errorHandler.parseError(err.error);
    const invalidPassword =
      error != null &&
      err.status === ErrorStatus.FORBIDDEN &&
      (error as ForbiddenError).code === ForbiddenErrorCode.INVALID_PASSWORD;

    if (!invalidPassword) {
      this.hideConfirmationHandler();
    }
    this.errorHandler.handleHttpError(err);
  }

  /**
   * Returns true if the given request is used for confirmation
   * by checking confirmationPassword header
   */
  private isConfirmationRequest(request: HttpRequest<any>): boolean {
    return request.headers?.has('confirmationPassword');
  }
}
