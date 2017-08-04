import { FormatService } from "app/core/format.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { UIService } from "app/api/services";
import { UiKind, DataForUi } from "app/api/models";
import { Provider, APP_INITIALIZER, Injector } from "@angular/core";
import { ApiConfigurationService } from "app/core/api-configuration.service";

// Load the DataForUi before showing the application
// Use the injector to prevent a cyclic dependency
export function initApiConfiguration(injector: Injector): Function {
  return () => {
    injector.get(ApiConfigurationService).setupApiConfiguration();
  };
}
export const INIT_API_CONFIGURATION: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initApiConfiguration,
  deps: [Injector],
  multi: true
};
