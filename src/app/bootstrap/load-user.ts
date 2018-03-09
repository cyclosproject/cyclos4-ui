import { Provider, APP_INITIALIZER, Injector } from '@angular/core';
import { AuthService } from 'app/api/services';
import { LoginService } from 'app/core/login.service';
import { ApiHelper } from 'app/shared/api-helper';
import { NextRequestState } from 'app/core/next-request-state';
import { ErrorHandlerService } from '../core/error-handler.service';
import { HttpErrorResponse } from '@angular/common/http';

// Loads the logged user, if any
// Use the injector to prevent a cyclic dependency
export function loadUser(injector: Injector): Function {
  const init = auth => {
    injector.get(LoginService).auth = auth;
  };
  return () => {
    const nextRequestState = injector.get(NextRequestState);
    if (nextRequestState.sessionToken) {
      // There should be an authenticated user. Load it.
      const authService = injector.get(AuthService);
      const errorHandler = injector.get(ErrorHandlerService);
      errorHandler.requestWithCustomErrorHandler(defaultHandling => {
        authService.getCurrentAuth().subscribe(
          auth => init(auth),
          (resp: HttpErrorResponse) => {
            // The current session prefix is invalid. Clear it.
            nextRequestState.sessionToken = null;
            // Still initialize the auth to null, so it will be known there's really no one logged-in.
            init(null);
          }
        );
      });
    } else {
      // Same comment as above
      init(null);
    }
  };
}
export const LOAD_USER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadUser,
  deps: [Injector],
  multi: true
};
