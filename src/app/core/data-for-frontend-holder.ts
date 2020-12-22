import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import {
  Auth, DataForFrontend, DataForUi, FrontendBanner, FrontendEnum,
  FrontendIcon, FrontendPage, FrontendScreenSizeEnum, RoleEnum, User
} from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { FrontendService } from 'app/api/services/frontend.service';
import { ErrorStatus } from 'app/core/error-status';
import { NextRequestState } from 'app/core/next-request-state';
import { I18n } from 'app/i18n/i18n';
import { isDevServer, setReloadButton, setRootAlert, urlJoin } from 'app/shared/helper';
import moment from 'moment-mini-ts';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

/**
 * Injectable used to hold the `DataForFrontend` instance used by the application
 */
@Injectable({
  providedIn: 'root',
})
export class DataForFrontendHolder {
  private loadHooks: ((dataForFrontend: DataForFrontend) => Observable<DataForFrontend>)[] = [];
  private dataForFrontend$ = new BehaviorSubject<DataForFrontend>(null);
  private timeDiff: number;

  constructor(
    private frontendService: FrontendService,
    private authService: AuthService,
    private i18n: I18n,
    private injector: Injector,
    private apiConfiguration: ApiConfiguration,
    private nextRequestState: NextRequestState) {
  }

  /**
   * Registers a hook that is executed on load
   */
  registerLoadHook(hook: (dataForFrontend: DataForFrontend) => Observable<DataForFrontend>) {
    this.loadHooks.push(hook);
  }

  /**
   * Returns a cold observer for initializing the `DataForFrontend` instance
   */
  initialize(): Observable<DataForFrontend> {
    return this.reload();
  }

  /**
   * Returns a cold observer for reloading the `DataForFrontend` instance
   */
  reload(retry = true): Observable<DataForFrontend> {
    const nextRequestState = this.nextRequestState;
    nextRequestState.ignoreNextError = true;
    return this.frontendService.dataForFrontend({
      screenSize: this.screenSize
    }).pipe(
      switchMap(dataForFrontend => {
        this.dataForFrontend = dataForFrontend;
        const dataForUi = (dataForFrontend || {}).dataForUi;
        if (dataForUi.auth == null || dataForUi.auth.user == null) {
          // When not logged-in, clear any previous cruft on the stored session token
          nextRequestState.setSessionToken(null);
        }

        if (dataForFrontend.frontend === FrontendEnum.CLASSIC && !isDevServer()) {
          // Redirect the user to the classic frontend
          this.redirectToClassicFrontend();
          return of(null);
        }

        this.updateIcons(dataForFrontend.icons);

        // Apply the load hook
        let result: Observable<DataForFrontend> = of(dataForFrontend);
        this.loadHooks.forEach(hook => {
          result = result.pipe(switchMap(hook));
        });

        return result;
      }),
      catchError((resp: HttpErrorResponse) => {
        // Maybe we're using an old session data. In that case, we have to clear the session and try again
        if (retry && nextRequestState.hasSession && [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
          // Clear the session token and try again
          nextRequestState.setSessionToken(null);
          return this.reload();
        } else {
          // The server couldn't be contacted
          let serverOffline = this.i18n.error.serverOffline;
          let reloadPage = this.i18n.general.reloadPage;
          if (serverOffline.startsWith('???')) {
            // We're so early that we couldn't even fetch translations
            serverOffline = 'The server couldn\'t be contacted.<br>Please, try again later.';
            reloadPage = 'Reload';
          }
          setRootAlert(serverOffline);
          setReloadButton(reloadPage);
          return;
        }
      }),
    );
  }

  get dataForUi(): DataForUi {
    return (this.dataForFrontend || {}).dataForUi;
  }

  get dataForFrontend(): DataForFrontend {
    return this.dataForFrontend$.value;
  }

  set dataForFrontend(dataForFrontend: DataForFrontend) {
    if (dataForFrontend != null) {
      this.dataForFrontend$.next(dataForFrontend);
      const dataForUi = (dataForFrontend || {}).dataForUi;
      // Store the time diff
      this.timeDiff = new Date().getTime() - moment(dataForUi.currentClientTime).toDate().getTime();
    }
  }

  get auth(): Auth {
    return (this.dataForUi || {}).auth;
  }

  get user(): User {
    return (this.auth || {}).user;
  }

  get role(): RoleEnum {
    return (this.auth || {}).role;
  }

  get pages(): FrontendPage[] {
    return (this.dataForFrontend || {}).pages || [];
  }

  get banners(): FrontendBanner[] {
    return (this.dataForFrontend || {}).banners || [];
  }

  /**
   * Returns a page by internal name
   */
  page(slug: string) {
    const pages = (this.dataForFrontend || {}).pages || [];
    return pages.find(p => p.internalName === slug || p.id === slug);
  }

  /**
   * As the client clock may be wrong, we consider the server clock
   */
  now(): moment.Moment {
    const date = new Date();
    date.setTime(date.getTime() + this.timeDiff);
    return moment(date);
  }

  /**
   * Adds a new observer subscription for DataForFrontend change events
   */
  subscribe(next?: (dataForFrontend: DataForFrontend) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.dataForFrontend$.subscribe(next, error, complete);
  }

  /**
   * Replaces the given session token with a new one.
   * Handles any exception and uses the session token as is,
   * because this operation is only supported in Cyclos 4.12 onwards.
   */
  replaceSession(sessionToken: string): Observable<void> {
    const nextRequestState = this.injector.get(NextRequestState);

    // Setup the basic authentication for the login request
    nextRequestState.nextAsGuest();
    nextRequestState.ignoreNextError = true;
    return this.authService.replaceSession({
      sessionToken,
      cookie: nextRequestState.useCookie,
    }).pipe(
      map(newSessionToken => {
        // Store the session token
        nextRequestState.setSessionToken(newSessionToken);
        return null;
      }),
      catchError((response: HttpErrorResponse) => {
        let actualSessionValue = null;
        if (response.status === ErrorStatus.NOT_FOUND) {
          // Not found means that the server is Cyclos 4.11, which doesn't implement replaceSession
          actualSessionValue = sessionToken;
        }
        nextRequestState.setSessionToken(actualSessionValue);
        return of(null);
      }),
    );
  }

  /**
   * Save a preference (optionally) to use the classic frontend, and redirect the user.
   */
  useClassicFrontend(savePreference = true) {
    if (savePreference) {
      // Save the preference first...
      this.frontendService.saveFrontendSettings({
        body: { frontend: FrontendEnum.CLASSIC }
      }).subscribe(() => {
        // ... then redirect
        this.redirectToClassicFrontend();
      });
    } else {
      // Just redirect
      this.redirectToClassicFrontend();
    }
  }

  private redirectToClassicFrontend() {
    const url = window.location.href;
    const pos = url.indexOf('/ui/');
    if (pos >= 0) {
      window.location.assign(`${url.substr(0, pos)}/classic`);
    } else {
      window.location.assign(urlJoin(this.apiConfiguration.rootUrl, '..', 'classic'));
    }
  }

  /** Initialize the shortcut icons */
  private updateIcons(icons: FrontendIcon[]) {
    for (const icon of icons || []) {
      const id = `link_${icon.rel}_${icon.width || 0}x${icon.height || 0}`;
      let link = document.getElementById(id) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = icon.rel;
        link.id = id;
        if (icon.width && icon.height) {
          link.setAttribute('sizes', `${icon.width}x${icon.height}`);
        }
        document.head.appendChild(link);
      }
      link.href = icon.url;
    }
  }

  private get screenSize(): FrontendScreenSizeEnum {
    // We can't use layoutService because that would cause a circular dependency
    const classes = document.body.classList;
    if (classes.contains('xxs')) {
      return FrontendScreenSizeEnum.FEATURE;
    } else if (classes.contains('lt-md')) {
      return FrontendScreenSizeEnum.MOBILE;
    } else if (classes.contains('md')) {
      return FrontendScreenSizeEnum.TABLET;
    } else {
      return FrontendScreenSizeEnum.DESKTOP;
    }
  }
}
