import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { ConsentState } from 'app/consent/consent-state';
import { OidcDataForConsent } from 'app/consent/models/oidc-data-for-consent';
import { OidcService } from 'app/consent/oidc.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { i18nRoot as getI18Root, initializeStyleLinks, setRootSpinnerVisible } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

// The API root URL is declared in the host page
declare const apiRoot: string;

@Component({
  selector: 'consent-root',
  templateUrl: 'consent.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsentComponent implements OnInit {
  title: string;
  spinner: string;
  initialized$ = new BehaviorSubject(false);

  constructor(
    @Inject(I18nInjectionToken) public i18n: I18n,
    private i18nLoading: I18nLoadingService,
    private errorHandler: ErrorHandlerService,
    private iconLoading: IconLoadingService,
    public state: ConsentState,
    private oidcService: OidcService
  ) {
    oidcService.rootUrl = apiRoot.endsWith('/') ? apiRoot.substring(0, apiRoot.length - 1) : apiRoot;
    state.redirecting$.subscribe(flag => {
      if (flag) {
        // When redirecting back, set the initialized to false, which will show the spinner
        this.initialized$.next(false);
      }
    });
  }

  ngOnInit() {
    const paths = window.location.pathname.split('/');
    const locator = paths[paths.length - 1];

    // Initialize the translations loading
    const i18nRoot = getI18Root(this.oidcService.rootUrl);

    // Initialize the stylesheet links
    initializeStyleLinks();

    // As we only use a few icons, their content are embedded in the index html
    const iconNames = ['exclamation-triangle', 'eye', 'eye-slash'];
    iconNames.forEach(name => {
      const icon = {};
      icon[name] = document.getElementById(`bi-${name}`).innerHTML.trim();
      this.iconLoading.store(icon);
    });

    // Indicate that Cyclos has finished loading, to prevent the root spinner from being shown on the onload event
    self['cyclosLoaded'] = true;
    // Hide the spinner, showing the application
    setRootSpinnerVisible(false);

    //in case of the consent app we do not request any api method (i.e below /api)
    //then the default error handling in the api-interceptor does not run
    //that is why we need to manually handle the errors on any request
    this.state.initialize(locator).subscribe(
      data => {
        this.i18nLoading.initialize(i18nRoot, data).subscribe(() => this.initialize(data));
      },
      e => this.errorHandler.handleHttpError(e)
    );
  }

  get data(): OidcDataForConsent {
    return this.state.data$.value;
  }

  private initialize(data: OidcDataForConsent) {
    const params = {
      client: data.client.name,
      app: data.applicationName
    };
    this.title = data.openidOnly ? this.i18n.consent.titleOpenidOnly(params) : this.i18n.consent.title(params);

    document.documentElement.setAttribute('lang', data.locale.split(/_/g)[0]);
    const shortcutIcon = document.createElement('link');
    shortcutIcon.href = data.shortcutIcon.url;
    shortcutIcon.rel = 'icon';
    document.head.appendChild(shortcutIcon);

    this.initialized$.next(true);
  }
}
