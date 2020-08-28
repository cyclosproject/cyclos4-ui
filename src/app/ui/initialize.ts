import { Location } from '@angular/common';
import { APP_INITIALIZER, Provider, Injector } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { ContentService } from 'app/ui/core/content.service';
import { Configuration } from 'app/ui/configuration';
import { ContentGetter } from 'app/ui/content/content-getter';
import { DefaultDashboardResolver } from 'app/ui/content/default-dashboard-resolver';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { NextRequestState } from 'app/core/next-request-state';
import { setup } from 'app/ui/setup';
import { empty } from 'app/shared/helper';
import { ALL_BREAKPOINTS } from 'app/core/layout.service';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18n } from 'app/i18n/i18n';
import { ContentPage } from 'app/ui/content/content-page';

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
  Configuration.translationLocales = I18n.locales();
  Configuration.cacheTranslations = true;
  Configuration.menuBar = false;
  Configuration.homePage = {
    content: ContentGetter.url('content/home.html'),
  };
  Configuration.breakpoints = {};
  for (const bp of ALL_BREAKPOINTS) {
    Configuration.breakpoints[bp] = {};
  }
  Configuration.adCategories = {
    community: { icon: 'people', color: '#2196f3' },
    food: { icon: 'restaurant', color: '#f04d4e' },
    goods: { icon: 'pages', color: '#ff9700' },
    housing: { icon: 'location_city', color: '#029487' },
    jobs: { icon: 'work', color: '#8062b3' },
    labor: { icon: 'business', color: '#de3eaa' },
    leisure: { icon: 'mood', color: '#687ebd' },
    services: { icon: 'room_service', color: '#8ec63f' },
  };
  Configuration.operations = {};
  Configuration.wizards = {};
  Configuration.records = {};
  Configuration.mainMapMarker = window.document.baseURI + '/images/map-marker-main.png';
  Configuration.altMapMarker = window.document.baseURI + '/images/map-marker-alt.png';
  Configuration.dashboard = new DefaultDashboardResolver();
}

// Initializes the shared services
export function initialize(
  injector: Injector,
  location: Location,
  apiConfig: ApiConfiguration,
  i18nLoading: I18nLoadingService,
  dataForUiHolder: DataForUiHolder,
  nextRequestState: NextRequestState,
  contentService: ContentService
): () => any {
  return async () => {
    // First setup the configuration with the defaults
    setupConfigurationDefaults();
    // Then call the customizable function to setup it
    setup();
    if (Configuration.apiRoot.endsWith('/')) {
      Configuration.apiRoot = Configuration.apiRoot.substring(0, Configuration.apiRoot.length - 1);
    }

    // When receiving an external session token, actually assign the URL again
    const path = location.path();
    const match = /[\?\&]sessionToken=([\w\.\-\+]+)/.exec(path);
    if (match) {
      const sessionToken = match[1];
      const newUrl = path.replace('sessionToken=' + sessionToken, '');
      nextRequestState.replaceSession(sessionToken).subscribe(() => {
        location.go(newUrl);
      });
      // Nothing else to do: after storing the session token / cookie, will assign a new URL, causing a reload.
      return;
    }
    if (Configuration.redirectGuests && !nextRequestState.hasSession) {
      // Guests aren't handled at all in this frontend. Redirect them.
      window.location.assign(Configuration.redirectGuests);
      return null;
    }

    // Initialize the shortcut icons
    let icons = Configuration.shortcutIcons;
    if (empty(icons)) {
      icons = [{ url: Configuration.logoUrl }];
    }
    for (const icon of icons) {
      const link = document.createElement('link');
      link.rel = icon.rel || 'icon';
      if (icon.size) {
        link.setAttribute('sizes', `${icon.size}x${icon.size}`);
      }
      link.href = icon.url;
      document.head.appendChild(link);
    }

    // Initialize the API configuration
    apiConfig.rootUrl = Configuration.apiRoot;

    // Initialize the translations loading
    i18nLoading.initialize(Configuration.staticLocale, Configuration.staticTranslations);

    dataForUiHolder.onInitializing = dataForUi => {
      // Prepare the content pages before initializing
      let contentPages: ContentPage[] | Observable<ContentPage[]>;
      if (Configuration.contentPages instanceof Array) {
        contentPages = Configuration.contentPages;
      } else if (Configuration.contentPages) {
        contentPages = Configuration.contentPages.contentPages(injector);
      }
      if (!contentPages) {
        contentPages = [];
      }
      if (contentPages instanceof Array) {
        // The pages are already available
        contentPages = of(contentPages);
      }

      // Actually get the content pages
      return contentPages.pipe(map(pages => {
        contentService.setContentPages(pages.filter(p => !!p));
        return dataForUi;
      }));
    };

    return await dataForUiHolder.initialize().toPromise();
  };
}
export const INITIALIZE: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initialize,
  deps: [
    Injector,
    Location,
    ApiConfiguration,
    I18nLoadingService,
    DataForUiHolder,
    NextRequestState,
    ContentService
  ],
  multi: true,
};
