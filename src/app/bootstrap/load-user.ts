import { Provider, APP_INITIALIZER, Injector } from '@angular/core';
import { AuthService } from 'app/api/services';
import { Auth } from 'app/api/models';
import { LoginService } from 'app/core/login.service';
import { NotificationService } from 'app/core/notification.service';
import { ApiHelper } from 'app/shared/api-helper';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { tap } from 'rxjs/operators';

// Loads the logged user, if any
// Use the injector to prevent a cyclic dependency
export function loadUser(injector: Injector): Function {
  const init = auth => {
    injector.get(LoginService).auth = auth;
  };
  return () => {
    const apiInterceptor = injector.get(ApiInterceptor);
    if (apiInterceptor.sessionToken) {
      // There should be an authenticated user. Load it.
      const interceptor = injector.get(ApiInterceptor);

      // Ignore any errors in the next request, as we'll just clear the session token on error
      interceptor.ignoreNextError();
      return injector.get(AuthService)
        .getCurrentAuth(ApiHelper.excludedAuthFields)
        .toPromise()
        .then(auth => {
            // Store the authentication on the login service.
            // Even if null: the authInitialized flag will be set.
            init(auth);
          })
        .catch(error => {
            // The current session prefix is invalid. Clear it.
            apiInterceptor.sessionToken = null;
            // Still initialize the auth to null, so it will be known there's really no one logged-in.
            init(null);
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
