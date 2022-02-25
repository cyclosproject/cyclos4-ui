import { Location } from '@angular/common';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'app/../environments/environment';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ScriptLoaderService } from 'app/core/script-loader.service';
import { StateManager } from 'app/core/state-manager';
import { ApiHelper } from 'app/shared/api-helper';
import { apiUrl, empty, i18nRoot, initializeStyleLinks, isSameOrigin } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, filter, first, switchMap } from 'rxjs/operators';

declare const UpUp: any;

// Initializes the shared services
export function initialize(
  location: Location,
  apiConfig: ApiConfiguration,
  i18nLoading: I18nLoadingService,
  iconLoading: IconLoadingService,
  dataForFrontendHolder: DataForFrontendHolder,
  nextRequestState: NextRequestState,
  router: Router,
  breadcrumb: BreadcrumbService,
  stateManager: StateManager,
  scriptLoader: ScriptLoaderService
): () => any {
  return async () => {
    const apiRoot = apiUrl();

    // Will split the session token if running on the same origin as the API
    nextRequestState.useCookie = isSameOrigin(apiRoot);

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


    // Initialize the style links
    initializeStyleLinks();

    // Initialize the data for frontend
    dataForFrontendHolder.registerLoadHook(d => {
      const dataForUi = d?.dataForUi || {};
      // Initialize the translations loading
      return i18nLoading.initialize(i18nRoot(apiRoot), { resourceCacheKey: dataForUi.resourceCacheKey, locale: dataForUi.currentLocale.code })
        .pipe(switchMap(() => of(d)));
    });
    dataForFrontendHolder.registerLoadHook(d => {
      const icons = ['qr-code', 'calendar-week', 'question', ...(d?.svgIconNames || [])];
      return iconLoading.load(icons)
        .pipe(
          switchMap(() => of(d)),
          catchError(() => of(d)));
    });
    dataForFrontendHolder.registerLoadHook(d => {
      if (ApiHelper.isRestrictedAccess(d)) {
        // Handle redirects on urgent situations
        const auth = d?.dataForUi?.auth || {};
        let redirect: string = null;
        if (auth.pendingAgreements) {
          redirect = '/post-login/pending-agreements';
        } else if (auth.expiredPassword || auth.expiredSecondaryPassword) {
          redirect = '/post-login/expired-password';
        } else if (auth.pendingSecondaryPassword) {
          redirect = '/post-login/login-confirmation';
        }
        setTimeout(() => {
          if (redirect && router.url !== redirect) {
            breadcrumb.clear();
            stateManager.clear();
            router.navigateByUrl(redirect);
          }
        }, 1);
      }
      return of(d);
    });
    if (environment.production && !environment.standalone) {
      dataForFrontendHolder.registerLoadHook(d => {
        return scriptLoader.loadScript('upup.min.js').pipe(
          switchMap(() => {
            if (UpUp) {
              // Service workers are not available in Firefox private mode
              UpUp.start({
                'service-worker-url': 'upup.sw.min.js',
                'cache-version': d.dataForUi.resourceCacheKey,
                'content-url': 'offline'
              });
            }
            return of(d);
          }));
      });
    }
    const dataForFrontend$ = dataForFrontendHolder.initialize();
    const themeLoaded$ = timer(1000, 500).pipe(filter(() => {
      const style = getComputedStyle(document.body);
      return !empty(style.getPropertyValue('--primary').trim());
    }), first());


    return forkJoin([dataForFrontend$, themeLoaded$]).toPromise();
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
    NextRequestState,
    Router,
    BreadcrumbService,
    StateManager,
    ScriptLoaderService
  ],
  multi: true,
};
