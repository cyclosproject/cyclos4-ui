import { FormatService } from "app/core/format.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { UIService } from "app/api/services";
import { UiKind, DataForUi } from "app/api/models";
import { Provider, APP_INITIALIZER } from "@angular/core";
import { ApiConfiguration } from "app/api/api-configuration";
import { environment } from "environments/environment"

// Initializes the API configuration
export function initApiConfiguration(config: ApiConfiguration): Function {
  return () => {
    let root = environment.apiRoot as string;
    if (root.endsWith('/')) {
      root = root.substr(0, root.length - 1);
    }
    config.rootUrl = root;
  };
}
export const INIT_API_CONFIGURATION: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initApiConfiguration,
  deps: [ApiConfiguration],
  multi: true
};
