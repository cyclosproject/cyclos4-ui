import { APP_INITIALIZER, Injector, Provider } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { ContentPage } from 'app/content/content-page';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { environment } from 'environments/environment';
import { LightboxConfig } from 'ngx-lightbox';
import { forkJoin, Observable, of } from 'rxjs';

// Initializes the shared services
export function initialize(
  injector: Injector,
  apiConfig: ApiConfiguration,
  lightboxConfig: LightboxConfig,
  dataForUiHolder: DataForUiHolder,
  content: ContentService
): Function {
  return async () => {
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
    if (environment.staticLocale && environment.staticTranslations) {
      dataForUiHolder._setLocale(environment.staticLocale, environment.staticTranslations);
    }

    const contentPagesResolver = environment.contentPagesResolver;
    let contentPages: ContentPage[] | Observable<ContentPage[]>;
    if (contentPagesResolver instanceof Array) {
      // The resolver is already the list of content pages
      contentPages = contentPagesResolver;
    } else if (contentPagesResolver == null) {
      // There is no resolver - no content pages
      contentPages = [];
    } else {
      // The resolver is a 'resolver'
      contentPages = contentPagesResolver.resolveContentPages(injector) || [];
    }
    if (contentPages instanceof Array) {
      // The pages are already available
      contentPages = of(contentPages);
    }

    // Load both content pages and data for UI
    const result = await forkJoin(contentPages, dataForUiHolder.initialize()).toPromise();
    content.contentPages = result[0];
  };
}
export const INITIALIZE: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initialize,
  deps: [Injector, ApiConfiguration, LightboxConfig, DataForUiHolder, ContentService],
  multi: true
};
