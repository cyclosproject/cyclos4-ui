import { APP_INITIALIZER, Injector, Provider } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Configuration } from 'app/configuration';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { setup } from 'app/setup';
import { LightboxConfig } from 'ngx-lightbox';
import { forkJoin, of } from 'rxjs';

// Initializes the shared services
export function initialize(
  injector: Injector,
  apiConfig: ApiConfiguration,
  lightboxConfig: LightboxConfig,
  dataForUiHolder: DataForUiHolder,
  content: ContentService
): Function {
  return async () => {
    // First setup the configuration
    setup();
    if (Configuration.apiRoot.endsWith('/')) {
      Configuration.apiRoot = Configuration.apiRoot.substring(0, Configuration.apiRoot.length - 1);
    }

    // Initialize the API configuration
    apiConfig.rootUrl = Configuration.apiRoot;

    // Initialize the Lightbox configuration
    lightboxConfig.centerVertically = true;
    lightboxConfig.fadeDuration = 0.4;
    lightboxConfig.resizeDuration = 0.4;
    lightboxConfig.disableScrolling = true;
    lightboxConfig.wrapAround = true;

    // If the translations are statically set, initialize the translation values
    if (Configuration.staticLocale && Configuration.staticTranslations) {
      dataForUiHolder._setLocale(Configuration.staticLocale, Configuration.staticTranslations);
    }

    let contentPages = Configuration.contentPages ? Configuration.contentPages.contentPages(injector) : null;
    if (!contentPages) {
      contentPages = [];
    }
    if (contentPages instanceof Array) {
      // The pages are already available
      contentPages = of(contentPages);
    }

    // Load both content pages and data for UI
    const result = await forkJoin(contentPages, dataForUiHolder.initialize()).toPromise();
    content.contentPages = (result[0] || []).filter(p => !!p);
  };
}
export const INITIALIZE: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initialize,
  deps: [Injector, ApiConfiguration, LightboxConfig, DataForUiHolder, ContentService],
  multi: true
};
