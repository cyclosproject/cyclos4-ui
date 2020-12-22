import { Location } from '@angular/common';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { NextRequestState } from 'app/core/next-request-state';
import { isDevServer, urlJoin } from 'app/shared/helper';
import { concat, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

// Initializes the shared services
export function initialize(
  location: Location,
  apiConfig: ApiConfiguration,
  i18nLoading: I18nLoadingService,
  iconLoading: IconLoadingService,
  dataForFrontendHolder: DataForFrontendHolder,
  nextRequestState: NextRequestState
): () => any {
  return async () => {
    let apiRoot = 'api';
    if (!isDevServer()) {
      let href = window.location.href;
      if (!href.endsWith('/')) {
        href += '/';
      }
      const pos = href.indexOf('/ui/');
      if (pos >= 0) {
        apiRoot = href.substr(0, pos) + '/api';
      }
    }
    console.log(`Using API root = ${apiRoot}`);

    // Will split the session token if running on the same origin and not in Angular's development server
    nextRequestState.useCookie = !isDevServer();

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
    // Initialize the API configuration
    apiConfig.rootUrl = apiRoot;

    // Initialize the translations loading
    const i18nRoot = apiRoot === 'api' ? 'i18n' : apiRoot + '/../ui/i18n';
    const i18n$ = i18nLoading.initialize(i18nRoot);

    // Initialize the icons root
    const iconRoot = apiRoot === 'api' ? 'svg' : apiRoot + '/../ui/svg';
    iconLoading.iconRoot = iconRoot;

    // Initialize the data for frontend
    dataForFrontendHolder.registerLoadHook(dataForFrontend => {
      const dataForUi = dataForFrontend?.dataForUi || {};
      const language = (dataForUi.language || { code: 'en' }).code;
      const country = dataForUi.country;
      return i18nLoading.load(language, country)
        .pipe(switchMap(() => of(dataForFrontend)));
    });
    dataForFrontendHolder.registerLoadHook(dataForFrontend => {
      nextRequestState.ignoreNextError = true;
      return iconLoading.load(dataForFrontend?.svgIconNames || [])
        .pipe(
          switchMap(() => of(dataForFrontend)),
          catchError(() => of(dataForFrontend)));
    });
    if (isDevServer()) {
      dataForFrontendHolder.registerLoadHook(dataForFrontend => {
        const link = document.getElementById('robotoLink') as HTMLLinkElement;
        link.href = urlJoin(dataForFrontend.dataForUi.rootUrl, 'fonts/roboto.css');
        return of(null);
      });
    }
    const dataForFrontend$ = dataForFrontendHolder.initialize();

    return await concat(i18n$, dataForFrontend$).toPromise();
  };
}
export const INITIALIZE: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initialize,
  deps: [
    Location,
    ApiConfiguration,
    I18nLoadingService,
    IconLoadingService,
    DataForFrontendHolder,
    NextRequestState
  ],
  multi: true,
};
