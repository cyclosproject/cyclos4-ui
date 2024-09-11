import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DataForEmailUnsubscribe } from 'app/api/models/data-for-email-unsubscribe';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { i18nRoot as getI18Root, initializeStyleLinks, setRootSpinnerVisible } from 'app/shared/helper';
import { UnsubscribeState } from 'app/unsubscribe/unsubscribe-state';
import { BehaviorSubject } from 'rxjs';

// The API root URL is declared in the host page
declare let apiRoot: string;
@Component({
  selector: 'unsubscribe-root',
  templateUrl: 'unsubscribe.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsubscribeComponent implements OnInit {
  title: string;
  spinner: string;
  initialized$ = new BehaviorSubject(false);

  constructor(
    @Inject(I18nInjectionToken) public i18n: I18n,
    private i18nLoading: I18nLoadingService,
    private iconLoading: IconLoadingService,
    public state: UnsubscribeState,
    private apiConfiguration: ApiConfiguration,
    private titleRef: Title
  ) {}

  ngOnInit() {
    const paths = window.location.pathname.split('/');
    const locator = paths[paths.length - 1];

    if (!apiRoot) {
      apiRoot = '/api';
    }
    this.apiConfiguration.rootUrl = apiRoot;

    // Initialize the translations loading
    const i18nRoot = getI18Root(apiRoot);

    // Initialize the stylesheet links
    initializeStyleLinks();

    // As we only use a single icon for the error dialog, its content is embedded in the index html
    const icon = document.getElementById('bi-exclamation-triangle');
    this.iconLoading.store({ 'exclamation-triangle': icon.innerHTML.trim() });

    // Indicate that Cyclos has finished loading, to prevent the root spinner from being shown on the onload event
    self['cyclosLoaded'] = true;
    // Hide the spinner, showing the application
    setRootSpinnerVisible(false);

    this.state.initialize(locator).subscribe(data => {
      this.i18nLoading.initialize(i18nRoot, data).subscribe(() => this.initialize(data));
    });
  }

  get data(): DataForEmailUnsubscribe {
    return this.state.data$.value;
  }

  public initialize(data: DataForEmailUnsubscribe) {
    this.titleRef.setTitle(data.applicationName);
    document.documentElement.setAttribute('lang', data.locale.split(/_/g)[0]);
    const shortcutIcon = document.createElement('link');
    shortcutIcon.href = data.shortcutIcon.url;
    shortcutIcon.rel = 'icon';
    document.head.appendChild(shortcutIcon);

    this.initialized$.next(true);
  }
}
