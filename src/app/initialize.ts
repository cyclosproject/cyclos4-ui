import { APP_INITIALIZER, Provider } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { environment } from 'environments/environment';
import { LightboxConfig } from 'ngx-lightbox';
import { Messages } from 'app/messages/messages';

// Initializes the shared services
export function initialize(
  apiConfig: ApiConfiguration,
  lightboxConfig: LightboxConfig,
  dataForUiHolder: DataForUiHolder,
  messages: Messages,
): Function {
  return () => {
    // Initialize the API configuration
    let root = environment.apiRoot as string;
    if (root.endsWith('/')) {
      root = root.substr(0, root.length - 1);
    }
    apiConfig.rootUrl = root;

    // Initialize the Lightbox configuration
    lightboxConfig.centerVertically = true;
    lightboxConfig.fadeDuration = 0.4;
    lightboxConfig.resizeDuration = 0.4;
    lightboxConfig.disableScrolling = true;
    lightboxConfig.wrapAround = true;

    // If the translations are statically set, initialize the translation values
    if (environment.translationValues) {
      messages.initialize(environment.translationValues);
    }

    // Load the data for UI
    return dataForUiHolder.initialize().toPromise();
  };
}
export const INITIALIZE: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initialize,
  deps: [ApiConfiguration, LightboxConfig, DataForUiHolder, Messages],
  multi: true
};
