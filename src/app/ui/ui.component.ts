import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataForFrontend, UnauthorizedError, UnauthorizedErrorCode } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LayoutService } from 'app/core/layout.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ArrowsVertical, ShortcutService } from 'app/core/shortcut.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { handleKeyboardFocus, setRootSpinnerVisible } from 'app/shared/helper';
import { LoginState } from 'app/ui/core/login-state';
import { LoginService } from 'app/ui/core/login.service';
import { MenuService } from 'app/ui/core/menu.service';
import { SidenavComponent } from 'app/ui/core/sidenav.component';
import { UiErrorHandlerService } from 'app/ui/core/ui-error-handler.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ui-root',
  templateUrl: './ui.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiComponent implements OnInit {

  @HostBinding('class.root') root = true;
  @ViewChild(SidenavComponent) sidenav: SidenavComponent;
  @ViewChild('mainContainer') mainContainer: ElementRef;

  initialized$ = new BehaviorSubject(false);
  loggingOut$ = new BehaviorSubject(false);

  title: string;
  menuBar: boolean;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    public dataForFrontendHolder: DataForFrontendHolder,
    public login: LoginService,
    public loginState: LoginState,
    public menu: MenuService,
    public layout: LayoutService,
    public uiLayout: UiLayoutService,
    @Inject(I18nInjectionToken) public i18n: I18n,
    private nextRequestState: NextRequestState,
    private shortcut: ShortcutService,
    private errorHandler: ErrorHandlerService,
    private uiErrorHandler: UiErrorHandlerService
  ) {
  }

  ngOnInit() {
    window['navigate'] = (url: string | HTMLAnchorElement, event?: Event) => {
      this.ngZone.run(() => {
        if (typeof url === 'object') {
          url = url.href;
        }
        this.menu.navigate({ url, event });
      });
    };
    this.uiErrorHandler.initialize();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.dataForFrontendHolder.subscribe(dataForFrontend => {
      if (dataForFrontend != null) {
        this.doInitialize(dataForFrontend);
      }
    });
    if (this.dataForFrontendHolder.dataForFrontend) {
      this.doInitialize(this.dataForFrontendHolder.dataForFrontend);
    }
    this.loginState.subscribeForLoggingOut(flag => this.loggingOut$.next(flag));

    // Some browsers (like Firefox) show an outline on focused anchors.
    // After the page is loaded, blur the menus, so none will be outlined
    this.uiLayout.currentPage$.subscribe(() => {
      const focused = document.activeElement as HTMLElement;
      if (focused.tagName === 'A') {
        try {
          focused.blur();
        } catch (e) { }
      }
    });

    // Indicate that Cyclos has finished loading, to prevent the root spinner from being shown on the onload event
    self['cyclosLoaded'] = true;

    // Hide the spinner, showing the application
    setRootSpinnerVisible(false);

    // Listen for vertical arrows events on mobile to change focus
    this.shortcut.subscribe(ArrowsVertical, e =>
      handleKeyboardFocus(this.layout, this.mainContainer.nativeElement, e));
  }

  private doInitialize(dataForFrontend: DataForFrontend) {
    this.initialized$.next(true);

    this.menuBar = dataForFrontend.menuBar;
    const dataForUi = (dataForFrontend || {}).dataForUi;
    const auth = (dataForUi || {}).auth || {};

    if (auth.unauthorizedAddress) {
      const error = { code: UnauthorizedErrorCode.UNAUTHORIZED_ADDRESS } as UnauthorizedError;
      this.nextRequestState.leaveNotification = true;
      this.errorHandler.handleUnauthorizedError(error);
    }
  }
}
