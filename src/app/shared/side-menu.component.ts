import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountWithCurrency } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { ApiHelper } from 'app/shared/api-helper';
import { LayoutService } from 'app/shared/layout.service';
import { Menu, RootMenu, SideMenuEntries } from 'app/shared/menu';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { empty } from 'app/shared/helper';


/**
 * A context-specific menu shown on the side of the layout for medium+ screens
 */
@Component({
  selector: 'side-menu',
  templateUrl: 'side-menu.component.html',
  styleUrls: ['side-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideMenuComponent implements OnInit {
  constructor(
    public layout: LayoutService,
    public menu: MenuService,
    private router: Router,
    private login: LoginService,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager
  ) { }

  // Namespace for template
  ApiHelper = ApiHelper;

  get banking(): boolean {
    const menu = this.menu.activeMenu;
    return menu != null && menu.root === RootMenu.BANKING;
  }

  entries$ = new BehaviorSubject<SideMenuEntries>(null);
  subscription: Subscription;
  accountActiveObservables: { [key: string]: Observable<boolean> } = {};

  ngOnInit() {
    this.menu.activeMenu$.subscribe(menu => {
      this.updateFrom(menu);
    });
    this.updateFrom(this.menu.activeMenu);
  }

  private updateFrom(menu: Menu) {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.menu.sideMenu(menu)
      .subscribe(entries => this.entries$.next(entries));
  }

  onAccountClicked(event: MouseEvent, account: AccountWithCurrency) {
    this.goTo(event, Menu.ACCOUNT_HISTORY, this.accountLink(account));
  }

  goTo(event: MouseEvent, menu: Menu, url: string | string[]) {
    // Update the last selected menu entry
    this.menu.setActiveMenu(menu);

    // Clear the shared state
    this.breadcrumb.clear();
    this.stateManager.clear();

    // Navigate
    if (typeof url === 'string') {
      this.router.navigateByUrl(url);
    } else {
      this.router.navigate(url);
    }

    // Stop the event
    event.preventDefault();
    event.stopPropagation();
  }

  get accounts(): AccountWithCurrency[] {
    const permissions = ((this.login.auth || {}).permissions || {});
    const banking = permissions.banking || {};
    const accountPermissions = banking.accounts || [];
    return accountPermissions.map(p => p.account);
  }

  accountLink(account: AccountWithCurrency): string[] {
    return ['banking', 'account', ApiHelper.internalNameOrId(account.type)];
  }

  isAccountActive(account: AccountWithCurrency): Observable<boolean> {
    const type = account.type;
    return this.accountActiveObservable(ApiHelper.internalNameOrId(type));
  }

  private accountActiveObservable(type: string) {
    let observable = this.accountActiveObservables[type];
    if (!observable) {
      // 2 assignments
      observable = this.accountActiveObservables[type] = this.breadcrumb.breadcrumb$.pipe(
        map(bc => {
          const accounts = (bc || [])
            .filter(url => url.includes('/banking/account/'))
            .map(url => url.slice(url.lastIndexOf('/') + 1));
          return !empty(accounts) && accounts[0] === type;
        })
      );
    }
    return observable;
  }
}
