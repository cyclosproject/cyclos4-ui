import { Location } from '@angular/common';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'app/../environments/environment';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForFrontend } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ScriptLoaderService } from 'app/core/script-loader.service';
import { StateManager } from 'app/core/state-manager';
import { ApiHelper } from 'app/shared/api-helper';
import { apiUrl, empty, i18nRoot, initializeStyleLinks, isSameOrigin, setRootSpinnerVisible } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, filter, first, map, switchMap } from 'rxjs/operators';

declare const UpUp: any;
declare const dataForFrontend: DataForFrontend;

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

    const themeLoaded$ = timer(1000, 500).pipe(filter(() => {
      const style = getComputedStyle(document.body);
      return !empty(style.getPropertyValue('--primary').trim());
    }), first());

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
      return iconLoading.load(d?.svgIconNames || [])
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
        } else if (auth.expiredPassword) {
          redirect = '/post-login/expired-password';
        } else if (auth.loginConfirmation) {
          // If the user has no active credentials, redirect to the manage passwords page.
          // Otherwise, to the login confirmation page
          if (auth.loginConfirmation?.activeCredentials?.length) {
            redirect = '/post-login/login-confirmation';
          } else {
            redirect = '/users/self/passwords';
          }
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
    dataForFrontendHolder.registerLoadHook(d => {
      const theme = d.theme || {};
      if (theme.id && theme.lastModifiedInMillis) {
        const stylesLink = document.getElementById('stylesLink') as HTMLLinkElement;
        const url = stylesLink?.href;
        const marker = '/ui/theme.css';
        const pos = url?.indexOf(marker);
        if (pos > 0) {
          const newUrl = `${url.substring(0, pos + marker.length)}?id=${theme.id}&mod=${theme.lastModifiedInMillis}&k=${d.dataForUi?.resourceCacheKey}`;
          const root = document.querySelector('ui-root') as HTMLElement;
          if (newUrl !== url && root) {
            root.style.display = 'none';
            root.classList.remove('d-flex');
            setRootSpinnerVisible(true);
            document.head.removeChild(stylesLink);
            return timer(0).pipe(switchMap(() => {
              stylesLink.href = newUrl;
              document.head.appendChild(stylesLink);
              return themeLoaded$.pipe(map(() => {
                root.style.display = '';
                root.classList.add('d-flex');
                setRootSpinnerVisible(false);
                return d;
              }));
            }));
          }
        }
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
    const dataForFrontend$ = dataForFrontendHolder.initialize(dataForFrontend);


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
