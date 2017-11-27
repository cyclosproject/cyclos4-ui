import { Provider, APP_INITIALIZER, Injector } from '@angular/core';
import { AuthService } from 'app/api/services';
import { Auth } from 'app/api/models';
import { LoginService } from 'app/core/login.service';
import { NotificationService } from 'app/core/notification.service';
import { ApiHelper } from 'app/shared/api-helper';
import { ApiInterceptor } from 'app/core/api.interceptor';

// Loads the logged user, if any
// Use the injector to prevent a cyclic dependency
export function loadUser(injector: Injector): Function {
  return () => {
    const apiInterceptor = injector.get(ApiInterceptor);
    if (apiInterceptor.sessionToken) {
      // There should be an authenticated user. Load it.
      const interceptor = injector.get(ApiInterceptor);

      // Ignore any errors in the next request, as we'll just clear the session token on error
      interceptor.ignoreNextError();
      return injector.get(AuthService)
        .getCurrentAuth(ApiHelper.excludedAuthFields)
        .subscribe(auth => {
          if (auth.user) {
            // Store the authentication on the login service.
            injector.get(LoginService).auth = auth;
          } else {
            // No user?
            apiInterceptor.sessionToken = null;
          }
        }, error => {
          // The current session prefix is invalid. Clear it.
          apiInterceptor.sessionToken = null;
        });
    } else {
      return null;
    }
  };
}
export const LOAD_USER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadUser,
  deps: [Injector],
  multi: true
};
