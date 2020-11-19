import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataForFrontend } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { LayoutService } from 'app/core/layout.service';
import { ArrowsVertical, ShortcutService } from 'app/core/shortcut.service';
import { StateManager } from 'app/core/state-manager';
import { I18n } from 'app/i18n/i18n';
import { handleKeyboardFocus, setRootSpinnerVisible } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
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

  @ViewChild(SidenavComponent) sidenav: SidenavComponent;
  @ViewChild('mainContainer') mainContainer: ElementRef;

  initialized$ = new BehaviorSubject(false);
  loggingOut$ = new BehaviorSubject(false);

  title: string;
  menuBar: boolean;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private dataForFrontendHolder: DataForFrontendHolder,
    public login: LoginService,
    public loginState: LoginState,
    public menu: MenuService,
    public layout: LayoutService,
    public uiLayout: UiLayoutService,
    public i18n: I18n,
    private stateManager: StateManager,
    private breadcrumb: BreadcrumbService,
    private shortcut: ShortcutService,
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

    // Handle redirects on urgent situations
    let redirect: string = null;
    if (auth.pendingAgreements) {
      redirect = '/pending-agreements';
    } else if (auth.expiredPassword || auth.expiredSecondaryPassword) {
      redirect = '/expired-password';
    } else if (auth.pendingSecondaryPassword) {
      redirect = '/login-confirmation';
    }
    setTimeout(() => {
      if (redirect && this.router.url !== redirect) {
        this.breadcrumb.clear();
        this.stateManager.clear();
        this.router.navigateByUrl(redirect);
      }
    }, 1);
  }
}
