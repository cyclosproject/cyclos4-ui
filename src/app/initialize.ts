import { APP_INITIALIZER, Injector, Provider } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Configuration } from 'app/configuration';
import { ContentGetter } from 'app/content/content-getter';
import { DefaultDashboardResolver } from 'app/content/default-dashboard-resolver';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { setup } from 'app/setup';
import { LightboxConfig } from 'ngx-lightbox';
import { forkJoin, of } from 'rxjs';
import { ALL_BREAKPOINTS } from 'app/shared/layout.service';

/**
 * Sets the default values on the global configuration
 */
function setupConfigurationDefaults() {
  Configuration.apiRoot = 'api';
  Configuration.appTitle = 'Cyclos';
  Configuration.appTitleSmall = 'Cyclos';
  Configuration.appTitleMenu = 'Cyclos menu';
  Configuration.logoUrl = 'images/logo.png';
  Configuration.searchPageSizeXxs = 10;
  Configuration.searchPageSizeXs = 20;
  Configuration.searchPageSize = 40;
  Configuration.quickSearchPageSize = 10;
  Configuration.adCategories = {
    'community': { icon: 'people', color: '#2196f3' },
    'food': { icon: 'restaurant', color: '#f04d4e' },
    'goods': { icon: 'pages', color: '#ff9700' },
    'housing': { icon: 'location_city', color: '#029487' },
    'jobs': { icon: 'work', color: '#8062b3' },
    'labor': { icon: 'business', color: '#de3eaa' },
    'leisure': { icon: 'mood', color: '#687ebd' },
    'services': { icon: 'room_service', color: '#8ec63f' }
  };
  Configuration.menuBar = false;
  Configuration.homePage = {
    content: ContentGetter.url('content/home.html')
  };
  Configuration.breakpoints = {};
  for (const bp of ALL_BREAKPOINTS) {
    Configuration.breakpoints[bp] = {};
  }
  Configuration.mainMapMarker = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  Configuration.altMapMarker = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  Configuration.dashboard = new DefaultDashboardResolver();
}

// Initializes the shared services
export function initialize(
  injector: Injector,
  apiConfig: ApiConfiguration,
  lightboxConfig: LightboxConfig,
  i18nLoading: I18nLoadingService,
  dataForUiHolder: DataForUiHolder,
  content: ContentService
): Function {
  return async () => {
    // First setup the configuration with the defaults
    setupConfigurationDefaults();
    // Then call the customizable function to setup it
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

    // Initialize the translations loading
    i18nLoading.initialize();

    let contentPages = Configuration.contentPages ? Configuration.contentPages.contentPages(injector) : null;
    if (!contentPages) {
      contentPages = [];
    }
    if (contentPages instanceof Array) {
      // The pages are already available
      contentPages = of(contentPages);
    }

    // Load both content pages and data for UI
    const result = await forkJoin([contentPages, dataForUiHolder.initialize()]).toPromise();
    content.contentPages = (result[0] || []).filter((p: any) => !!p);
  };
}
export const INITIALIZE: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initialize,
  deps: [Injector, ApiConfiguration, LightboxConfig, I18nLoadingService, DataForUiHolder, ContentService],
  multi: true
};
