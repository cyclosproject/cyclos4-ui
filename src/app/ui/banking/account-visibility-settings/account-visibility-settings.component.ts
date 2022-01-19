import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DataForUserAccountVisibility, UserAccountVisibility } from 'app/api/models';
import { AccountVisibilityService } from 'app/api/services/account-visibility.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * Displays the settings for account visibility of a given user
 */
@Component({
  selector: 'account-visibility-settings',
  templateUrl: 'account-visibility-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountVisibilitySettingsComponent
  extends BasePageComponent<DataForUserAccountVisibility>
  implements OnInit {

  userParam: string;
  isSelf: boolean;

  accounts: FormControl;

  constructor(
    injector: Injector,
    private accountVisibilityService: AccountVisibilityService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the parameters
    const params = this.route.snapshot.params;
    this.userParam = params.user;

    // Get the account history data
    this.accountVisibilityService.getUserAccountVisibilityData({ user: this.userParam })
      .subscribe(data => this.data = data);
  }

  onDataInitialized(data: DataForUserAccountVisibility) {
    this.isSelf = this.authHelper.isSelf(data.user);
    const visible = data.accounts.filter(a => a.visible).map(a => a.type.id);
    this.accounts = new FormControl(visible);
  }

  getDisplay(account: UserAccountVisibility) {
    return account.number ? account.type.name + ' - ' + account.number : account.type.name;
  }

  save() {
    this.addSub(this.accountVisibilityService.saveUserAccountVisibility({
      user: this.userParam,
      body: {
        accounts: this.accounts.value
      }
    }).subscribe(() => {
      if (this.isSelf) {
        // Fetch again the permissions and reload the menu
        this.addSub(this.dataForFrontendHolder.reload().subscribe(() => {
          this.menu.setActiveMenu(Menu.ACCOUNT_VISIBILTIY);
          this.notification.snackBar(this.i18n.account.visibilitySettings.saved);
        }));
      } else {
        this.notification.snackBar(this.i18n.account.visibilitySettings.saved);
        this.reload();
      }
    }));
  }

  resolveMenu(data: DataForUserAccountVisibility): Menu | ActiveMenu | Observable<Menu | ActiveMenu> {
    return this.menu.userMenu(data.user, Menu.ACCOUNT_VISIBILTIY);
  }
}
