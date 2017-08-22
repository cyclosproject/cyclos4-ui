import { Provider, APP_INITIALIZER, Injector } from "@angular/core";
import { AuthService } from "app/api/services";
import { ApiConfigurationService } from "app/core/api-configuration.service";
import { Auth } from "app/api/models";
import { LoginService } from "app/core/login.service";
import { NotificationService } from "app/core/notification.service";

// Loads the logged user, if any
// Use the injector to prevent a cyclic dependency
export function loadUser(injector: Injector): Function {
  return () => {
    let apiConfigurationService = injector.get(ApiConfigurationService);
    if (apiConfigurationService.sessionToken) {
      // There should be an authenticated user. Load it.
      return injector.get(AuthService).getCurrentAuth(['user', 'permissions'])
        .then(response => {
          let auth = response.data;
          if (auth.user) {
            // Store the authentication on the login service.
            injector.get(LoginService).auth = auth;
          } else {
            // No user?
            apiConfigurationService.sessionToken = null;
          }
        })
        .catch(e => {
          // Skip any shown notifications
          injector.get(NotificationService).close();

          // The current session prefix is invalid. Clear it.
          apiConfigurationService.sessionToken = null;
          return null;
        });
    } else {
      return null;
    }
  }
}
export const LOAD_USER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadUser,
  deps: [Injector],
  multi: true
};
